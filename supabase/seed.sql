-- Seed weight rules
insert into public.weight_rules (category, min_duration, max_duration, weight, description)
values
  ('Workshop', 4, 8, 1, 'Workshop dengan durasi 4-8 jam'),
  ('Workshop', 9, null, 2, 'Workshop dengan durasi lebih dari 8 jam'),
  ('Seminar', 0, 4, 1, 'Seminar dengan durasi kurang dari 4 jam'),
  ('Competition', 1, 1, 1, 'Kompetisi tingkat lokal / regional'),
  ('Competition', 2, 2, 2, 'Kompetisi tingkat nasional'),
  ('Competition', 3, 3, 3, 'Kompetisi tingkat internasional'),
  ('Certification', 0, null, 3, 'Sertifikasi keahlian profesi / industri')
on conflict do nothing;

-- Helper to seed dummy lecturers
-- password hash for 'Dosen123!' is '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG' (compatible with bcrypt)
-- Using hardcoded hash for portability.

-- Dosen 1: Dr. Ahmad Fauzi, M.Kom.
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
values (
  'd05e1111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'ahmad.fauzi@uinsu.ac.id',
  '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{"role":"lecturer","full_name":"Dr. Ahmad Fauzi, M.Kom.","lecturer_number":"0108078601"}',
  false,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'd05e1111-1111-1111-1111-111111111111',
  'd05e1111-1111-1111-1111-111111111111',
  '{"sub":"d05e1111-1111-1111-1111-111111111111","email":"ahmad.fauzi@uinsu.ac.id"}',
  'email',
  now(),
  now(),
  now()
) on conflict (id, provider) do nothing;

-- Dosen 2: Dr. Siti Nurhaliza, M.Pd.
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
values (
  'd05e2222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'siti.nurhaliza@uinsu.ac.id',
  '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{"role":"lecturer","full_name":"Dr. Siti Nurhaliza, M.Pd.","lecturer_number":"0023047902"}',
  false,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'd05e2222-2222-2222-2222-222222222222',
  'd05e2222-2222-2222-2222-222222222222',
  '{"sub":"d05e2222-2222-2222-2222-222222222222","email":"siti.nurhaliza@uinsu.ac.id"}',
  'email',
  now(),
  now(),
  now()
) on conflict (id, provider) do nothing;

-- Dosen 3: Prof. Dr. Budi Santoso, M.T.
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
values (
  'd05e3333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'budi.santoso@uinsu.ac.id',
  '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{"role":"lecturer","full_name":"Prof. Dr. Budi Santoso, M.T.","lecturer_number":"0012127503"}',
  false,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'd05e3333-3333-3333-3333-333333333333',
  'd05e3333-3333-3333-3333-333333333333',
  '{"sub":"d05e3333-3333-3333-3333-333333333333","email":"budi.santoso@uinsu.ac.id"}',
  'email',
  now(),
  now(),
  now()
) on conflict (id, provider) do nothing;

-- Dosen 4: Dr. Rina Wulandari, M.Si.
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
values (
  'd05e4444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'rina.wulandari@uinsu.ac.id',
  '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{"role":"lecturer","full_name":"Dr. Rina Wulandari, M.Si.","lecturer_number":"0015088204"}',
  false,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'd05e4444-4444-4444-4444-444444444444',
  'd05e4444-4444-4444-4444-444444444444',
  '{"sub":"d05e4444-4444-4444-4444-444444444444","email":"rina.wulandari@uinsu.ac.id"}',
  'email',
  now(),
  now(),
  now()
) on conflict (id, provider) do nothing;

-- Dosen 5: M. Iqbal, M.Kom.
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
values (
  'd05e5555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'iqbal@uinsu.ac.id',
  '$2a$10$LgL8v2oE6v/p.c4aE8Vv1.YmB5pYwP1f0a.ZfD8QGv1.sL8t5nCqG',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{"role":"lecturer","full_name":"M. Iqbal, M.Kom.","lecturer_number":"0009118805"}',
  false,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'd05e5555-5555-5555-5555-555555555555',
  'd05e5555-5555-5555-5555-555555555555',
  '{"sub":"d05e5555-5555-5555-5555-555555555555","email":"iqbal@uinsu.ac.id"}',
  'email',
  now(),
  now(),
  now()
) on conflict (id, provider) do nothing;
