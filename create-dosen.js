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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Env variables missing');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const lecturers = [
  {
    email: 'ahmad.fauzi@uinsu.ac.id',
    fullName: 'Dr. Ahmad Fauzi, M.Kom.',
    nidn: '0108078601'
  },
  {
    email: 'siti.nurhaliza@uinsu.ac.id',
    fullName: 'Dr. Siti Nurhaliza, M.Pd.',
    nidn: '0023047902'
  },
  {
    email: 'budi.santoso@uinsu.ac.id',
    fullName: 'Prof. Dr. Budi Santoso, M.T.',
    nidn: '0012127503'
  },
  {
    email: 'rina.wulandari@uinsu.ac.id',
    fullName: 'Dr. Rina Wulandari, M.Si.',
    nidn: '0015088204'
  },
  {
    email: 'iqbal@uinsu.ac.id',
    fullName: 'M. Iqbal, M.Kom.',
    nidn: '0009118805'
  }
];

async function run() {
  console.log('Starting dummy lecturers seeding via Supabase Auth Admin API...');

  // Delete test user first to keep it clean
  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.find(u => u.email === 'iqbaldosen@uinsu.ac.id');
    if (testUser) {
      console.log('Deleting temporary iqbaldosen...');
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    }
  } catch (e) {
    console.warn('Could not cleanup temp user:', e.message);
  }

  for (const lec of lecturers) {
    console.log(`Creating ${lec.email}...`);

    try {
      // Create user directly
      const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: lec.email,
        password: 'Dosen123!',
        email_confirm: true,
        user_metadata: {
          role: 'lecturer',
          full_name: lec.fullName,
          lecturer_number: lec.nidn
        }
      });

      if (createError) throw createError;

      console.log(`Successfully created lecturer ${lec.email} (ID: ${user.id})`);
    } catch (err) {
      console.error(`Error creating ${lec.email}:`, err.message || err);
    }
  }

  console.log('Seeding completed!');
}

run();
