/**
 * Normalizer for Hugging Face (Qwen-VL) vision-language output.
 *
 * Converts the raw assistant text from the Hugging Face fallback provider into
 * a plain object that satisfies the existing CertiAI `combinedSchema`
 * (snake_case, see src/lib/ai/pipeline.ts). Handles Markdown ```json wrappers,
 * JSON parsing, and loose type coercion because open models are less reliable
 * about types than Gemini's structured output.
 *
 * The returned value is still validated with `combinedSchema.parse()` by the
 * caller so the existing schema remains the single source of truth.
 */

import type { CombinedAnalysisResult } from '@/lib/ai/pipeline';

function stripCodeFence(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return clean;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed.toLowerCase() === 'null' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'valid', 'layak'].includes(t)) return true;
    if (['false', '0', 'no', 'invalid', 'tidak'].includes(t)) return false;
  }
  return fallback;
}

function sanitizeDate(value: unknown): string | null {
  const str = toStringOrNull(value);
  if (!str) return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[0];
  const parsed = Date.parse(str);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  return null;
}

/**
 * Parse and normalize a Hugging Face (Qwen-VL) response into a plain object
 * shaped like `CombinedAnalysisResult`. Throws on invalid JSON.
 */
export function normalizeQwenResult(rawText: string): Record<string, unknown> {
  const clean = stripCodeFence(rawText);
  const json = JSON.parse(clean) as Record<string, unknown>;

  const weight = toNumberOrNull(json.weight);
  const confidence = toNumberOrNull(json.confidence);
  const duration = toNumberOrNull(json.duration_hours);

  return {
    participant_name: toStringOrNull(json.participant_name),
    activity_name: toStringOrNull(json.activity_name),
    organizer: toStringOrNull(json.organizer),
    event_date: sanitizeDate(json.event_date),
    duration_hours: duration,
    activity_type: toStringOrNull(json.activity_type),
    certificate_number: toStringOrNull(json.certificate_number),
    level: toStringOrNull(json.level),
    valid: toBoolean(json.valid, true),
    category: toStringOrNull(json.category) ?? toStringOrNull(json.activity_type) ?? 'Seminar',
    weight:
      weight !== null
        ? Math.max(0, Math.round(weight))
        : toNumberOrNull(json.recommended_weight) ?? 1,
    confidence:
      confidence !== null
        ? Math.min(1, Math.max(0, confidence))
        : toNumberOrNull(json.relevance_score) ?? 0.9,
    reason: toStringOrNull(json.reason) ?? '',
    recommendation: toStringOrNull(json.recommendation) ?? 'Layak disetujui',
  } satisfies Record<string, unknown>;
}

export type NormalizedQwenResult = CombinedAnalysisResult;