const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Read API key from .env.local if available or environment variable
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

console.log('=== TEST GEMINI API DIAGNOSTIC ===');
console.log('API Key present:', apiKey ? `YES (${apiKey.slice(0, 6)}...${apiKey.slice(-4)})` : 'NO!');

if (!apiKey || apiKey === 'your-gemini-api-key') {
  console.error('ERROR: GEMINI_API_KEY is not configured properly!');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Tiny 1x1 red PNG base64 for testing image multimodal prompt
const sampleImageBase64 = 'iVBORw0KGgoAAAANSUEngineAAAABJRU5ErkJggg=='; 

// 1x1 transparent PNG valid base64
const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function testModel(modelName) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Testing model: "${modelName}" ...`);
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: validPngBase64,
                mimeType: 'image/png',
              },
            },
            {
              text: 'Ini adalah gambar tes 1x1 piksel. Tolong respon dengan JSON: {"status": "ok", "message": "Gemini berhasil menerima gambar"}',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ SUCCESS! Response time: ${elapsed}ms`);
    console.log(`Raw text response:`, response.text);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ FAILED! Error after ${elapsed}ms:`);
    console.error(`Status / Message:`, error.message || error);
    if (error.status) console.error(`HTTP Status:`, error.status);
    if (error.errorDetails) console.error(`Error details:`, JSON.stringify(error.errorDetails, null, 2));
  }
}

async function runAllTests() {
  // Test text-only prompt
  console.log('\n--- Test 1: Simple Text Prompt (gemini-3.6-flash) ---');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Halo Gemini! Balas pesan ini singkat: "Koneksi OK"',
    });
    console.log('✅ Text Prompt Response:', res.text);
  } catch (e) {
    console.error('❌ Text Prompt Error:', e.message);
  }

  // Test models for multimodal (Image + Prompt)
  const modelsToTest = [
    'gemini-3.6-flash', // Latest model (Aug 2026)
    'gemini-3.5-flash',
    'gemini-2.0-flash',
  ];

  for (const m of modelsToTest) {
    await testModel(m);
  }

  console.log('\n==================================================');
  console.log('DIAGNOSTIC TEST COMPLETE');
  console.log('==================================================\n');
}

runAllTests();
