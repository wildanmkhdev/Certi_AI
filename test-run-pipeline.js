const { runPipeline } = require('./src/lib/ai/pipeline');
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

// Set env variables manually for the child process/session
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;

async function run() {
  const certId = '45c5f8a9-8e05-4842-9e8b-0cf8b50c3e67';
  console.log(`Running pipeline test for cert ID: ${certId}...`);
  try {
    const result = await runPipeline(certId);
    console.log('Pipeline Result Success!');
    console.log('Result Object:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Pipeline Error:', err);
  }
}

run();
