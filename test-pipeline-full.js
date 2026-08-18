const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

let env = {};
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val && !key.startsWith('#')) {
        env[key] = val;
      }
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log('==================================================');
console.log('    SINGLE-PASS FAST PIPELINE DIAGNOSTIC TEST     ');
console.log('==================================================');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ai = new GoogleGenAI({ apiKey });

async function runTest() {
  const { data: certs } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!certs || certs.length === 0) {
    console.log('No certificate found in DB!');
    return;
  }

  const cert = certs[0];
  console.log(`Testing Single-Pass AI for: ${cert.file_name} (${cert.id})`);

  // Download
  const { data: fileBlob } = await supabase.storage.from('certificates').download(cert.file_path);
  const arrayBuffer = await fileBlob.arrayBuffer();
  const fileBase64 = Buffer.from(arrayBuffer).toString('base64');

  // Fetch rules
  const { data: rules } = await supabase.from('weight_rules').select('*').eq('is_active', true);
  const rulesStr = JSON.stringify(rules || [], null, 2);

  const prompt = `Kamu adalah sistem AI verifikasi sertifikat akademik otomatis.
Tugasmu: Ekstrak data faktual DAN tentukan rekomendasi bobot akademik berdasarkan aturan bobot berikut:

${rulesStr}

Kembalikan JSON:
{
  "participant_name": "Nama peserta (atau null)",
  "activity_name": "Nama kegiatan (atau null)",
  "organizer": "Penyelenggara (atau null)",
  "event_date": "YYYY-MM-DD (atau null)",
  "duration_hours": 8,
  "activity_type": "Workshop",
  "certificate_number": null,
  "level": "local",
  "valid": true,
  "category": "Workshop",
  "weight": 1,
  "confidence": 0.95,
  "reason": "Alasan singkat",
  "recommendation": "Layak disetujui"
}`;

  console.log('\n⚡ Sending 1 SINGLE REQUEST to Gemini 3.5 Flash...');
  const startTime = Date.now();

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: fileBase64, mimeType: cert.file_type || 'image/jpeg' } },
          { text: prompt }
        ]
      }
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
    }
  });

  const elapsedMs = Date.now() - startTime;
  console.log(`\n🚀 SINGLE-PASS GEMINI 3.6 FLASH SUCCEEDED IN JUST ${elapsedMs}ms! (${(elapsedMs / 1000).toFixed(2)} detik)`);

  let cleanText = response.text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  console.log('\nAI Output JSON:', cleanText);

  // Save to DB
  await supabase.from('certificate_ai_analysis').delete().eq('certificate_id', cert.id);
  const parsed = JSON.parse(cleanText);

  await supabase.from('certificate_ai_analysis').insert({
    certificate_id: cert.id,
    extracted_text: parsed.reason,
    title: parsed.activity_name || cert.file_name,
    organizer: parsed.organizer || 'Unknown',
    category: parsed.category,
    event_date: parsed.event_date,
    duration_hours: parsed.duration_hours,
    recommended_weight: parsed.weight,
    confidence: parsed.confidence,
    reasoning: parsed.reason,
    model_name: 'gemini-3.6-flash'
  });

  await supabase.from('certificates').update({
    title: parsed.activity_name || cert.file_name,
    organizer: parsed.organizer || 'Unknown',
    category: parsed.category,
    status: 'waiting_review',
    updated_at: new Date().toISOString()
  }).eq('id', cert.id);

  console.log('\n✅ DB UPDATED IN REALTIME!');
}

runTest();
