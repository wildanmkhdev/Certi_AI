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
  console.log('Attempting lecturer registration via client Auth API...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'iqbaldosen@uinsu.ac.id',
      password: 'Dosen123!',
      options: {
        data: {
          role: 'lecturer',
          full_name: 'M. Iqbal, M.Kom. (UI Test)',
          lecturer_number: '0009118805'
        }
      }
    });

    if (error) {
      console.error('Registration Error:', error.message);
      return;
    }

    console.log('Registration SUCCESS! User ID:', data.user.id);
    console.log('Checking if profile was created...');
    
    // Query profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    console.log('Profile created in public.profiles:', profile);

  } catch (err) {
    console.error('System Error:', err);
  }
}

run();
