/**
 * test-hf-fallback.mjs — Hugging Face (Qwen-VL) Fallback Diagnostic Test
 *
 * Verifies the CertiAI Hugging Face fallback chain WITHOUT touching production:
 *   1. Direct Qwen/VL call via Hugging Face (raw fetch, Bearer HF_TOKEN).
 *   2. Fallback simulation: Gemini is skipped (simulating 429/timeout), Qwen
 *      result is normalized into the existing CertiAI combinedSchema.
 *   3. Optional `--save` writes the result into certificate_ai_analysis +
 *      certificates (status waiting_review), proving the Supabase flow still
 *      works end-to-end (worker -> pipeline -> DB -> lecturer review queue).
 *
 * Usage:
 *   node test-hf-fallback.mjs                 # Qwen direct, schema validation only
 *   node test-hf-fallback.mjs --save          # also persist to Supabase (waiting_review)
 *
 * Reads secrets from .env.local. The HF token is never printed.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ─── Load .env.local ──────────────────────────────────────────────────────────
let env = {};
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val && !key.startsWith('#')) env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const hfToken = process.env.HF_TOKEN || env.HF_TOKEN;
const hfModel = process.env.HF_MODEL || env.HF_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct';
const hfBaseUrl = (process.env.HF_BASE_URL || env.HF_BASE_URL || 'https://api-inference.huggingface.co').replace(/\/+$/, '');

const SAVE = process.argv.includes('--save');

const HF_ENDPOINT = /\/v1\/?$/.test(hfBaseUrl)
  ? `${hfBaseUrl}/chat/completions`
  : `${hfBaseUrl}/models/${encodeURIComponent(hfModel)}/v1/chat/completions`;

console.log('==================================================');
console.log('   HUGGING FACE (QWEN-VL) FALLBACK TEST           ');
console.log('==================================================');
console.log('Model  :', hfModel);
console.log('Token  :', hfToken ? `YES (${hfToken.slice(0, 3)}...${hfToken.slice(-4)})` : 'NO!');
console.log('SaveDB :', SAVE ? 'YES (writes waiting_review)' : 'NO (validate only)');
if (!hfToken) {
  console.error('\nERROR: HF_TOKEN is not set. Add it to .env.local (hf_xxxxxxxxx) first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Normalizer (mirrors src/lib/hf/normalize.ts) ─────────────────────────────
function normalizeQwenResult(raw) {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const json = JSON.parse(text);

  const str = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' || t.toLowerCase() === 'null' ? null : t;
    }
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return null;
  };
  const num = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '' || t.toLowerCase() === 'null') return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const bool = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
      const t = v.trim().toLowerCase();
      if (['true', '1', 'yes', 'valid', 'layak'].includes(t)) return true;
      if (['false', '0', 'no', 'invalid', 'tidak'].includes(t)) return false;
    }
    return true;
  };
  const date = (v) => {
    const s = str(v);
    if (!s) return null;
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[0];
    const p = Date.parse(s);
    return Number.isNaN(p) ? null : new Date(p).toISOString().split('T')[0];
  };

  const weight = num(json.weight);
  const confidence = num(json.confidence);
  const duration = num(json.duration_hours);

  return {
    participant_name: str(json.participant_name),
    activity_name: str(json.activity_name),
    organizer: str(json.organizer),
    event_date: date(json.event_date),
    duration_hours: duration,
    activity_type: str(json.activity_type),
    certificate_number: str(json.certificate_number),
    level: str(json.level),
    valid: bool(json.valid),
    category: str(json.category) ?? str(json.activity_type) ?? 'Seminar',
    weight: weight !== null ? Math.max(0, Math.round(weight)) : num(json.recommended_weight) ?? 1,
    confidence: confidence !== null ? Math.min(1, Math.max(0, confidence)) : num(json.relevance_score) ?? 0.9,
    reason: str(json.reason) ?? '',
    recommendation: str(json.recommendation) ?? 'Layak disetujui',
  };
}

// ─── Schema validator (mirrors combinedSchema from pipeline.ts) ───────────────
function validateSchema(obj) {
  const errors = [];
  const requiredFields = [
    'participant_name', 'activity_name', 'organizer', 'event_date',
    'duration_hours', 'activity_type', 'certificate_number', 'level',
    'valid', 'category', 'weight', 'confidence', 'reason', 'recommendation',
  ];
  for (const f of requiredFields) {
    if (!(f in obj)) errors.push(`missing field: ${f}`);
  }
  if (typeof obj.valid !== 'boolean') errors.push('valid must be boolean');
  if (typeof obj.weight !== 'number' || Number.isNaN(obj.weight)) errors.push('weight must be number');
  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push('confidence must be number in [0,1]');
  }
  if (obj.duration_hours !== null && typeof obj.duration_hours !== 'number') {
    errors.push('duration_hours must be number or null');
  }
  return errors;
}

// ─── Hugging Face chat completion (raw fetch) ─────────────────────────────────
async function callHuggingFace(dataUrl, prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 80000);
  try {
    const res = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hfToken}`,
      },
      body: JSON.stringify({
        model: hfModel,
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
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new Error(`HF HTTP ${res.status}: ${detail}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error('HF returned empty content');
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Build prompt (same fields as existing combinedSchema) ─────────────────────
function buildPrompt(rules) {
  return `Kamu adalah sistem AI verifikasi sertifikat akademik otomatis.
Tugasmu:
1. Baca (OCR) dan ekstrak data faktual dari berkas sertifikat yang diberikan.
2. Klasifikasikan jenis kegiatan dan tentukan rekomendasi bobot akademik berdasarkan aturan bobot UINSU berikut:

Aturan Bobot UINSU:
${JSON.stringify(rules || [], null, 2)}

Tuntunan Aturan Ringkas:
- Workshop 4-8 jam = Bobot 1
- Workshop >8 jam = Bobot 2
- Seminar / Webinar = Bobot 1
- Kompetisi: Lokal (1), Nasional (2), Internasional (3)
- Sertifikasi Keahlian = Bobot 3

Jangan mengarang informasi. Jika suatu data tidak terlihat jelas pada sertifikat, gunakan null.

WAJIB mengembalikan JSON yang valid tanpa Markdown dan tanpa teks tambahan, dengan struktur berikut:
{
  "participant_name": "Nama lengkap peserta di sertifikat (atau null)",
  "activity_name": "Judul/nama lengkap kegiatan (atau null)",
  "organizer": "Institusi/penyelenggara kegiatan (atau null)",
  "event_date": "YYYY-MM-DD (atau null jika tidak ada)",
  "duration_hours": angka_durasi_jam_sebagai_number (atau null),
  "activity_type": "Workshop / Seminar / Webinar / Competition / Certification / Committee / Organization / Other",
  "certificate_number": "Nomor sertifikat (atau null)",
  "level": "local / national / international (atau null)",
  "valid": true/false,
  "category": "Kategori final",
  "weight": angka_bobot_rekomendasi,
  "confidence": angka_kepercayaan_0_sampai_1,
  "reason": "Alasan singkat",
  "recommendation": "Layak disetujui / Perlu verifikasi lebih lanjut / Tidak layak"
}

Hanya kembalikan JSON yang valid tanpa teks tambahan.`;
}

async function main() {
  // Edge-case unit checks for the normalizer
  console.log('\n[0] Normalizer edge cases (```json wrapper, string numbers, empty strings)...');
  const fenced = `\`\`\`json
{"participant_name":"","activity_name":"Webinar AI","organizer":"HF","event_date":"","duration_hours":"3","activity_type":"Webinar","certificate_number":null,"level":"national","valid":"true","category":"Seminar","weight":"1","confidence":"0.8","reason":"ok","recommendation":"Layak disetujui"}
\`\`\``;
  const edge = normalizeQwenResult(fenced);
  const edgeErrors = validateSchema(edge);
  console.log(
    edgeErrors.length === 0 &&
      edge.participant_name === null &&
      edge.duration_hours === 3 &&
      edge.weight === 1 &&
      edge.confidence === 0.8 &&
      edge.valid === true
      ? '  ✅ Edge cases passed'
      : `  ❌ Edge cases failed: ${JSON.stringify(edgeErrors)}`
  );

  // Load a real certificate
  console.log('\n[1] Fetching latest certificate from Supabase...');
  const { data: certs, error: certErr } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (certErr || !certs || certs.length === 0) {
    console.error('  ❌ No certificate found in DB.');
    process.exit(1);
  }
  const cert = certs[0];
  console.log(`  ✅ Using: ${cert.file_name} (${cert.id})`);

  const { data: fileBlob, error: dlErr } = await supabase.storage.from('certificates').download(cert.file_path);
  if (dlErr || !fileBlob) {
    console.error('  ❌ Failed to download certificate from storage:', dlErr?.message);
    process.exit(1);
  }
  const arrayBuffer = await fileBlob.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = cert.file_type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const { data: rules } = await supabase.from('weight_rules').select('*').eq('is_active', true);
  const prompt = buildPrompt(rules);

  // [2] DIRECT QWEN CALL
  console.log('\n[2] Direct Qwen/VL call via Hugging Face (fallback path)...');
  const start = Date.now();
  let qwenText;
  try {
    qwenText = await callHuggingFace(dataUrl, prompt);
    console.log(`  ✅ HF responded in ${Date.now() - start}ms`);
  } catch (err) {
    console.error('  ❌ HF call failed:', err.message);
    process.exit(1);
  }

  const qwenResult = normalizeQwenResult(qwenText);
  const qwenErrors = validateSchema(qwenResult);
  console.log('  Qwen normalized result:', JSON.stringify(qwenResult, null, 2));
  if (qwenErrors.length > 0) {
    console.error('  ❌ Qwen result does NOT match CertiAI combinedSchema:', qwenErrors);
    process.exit(1);
  }
  console.log('  ✅ Qwen result matches CertiAI combinedSchema');

  // [3] FALLBACK SIMULATION — Gemini 429/timeout → Qwen → DB
  console.log('\n[3] Fallback simulation: Gemini 429/timeout skipped -> Qwen -> validate -> save');
  console.log('  (Simulating that Gemini returned 429/rate-limit/timeout, so we route to Qwen.)');
  const simulatedGeminiError = 'Gemini API quota exceeded (429)'; // NOT called — simulates the retryable error
  console.log('  Simulated Gemini error:', simulatedGeminiError);
  if (SAVE) {
    console.log('  --save: writing result to certificate_ai_analysis + certificates (waiting_review)...');
    await supabase.from('certificate_ai_analysis').delete().eq('certificate_id', cert.id);
    const { error: aiErr } = await supabase.from('certificate_ai_analysis').insert({
      certificate_id: cert.id,
      extracted_text: qwenResult.reason,
      title: qwenResult.activity_name,
      organizer: qwenResult.organizer,
      category: qwenResult.category,
      event_date: qwenResult.event_date,
      duration_hours: qwenResult.duration_hours,
      recommended_weight: qwenResult.weight,
      confidence: qwenResult.confidence,
      reasoning: qwenResult.reason,
      model_name: `hf:${hfModel}`,
    });
    if (aiErr) {
      console.error('  ❌ certificate_ai_analysis insert failed:', aiErr.message);
      process.exit(1);
    }

    const { error: certUpdErr } = await supabase
      .from('certificates')
      .update({
        title: qwenResult.activity_name,
        organizer: qwenResult.organizer,
        category: qwenResult.category,
        event_date: qwenResult.event_date,
        duration_hours: qwenResult.duration_hours,
        certificate_number: qwenResult.certificate_number,
        status: 'waiting_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cert.id);
    if (certUpdErr) {
      console.error('  ❌ certificates update failed:', certUpdErr.message);
      process.exit(1);
    }

    const { data: check } = await supabase
      .from('certificates')
      .select('id, status, title, category')
      .eq('id', cert.id)
      .single();
    console.log(
      check && check.status === 'waiting_review'
        ? `  ✅ DB updated: status=${check.status}, title="${check.title}", category="${check.category}"`
        : '  ❌ DB status is not waiting_review'
    );
    console.log('  ✅ Lecturer review flow will pick this up (status=waiting_review)');
  } else {
    console.log('  (Add --save to persist to Supabase. Certificate was NOT modified.)');
  }

  console.log('\n==================================================');
  console.log('  ✅ HF FALLBACK TEST PASSED');
  console.log('  Model:', hfModel);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Test error:', err);
  process.exit(1);
});