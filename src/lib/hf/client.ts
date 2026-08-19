/**
 * Hugging Face Vision-Language Client (Fallback AI Provider)
 *
 * HTTP-only (fetch) client for chat completion vision-language models such as
 * Qwen/Qwen3-VL-30B-A3B-Instruct. Used as an automatic fallback when the
 * primary AI provider (Gemini) fails with retryable errors.
 *
 * Env vars (server-side only):
 *   HF_TOKEN    — required Hugging Face API token (Bearer). Never logged.
 *   HF_MODEL    — model id, default "Qwen/Qwen3-VL-30B-A3B-Instruct".
 *   HF_BASE_URL — optional endpoint override.
 *                 Default: https://api-inference.huggingface.co
 *                 (classic Inference API → /models/{model}/v1/chat/completions)
 *                 Set to https://router.huggingface.co/v1 to use Inference
 *                 Providers (OpenAI-compatible router).
 */

export const HF_DEFAULT_MODEL = 'Qwen/Qwen3-VL-30B-A3B-Instruct';
export const HF_DEFAULT_BASE_URL = 'https://api-inference.huggingface.co';
export const HF_DEFAULT_TIMEOUT_MS = 80 * 1000;

export function getHfModel(): string {
  return process.env.HF_MODEL?.trim() || HF_DEFAULT_MODEL;
}

export function getHfBaseUrl(): string {
  return process.env.HF_BASE_URL?.trim() || HF_DEFAULT_BASE_URL;
}

function buildEndpoint(baseUrl: string, model: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (/\/v1\/?$/.test(base)) {
    // Inference Providers router style: https://router.huggingface.co/v1
    return `${base}/chat/completions`;
  }
  // Classic Inference API style: /models/{model}/v1/chat/completions
  return `${base}/models/${encodeURIComponent(model)}/v1/chat/completions`;
}

export class HuggingFaceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 0, code = 'HF_ERROR') {
    super(message);
    this.name = 'HuggingFaceError';
    this.status = status;
    this.code = code;
  }
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.text();
    const trimmed = body.trim();
    if (!trimmed) return res.statusText;
    return trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed;
  } catch {
    return res.statusText;
  }
}

async function sendRequest(
  endpoint: string,
  token: string,
  model: string,
  body: Record<string, unknown>,
  signal: AbortSignal
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
}

export interface HfVisionRequest {
  /** Data URL in the form `data:<mime>;base64,<data>` of the certificate image. */
  dataUrl: string;
  prompt: string;
  timeoutMs?: number;
}

/**
 * Call Hugging Face chat completion for a vision-language model.
 * Returns the assistant's raw text content (expected to be JSON).
 * Throws HuggingFaceError on any failure; the token is never part of errors.
 */
export async function callHuggingFaceVision({
  dataUrl,
  prompt,
  timeoutMs = HF_DEFAULT_TIMEOUT_MS,
}: HfVisionRequest): Promise<string> {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) {
    throw new HuggingFaceError(
      'Hugging Face fallback skipped: HF_TOKEN is not configured',
      0,
      'MISSING_CONFIG'
    );
  }

  const model = getHfModel();
  const endpoint = buildEndpoint(getHfBaseUrl(), model);

  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let lastError: unknown = null;

  try {
    // Single retry for transient HTTP failures (429/5xx) as allowed.
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const res = await sendRequest(endpoint, token, model, body, controller.signal);

        if (res.ok) {
          const data = await res.json();
          const content =
            data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null;
          if (typeof content !== 'string' || content.trim() === '') {
            throw new HuggingFaceError(
              'Hugging Face returned an empty response',
              res.status,
              'EMPTY'
            );
          }
          return content.trim();
        }

        const detail = await readErrorDetail(res);
        if (res.status === 429 || res.status >= 500) {
          lastError = new HuggingFaceError(
            `Hugging Face API HTTP ${res.status}: ${detail}`,
            res.status,
            `HF_HTTP_${res.status}`
          );
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          continue;
        }

        throw new HuggingFaceError(
          `Hugging Face API HTTP ${res.status}: ${detail}`,
          res.status,
          `HF_HTTP_${res.status}`
        );
      } catch (err) {
        if (err instanceof HuggingFaceError && err.status === 0 && err.code === 'MISSING_CONFIG') {
          throw err;
        }
        lastError = err;
        if (attempt === 0 && controller.signal.aborted) {
          // No retry after a timeout.
          break;
        }
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (controller.signal.aborted) {
      throw new HuggingFaceError('Hugging Face API timeout', 408, 'HF_TIMEOUT');
    }
    if (lastError instanceof HuggingFaceError) throw lastError;
    throw new HuggingFaceError(
      lastError instanceof Error ? lastError.message : 'Hugging Face request failed',
      0,
      'HF_ERROR'
    );
  } finally {
    clearTimeout(timeout);
  }
}