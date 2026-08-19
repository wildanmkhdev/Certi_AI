/**
 * AI Pipeline for Certificate Analysis (Single-Pass Optimized)
 *
 * Combines extraction and weight analysis into 1 single Gemini 3.5 Flash call
 * reducing execution time from ~9s to ~3s.
 */

import { ai } from '@/lib/gemini/client';
import { callHuggingFaceVision, getHfModel } from '@/lib/hf/client';
import { normalizeQwenResult } from '@/lib/hf/normalize';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// ─── Timeout helper ────────────────────────────────────────────────────────────

/**
 * Race a promise against a timeout. The timer is cleared once the race settles
 * and a no-op rejection handler is attached to the losing promise so a late
 * provider failure never surfaces as an unhandled rejection.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  // Swallow the provider rejection if the timeout wins the race.
  promise.catch(() => {});
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ─── Combined Schema ──────────────────────────────────────────────────────────

export const combinedSchema = z.object({
  participant_name: z.string().nullable().default(null),
  activity_name: z.string().nullable().default(null),
  organizer: z.string().nullable().default(null),
  event_date: z.string().nullable().default(null),
  duration_hours: z.number().nullable().default(null),
  activity_type: z.string().nullable().default(null),
  certificate_number: z.string().nullable().default(null),
  level: z.string().nullable().default(null), // local / national / international
  valid: z.boolean().default(true),
  category: z.string().nullable().default('Seminar'),
  weight: z.number().default(1),
  confidence: z.number().min(0).max(1).default(0.9),
  reason: z.string().nullable().default(''),
  recommendation: z.string().nullable().default('Layak disetujui'),
});

export type CombinedAnalysisResult = z.infer<typeof combinedSchema>;

export interface PipelineResult {
  extraction: {
    participant_name: string | null;
    activity_name: string | null;
    organizer: string | null;
    event_date: string | null;
    duration_hours: number | null;
    activity_type: string | null;
    certificate_number: string | null;
    level: string | null;
  };
  analysis: {
    valid: boolean;
    category: string | null;
    weight: number;
    confidence: number;
    reason: string | null;
    recommendation: string | null;
  };
  modelName: string;
}

// ─── Mock Fallback ────────────────────────────────────────────────────────────

function mockPipeline(fileName: string): PipelineResult {
  const lower = fileName.toLowerCase();
  let category = 'Seminar';
  let weight = 1;
  let activity_name = 'Seminar Nasional Teknologi';
  let organizer = 'Universitas Terbuka';

  if (lower.includes('workshop') || lower.includes('work')) {
    category = 'Workshop';
    weight = 1;
    activity_name = 'Workshop Pengembangan Web';
    organizer = 'Developer Circle';
  } else if (lower.includes('comp') || lower.includes('lomba')) {
    category = 'Competition';
    weight = 2;
    activity_name = 'Kompetisi Pemrograman Nasional';
    organizer = 'Kemendikbud';
  } else if (lower.includes('cert') || lower.includes('sertifikasi')) {
    category = 'Certification';
    weight = 3;
    activity_name = 'Sertifikasi Cloud Architect';
    organizer = 'AWS Academy';
  }

  return {
    extraction: {
      participant_name: 'Mock Participant',
      activity_name,
      organizer,
      event_date: new Date().toISOString().split('T')[0],
      duration_hours: 8,
      activity_type: category,
      certificate_number: null,
      level: 'national',
    },
    analysis: {
      valid: true,
      category,
      weight,
      confidence: 0.9,
      reason: `Mock AI: Mendeteksi ${category} dari nama file. Bobot ${weight} sesuai aturan.`,
      recommendation: 'Layak disetujui',
    },
    modelName: 'mock-ai-fallback',
  };
}

// ─── Main Pipeline Entry Point (Single Pass) ──────────────────────────────────

export async function runPipeline(
  certificateId: string
): Promise<PipelineResult> {
  const supabase = createAdminClient();

  // 1. Fetch certificate row
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .single();

  if (error || !cert) {
    throw new Error(`Certificate not found: ${certificateId}`);
  }

  // 2. Fetch active rules for prompt context
  const { data: allRules } = await supabase
    .from('weight_rules')
    .select('*')
    .eq('is_active', true);

  const rulesContextStr = JSON.stringify(allRules ?? [], null, 2);

  // 3. API key check
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const isMock = !apiKey || apiKey === 'your-gemini-api-key';

  if (isMock) {
    console.warn('[Pipeline] MOCK MODE ACTIVE: GEMINI_API_KEY is not set or default.');
    await new Promise(r => setTimeout(r, 1000));
    return mockPipeline(cert.file_name);
  }

  // Set a timeout promise. Must stay BELOW Vercel's maxDuration (300s)
  // so the mock fallback always runs before the function is killed.
  // Budget: Gemini (90s) + OpenRouter (90s) + Hugging Face (80s) + overhead
  // stays under Vercel's 300s maxDuration.
  // NOTE: use withTimeout() so losing timeout promises never leak
  // unhandledRejection errors after the race is already won.
  const geminiTimeout = 90 * 1000;
  const openRouterTimeout = 90 * 1000;
  const hfTimeout = 80 * 1000;

  // 4. Download file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('certificates')
    .download(cert.file_path);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message ?? 'Failed to download certificate file');
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = cert.file_type;

  // 5. Construct Single-Pass Prompt
  const prompt = `Kamu adalah sistem AI verifikasi sertifikat akademik otomatis.
Tugasmu:
1. Ekstrak data faktual dari berkas sertifikat yang diberikan.
2. Klasifikasikan jenis kegiatan dan tentukan rekomendasi bobot akademik berdasarkan aturan bobot UINSU berikut:

Aturan Bobot UINSU:
${rulesContextStr}

Tuntunan Aturan Ringkas:
- Workshop 4-8 jam = Bobot 1
- Workshop >8 jam = Bobot 2
- Seminar / Webinar = Bobot 1
- Kompetisi: Lokal (1), Nasional (2), Internasional (3)
- Sertifikasi Keahlian = Bobot 3

WAJIB mengembalikan JSON yang valid dengan struktur berikut:
{
  "participant_name": "Nama lengkap peserta di sertifikat (atau null)",
  "activity_name": "Judul/nama lengkap kegiatan (atau null)",
  "organizer": "Institusi/penyelenggara kegiatan (atau null)",
  "event_date": "YYYY-MM-DD (atau null jika tidak ada)",
  "duration_hours": angka_durasi_jam_sebagai_number (atau null),
  "activity_type": "Kategori: Workshop / Seminar / Webinar / Competition / Certification / Committee / Organization / Other",
  "certificate_number": "Nomor sertifikat (atau null)",
  "level": "Tingkat: local / national / international (atau null)",
  "valid": true/false,
  "category": "Kategori final",
  "weight": angka_bobot_rekomendasi,
  "confidence": angka_kepercayaan_0_sampai_1,
  "reason": "Alasan singkat mengapa valid dan mengapa bobot ini dipilih",
  "recommendation": "Rekomendasi untuk dosen (Layak disetujui / Perlu verifikasi lebih lanjut / Tidak layak)"
}

Hanya kembalikan JSON yang valid tanpa teks tambahan.`;

  const startTime = Date.now();

  let responseText: string | null = null;
  let modelName = 'gemini-3.6-flash';

  // 1) Try Gemini first
  try {
    console.log(`[Pipeline] Gemini 3.6 Flash starting for: ${cert.file_name}`);
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              participant_name: { type: 'STRING', nullable: true },
              activity_name: { type: 'STRING', nullable: true },
              organizer: { type: 'STRING', nullable: true },
              event_date: { type: 'STRING', nullable: true },
              duration_hours: { type: 'NUMBER', nullable: true },
              activity_type: { type: 'STRING', nullable: true },
              certificate_number: { type: 'STRING', nullable: true },
              level: { type: 'STRING', nullable: true },
              valid: { type: 'BOOLEAN' },
              category: { type: 'STRING', nullable: true },
              weight: { type: 'NUMBER' },
              confidence: { type: 'NUMBER' },
              reason: { type: 'STRING', nullable: true },
              recommendation: { type: 'STRING', nullable: true },
            },
          },
        },
      }),
      geminiTimeout,
      'Gemini API timeout after 90s'
    );
    responseText = response?.text ?? null;
    console.log(`[Pipeline] Gemini succeeded in ${Date.now() - startTime}ms`);
  } catch (apiError) {
    const message = apiError instanceof Error ? apiError.message : String(apiError);
    const status =
      typeof apiError === 'object' && apiError !== null && 'status' in apiError
        ? (apiError as { status?: unknown }).status
        : undefined;
    console.error('[Pipeline] Gemini API Error:', message);
    const isGeminiRetryable =
      status === 403 ||
      status === 429 ||
      status === 503 ||
      message.includes('leaked') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('quota') ||
      message.includes('timeout');

    if (!isGeminiRetryable) throw apiError;
    console.warn('[Pipeline] Gemini failed (403/429/503/quota/timeout/leaked), trying OpenRouter fallback...');
  }

  // 2) Fallback to OpenRouter if Gemini failed or returned empty
  if (!responseText) {
    try {
      const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || 'google/gemini-2.5-flash';
      console.log(`[Pipeline] OpenRouter fallback (${openRouterModel}) starting for: ${cert.file_name}`);
      const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
      if (!openRouterKey) {
        console.warn('[Pipeline] OPENROUTER_API_KEY not set, skipping OpenRouter fallback');
      } else {
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        const response = await withTimeout(
          fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterKey}`,
            },
            body: JSON.stringify({
              model: openRouterModel,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUrl } },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
            }),
          }),
          openRouterTimeout,
          'OpenRouter API timeout after 90s'
        );

        if (!response.ok) {
          throw new Error(`OpenRouter HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        responseText = data?.choices?.[0]?.message?.content ?? null;
        modelName = `openrouter:${openRouterModel}`;
        console.log(`[Pipeline] OpenRouter succeeded in ${Date.now() - startTime}ms`);
      }
    } catch (orError) {
      console.error('[Pipeline] OpenRouter API Error:', orError instanceof Error ? orError.message : orError);
      responseText = null;
    }
  }

  // 3) Fallback to Hugging Face Qwen-VL if Gemini + OpenRouter failed/empty
  if (!responseText) {
    try {
      const hfModel = getHfModel();
      console.log(`[Pipeline] Hugging Face fallback (${hfModel}) starting for: ${cert.file_name}`);
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      const hfResponse = await withTimeout(
        callHuggingFaceVision({ dataUrl, prompt }),
        hfTimeout,
        'Hugging Face API timeout after 80s'
      );
      responseText = hfResponse;
      modelName = `hf:${hfModel}`;
      console.log(`[Pipeline] Hugging Face succeeded in ${Date.now() - startTime}ms`);
    } catch (hfError) {
      console.error('[Pipeline] Hugging Face API Error:', hfError instanceof Error ? hfError.message : hfError);
      responseText = null;
    }
  }

  // 4) Final fallback: mock mode if all providers failed/empty
  if (!responseText) {
    console.warn('[Pipeline] Gemini + OpenRouter + Hugging Face all failed/empty, using MOCK fallback');
    return mockPipeline(cert.file_name);
  }

  // Normalize provider output (strips ```json, coerces types) and validate
  // against the existing CertiAI schema (single source of truth).
  const parsed = combinedSchema.parse(normalizeQwenResult(responseText));

  return {
    extraction: {
      participant_name: parsed.participant_name,
      activity_name: parsed.activity_name,
      organizer: parsed.organizer,
      event_date: parsed.event_date,
      duration_hours: parsed.duration_hours,
      activity_type: parsed.activity_type,
      certificate_number: parsed.certificate_number,
      level: parsed.level,
    },
    analysis: {
      valid: parsed.valid,
      category: parsed.category || parsed.activity_type || 'Seminar',
      weight: parsed.weight,
      confidence: parsed.confidence,
      reason: parsed.reason,
      recommendation: parsed.recommendation,
    },
    modelName,
  };
}
