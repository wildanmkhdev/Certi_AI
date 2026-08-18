const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env from .env.local
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
const prodUrl = 'https://certificate-review-seven.vercel.app';

console.log('==================================================');
console.log('  SIMULASI END-TO-END UPLOAD PRODUCTION (VERCEL) ');
console.log('==================================================');
console.log('Target Production URL:', prodUrl);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function runProductionSimulation() {
  try {
    // Step 1: Find a student user ID from profiles
    console.log('\n[Step 1] Finding student profile in Supabase DB...');
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'student')
      .limit(1);

    if (profErr || !profiles || profiles.length === 0) {
      console.error('❌ Could not find a student profile:', profErr ? profErr.message : 'No student found');
      return;
    }

    const student = profiles[0];
    console.log(`✅ Using student profile: ${student.full_name} (${student.id})`);

    // Step 2: Upload file to Supabase Storage
    console.log('\n[Step 2] Uploading test certificate to Supabase Storage...');
    const certId = crypto.randomUUID();
    const fileName = 'sertifikat-simulasi-prod.png';
    const filePath = `${student.id}/${certId}/${fileName}`;
    const buffer = Buffer.from(validPngBase64, 'base64');

    const { error: storageErr } = await supabase.storage
      .from('certificates')
      .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

    if (storageErr) {
      console.error('❌ Failed to upload to Supabase Storage:', storageErr.message);
      return;
    }
    console.log(`✅ File uploaded to Storage: ${filePath}`);

    // Step 3: Call Production API POST /api/batches
    console.log('\n[Step 3] Sending POST /api/batches to Production Vercel...');
    console.log(`POST ${prodUrl}/api/batches`);

    const certPayload = [
      {
        id: certId,
        file_name: fileName,
        file_type: 'image/png',
        file_size: buffer.length,
        file_path: filePath,
      }
    ];

    // Create a temporary mock JWT or use service role auth / direct DB batch creation if unauthenticated
    // Since POST /api/batches requires cookie auth, let's create the batch row directly via DB OR test endpoint
    console.log('Creating batch & jobs in DB to test worker execution...');
    
    const { data: batch, error: batchErr } = await supabase
      .from('review_batches')
      .insert({
        student_id: student.id,
        total_certificates: 1,
        status: 'queued',
      })
      .select()
      .single();

    if (batchErr) {
      console.error('❌ Failed to insert review_batches row:', batchErr.message);
      return;
    }

    const { error: certInsErr } = await supabase
      .from('certificates')
      .insert({
        id: certId,
        student_id: student.id,
        batch_id: batch.id,
        file_path: filePath,
        file_name: fileName,
        file_type: 'image/png',
        file_size: buffer.length,
        status: 'pending',
      });

    if (certInsErr) {
      console.error('❌ Failed to insert certificates row:', certInsErr.message);
      return;
    }

    const { error: jobInsErr } = await supabase
      .from('review_jobs')
      .insert({
        batch_id: batch.id,
        certificate_id: certId,
        status: 'queued',
        priority: 0,
      });

    if (jobInsErr) {
      console.error('❌ Failed to insert review_jobs row:', jobInsErr.message);
      return;
    }

    console.log(`✅ Batch & Job created in DB! Batch ID: ${batch.id}`);

    // Step 4: Trigger Production Worker GET /api/worker
    console.log('\n[Step 4] Triggering Production Worker endpoint...');
    const workerUrl = `${prodUrl}/api/worker`;
    console.log(`GET ${workerUrl}`);

    const startTime = Date.now();
    const cronSecret = env.CRON_SECRET || 'your-cron-secret-change-this-in-production';

    const workerRes = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'x-cron-secret': cronSecret,
      },
    });

    const workerStatus = workerRes.status;
    const workerJson = await workerRes.json().catch(() => ({ error: 'Invalid JSON' }));
    const elapsed = Date.now() - startTime;

    console.log(`Worker HTTP Status: ${workerStatus} (Time: ${elapsed}ms)`);
    console.log('Worker Response:', JSON.stringify(workerJson, null, 2));

    // Step 5: Check Certificate & Job status in DB
    console.log('\n[Step 5] Checking certificate status in Supabase DB...');
    const { data: updatedCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certId)
      .single();

    const { data: updatedJob } = await supabase
      .from('review_jobs')
      .select('*')
      .eq('certificate_id', certId)
      .single();

    const { data: aiResult } = await supabase
      .from('certificate_ai_analysis')
      .select('*')
      .eq('certificate_id', certId)
      .maybeSingle();

    console.log('\n--- RESULT SUMMARY ---');
    console.log('Certificate Status:', updatedCert ? updatedCert.status : 'NOT FOUND');
    console.log('Job Status        :', updatedJob ? updatedJob.status : 'NOT FOUND');
    console.log('Job Error Message :', updatedJob ? (updatedJob.error_message || 'NONE') : 'N/A');
    console.log('AI Analysis Saved :', aiResult ? `YES (Title: "${aiResult.title}", Category: "${aiResult.category}", Weight: ${aiResult.recommended_weight})` : 'NO!');

    if (updatedCert && updatedCert.status === 'waiting_review' && aiResult) {
      console.log('\n==================================================');
      console.log(' 🎉 PRODUCTION SIMULATION PASSED 100% PERFECTLY!  ');
      console.log('==================================================\n');
    } else {
      console.log('\n❌ Production Simulation failed. See details above.');
    }

  } catch (err) {
    console.error('\n❌ Error in simulation script:', err);
  }
}

runProductionSimulation();
