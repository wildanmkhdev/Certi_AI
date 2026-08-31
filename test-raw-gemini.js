const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const clean = line.trim();
  if (!clean || clean.startsWith('#')) return;
  const parts = clean.split('=');
  const key = parts[0].trim();
  const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1'); // strip quotes
  env[key] = val;
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function run() {
  const filePath = 'bd96f68f-a9e2-4991-a14c-f5cebd121de3/45c5f8a9-8e05-4842-9e8b-0cf8b50c3e67/certi2.jpeg';
  const { data: fileData } = await supabase.storage.from('certificates').download(filePath);
  const arrayBuffer = await fileData.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  const prompt = `Analisis sertifikat berikut dan berikan JSON output yang valid dengan detail:
- Nama peserta (participant_name)
- Nama kegiatan (activity_name)
- Penyelenggara (organizer)
- Tanggal kegiatan (event_date)
- Kategori kegiatan (category)
- Bobot (weight)
- Alasan (reason)
- Rekomendasi (recommendation)

Kembalikan HANYA JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    }
  });

  console.log('Gemini response WITHOUT schema:');
  console.log(response.text);
}

run();
