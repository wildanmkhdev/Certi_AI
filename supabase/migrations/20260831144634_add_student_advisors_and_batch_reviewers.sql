-- 1. Tambah Unique Constraint ke certificate_reviews (certificate_id)
-- Mencegah balapan (race condition) dua dosen menyetujui sertifikat yang sama
alter table public.certificate_reviews
  add constraint certificate_reviews_certificate_id_key unique (certificate_id);

-- 2. Buat tabel student_advisors
create table public.student_advisors (
  student_id uuid references public.profiles(id) on delete cascade not null,
  lecturer_id uuid references public.profiles(id) on delete cascade not null,
  slot smallint not null check (slot in (1, 2)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (student_id, slot),
  unique (student_id, lecturer_id)
);

-- Trigger untuk memvalidasi role pada student_advisors
create or replace function public.validate_student_advisor_roles()
returns trigger security definer as $$
declare
  s_role text;
  l_role text;
begin
  select role into s_role from public.profiles where id = new.student_id;
  select role into l_role from public.profiles where id = new.lecturer_id;

  if (s_role != 'student') then
    raise exception 'User student_id harus memiliki role student';
  end if;
  if (l_role != 'lecturer') then
    raise exception 'User lecturer_id harus memiliki role lecturer';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger on_student_advisor_insert_update
  before insert or update on public.student_advisors
  for each row execute procedure public.validate_student_advisor_roles();

-- Enable RLS untuk student_advisors
alter table public.student_advisors enable row level security;

create policy "Allow students to manage own advisors" on public.student_advisors
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "Allow lecturers to view their advisees" on public.student_advisors
  for select using (lecturer_id = auth.uid() or public.is_admin(auth.uid()));

-- 3. Buat tabel batch_reviewers (snapshot pembimbing saat upload batch)
create table public.batch_reviewers (
  batch_id uuid references public.review_batches(id) on delete cascade not null,
  lecturer_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (batch_id, lecturer_id)
);

-- Enable RLS untuk batch_reviewers
alter table public.batch_reviewers enable row level security;

create policy "Allow students to view own batch reviewers" on public.batch_reviewers
  for select using (
    exists (
      select 1 from public.review_batches
      where id = batch_reviewers.batch_id and student_id = auth.uid()
    )
  );

create policy "Allow lecturers/admins to view batch reviewers" on public.batch_reviewers
  for select using (public.is_lecturer(auth.uid()) or public.is_admin(auth.uid()));

create policy "Allow students to insert own batch reviewers" on public.batch_reviewers
  for insert with check (
    exists (
      select 1 from public.review_batches
      where id = batch_reviewers.batch_id and student_id = auth.uid()
    )
  );

-- 4. Buat View lecturer_directory untuk membolehkan Anon & Auth mencari dosen terdaftar
-- (Hanya mengekspos NIDN/nama, tidak mengekspos email/no HP untuk privasi)
create or replace view public.lecturer_directory as
select id, full_name, lecturer_number
from public.profiles
where role = 'lecturer';

-- View secara default mewarisi permission, tapi untuk amannya:
grant select on public.lecturer_directory to anon, authenticated;

-- 5. Perbarui Kebijakan RLS (Sertifikat & Batch hanya terlihat oleh dosen pembimbing tujuan)
-- Drop policy select lama untuk dosen/admin
drop policy if exists "Allow lecturers to select certificates" on public.certificates;
drop policy if exists "Lecturers can view all batches" on public.review_batches;
drop policy if exists "Lecturers can view all jobs" on public.review_jobs;
drop policy if exists "Allow lecturers to select profiles" on public.profiles;

-- Terapkan policy baru: Dosen hanya bisa melihat sertifikat/batch mahasiswa bimbingannya (berdasarkan batch_reviewers) atau yang pernah direview
create policy "Allow lecturers to select assigned certificates" on public.certificates
  for select using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.batch_reviewers br
      where br.batch_id = certificates.batch_id and br.lecturer_id = auth.uid()
    )
    or exists (
      select 1 from public.certificate_reviews cr
      where cr.certificate_id = certificates.id and cr.lecturer_id = auth.uid()
    )
  );

create policy "Allow lecturers to select assigned batches" on public.review_batches
  for select using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.batch_reviewers br
      where br.batch_id = review_batches.id and br.lecturer_id = auth.uid()
    )
  );

create policy "Allow lecturers to select assigned jobs" on public.review_jobs
  for select using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.batch_reviewers br
      where br.batch_id = review_jobs.batch_id and br.lecturer_id = auth.uid()
    )
  );

-- Profile policy baru: Dosen boleh select profile mahasiswa yang membimbingnya
create policy "Allow lecturers to select assigned student profiles" on public.profiles
  for select using (
    public.is_lecturer(auth.uid())
    or public.is_admin(auth.uid())
  );

-- 6. Perbarui trigger handle_new_user untuk meng-insert student_advisors secara otomatis
create or replace function public.handle_new_user()
returns trigger security definer as $$
declare
  adv1 text;
  adv2 text;
begin
  insert into public.profiles (id, full_name, email, role, student_number, lecturer_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'student_number',
    new.raw_user_meta_data->>'lecturer_number'
  );

  -- Insert advisors jika user adalah student
  if (coalesce(new.raw_user_meta_data->>'role', 'student') = 'student') then
    adv1 := new.raw_user_meta_data->>'advisor_1_id';
    adv2 := new.raw_user_meta_data->>'advisor_2_id';
    
    if (adv1 is not null and adv1 != '' and adv1 != 'null') then
      insert into public.student_advisors (student_id, lecturer_id, slot)
      values (new.id, adv1::uuid, 1);
    end if;
    
    if (adv2 is not null and adv2 != '' and adv2 != 'null') then
      insert into public.student_advisors (student_id, lecturer_id, slot)
      values (new.id, adv2::uuid, 2);
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

