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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Env variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Attempting login as Iqbal...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'iqbal@uinsu.ac.id',
      password: 'Dosen123!'
    });

    if (error) {
      console.error('Auth Error:', error.message);
      return;
    }

    console.log('Auth Success! User ID:', data.user.id);
    const token = data.session.access_token;
    console.log('JWT Token retrieved.');

    // Attempt to fetch profile
    console.log('Querying profile...');
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileErr) {
      console.error('Profile query error:', profileErr);
    } else {
      console.log('Profile retrieved:', profile);
    }

    // Attempt to fetch certificate queues
    console.log('Querying certificate queues...');
    const { data: pending, error: pendingErr } = await supabase
      .from('certificates')
      .select('*, student:profiles!student_id(full_name, student_number, email)')
      .eq('status', 'waiting_review')
      .order('created_at', { ascending: true });

    if (pendingErr) {
      console.error('Pending certificates query error:', pendingErr);
    } else {
      console.log('Pending certificates retrieved count:', pending.length);
    }

  } catch (err) {
    console.error('System Error:', err);
  }
}

run();
