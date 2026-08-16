-- Create user profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('student', 'lecturer', 'admin')),
  student_number text,
  lecturer_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create certificates table
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  status text not null check (status in ('pending', 'processing', 'ai_completed', 'waiting_review', 'approved', 'rejected')) default 'pending',
  title text,
  organizer text,
  category text,
  event_date date,
  duration_hours numeric,
  certificate_number text,
  final_weight numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create certificate AI analysis table
create table public.certificate_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid references public.certificates(id) on delete cascade not null,
  extracted_text text,
  title text,
  organizer text,
  category text,
  event_date date,
  duration_hours numeric,
  recommended_weight numeric,
  confidence numeric,
  reasoning text,
  model_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create certificate reviews table
create table public.certificate_reviews (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid references public.certificates(id) on delete cascade not null,
  lecturer_id uuid references public.profiles(id) on delete cascade not null,
  final_weight numeric not null,
  status text not null check (status in ('approved', 'rejected')),
  note text,
  reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info',
  reference_id uuid,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create weight rules table
create table public.weight_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  min_duration numeric,
  max_duration numeric,
  weight numeric not null,
  description text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create audit logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_profiles_role on public.profiles(role);
create index idx_certificates_student_id on public.certificates(student_id);
create index idx_certificates_status on public.certificates(status);
create index idx_certificate_ai_analysis_certificate_id on public.certificate_ai_analysis(certificate_id);
create index idx_certificate_reviews_certificate_id on public.certificate_reviews(certificate_id);
create index idx_notifications_user_id_is_read on public.notifications(user_id, is_read);

-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_ai_analysis enable row level security;
alter table public.certificate_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.weight_rules enable row level security;
alter table public.audit_logs enable row level security;

-- Helper functions for RLS checks
create or replace function public.is_admin(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
end;
$$ language plpgsql;

create or replace function public.is_lecturer(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'lecturer'
  );
end;
$$ language plpgsql;

-- Policies for profiles
create policy "Allow select own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Allow lecturers to select profiles" on public.profiles
  for select using (public.is_lecturer(auth.uid()));

create policy "Allow admins to select profiles" on public.profiles
  for select using (public.is_admin(auth.uid()));

create policy "Allow update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies for certificates
create policy "Allow select own certificates" on public.certificates
  for select using (student_id = auth.uid());

create policy "Allow lecturers to select certificates" on public.certificates
  for select using (public.is_lecturer(auth.uid()));

create policy "Allow admins to select certificates" on public.certificates
  for select using (public.is_admin(auth.uid()));

create policy "Allow students to insert own certificates" on public.certificates
  for insert with check (student_id = auth.uid());

create policy "Allow students to update own pending certificates" on public.certificates
  for update using (student_id = auth.uid() and status in ('pending', 'processing', 'ai_completed'))
  with check (student_id = auth.uid());

create policy "Allow lecturers to update certificates" on public.certificates
  for update using (public.is_lecturer(auth.uid()));

create policy "Allow admins to update certificates" on public.certificates
  for update using (public.is_admin(auth.uid()));

create policy "Allow students to delete own certificates" on public.certificates
  for delete using (student_id = auth.uid());

-- Policies for certificate_ai_analysis
create policy "Allow select own AI analysis" on public.certificate_ai_analysis
  for select using (
    exists (
      select 1 from public.certificates
      where id = certificate_ai_analysis.certificate_id and student_id = auth.uid()
    )
    or public.is_lecturer(auth.uid())
    or public.is_admin(auth.uid())
  );

-- Policies for certificate_reviews
create policy "Allow select own reviews" on public.certificate_reviews
  for select using (
    exists (
      select 1 from public.certificates
      where id = certificate_reviews.certificate_id and student_id = auth.uid()
    )
    or public.is_lecturer(auth.uid())
    or public.is_admin(auth.uid())
  );

create policy "Allow lecturers to insert reviews" on public.certificate_reviews
  for insert with check (public.is_lecturer(auth.uid()) or public.is_admin(auth.uid()));

create policy "Allow lecturers to update reviews" on public.certificate_reviews
  for update using (lecturer_id = auth.uid() or public.is_admin(auth.uid()));

-- Policies for notifications
create policy "Allow select own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Allow update own notifications" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for weight_rules
create policy "Allow select weight rules" on public.weight_rules
  for select using (auth.role() = 'authenticated');

create policy "Allow admins to manage weight rules" on public.weight_rules
  for all using (public.is_admin(auth.uid()));

-- Policies for audit_logs
create policy "Allow select audit logs" on public.audit_logs
  for select using (public.is_admin(auth.uid()));

-- Trigger function: Create profile when new auth user registered
create or replace function public.handle_new_user()
returns trigger security definer as $$
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
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger function: Create notifications on certificate status changes
create or replace function public.handle_certificate_status_change()
returns trigger security definer as $$
begin
  -- Notification on INSERT (initial pending state)
  if (TG_OP = 'INSERT') then
    insert into public.notifications (user_id, title, message, type, reference_id)
    values (
      new.student_id,
      'Sertifikat Berhasil Diunggah',
      'Sertifikat "' || new.file_name || '" berhasil diunggah dan sedang mengantri untuk analisis AI.',
      'info',
      new.id
    );
  -- Notification when processing complete and waiting for review
  elsif (TG_OP = 'UPDATE' and old.status != new.status and new.status = 'waiting_review') then
    insert into public.notifications (user_id, title, message, type, reference_id)
    values (
      new.student_id,
      'Analisis AI Selesai',
      'Sertifikat "' || coalesce(new.title, new.file_name) || '" telah dianalisis AI dan kini menunggu review dosen.',
      'info',
      new.id
    );
  -- Notification when approved
  elsif (TG_OP = 'UPDATE' and old.status != new.status and new.status = 'approved') then
    insert into public.notifications (user_id, title, message, type, reference_id)
    values (
      new.student_id,
      'Sertifikat Disetujui',
      'Sertifikat "' || coalesce(new.title, new.file_name) || '" telah disetujui oleh dosen dengan bobot akhir ' || coalesce(new.final_weight, 0)::text || '.',
      'success',
      new.id
    );
  -- Notification when rejected
  elsif (TG_OP = 'UPDATE' and old.status != new.status and new.status = 'rejected') then
    insert into public.notifications (user_id, title, message, type, reference_id)
    values (
      new.student_id,
      'Sertifikat Ditolak',
      'Sertifikat "' || coalesce(new.title, new.file_name) || '" ditolak oleh dosen.',
      'error',
      new.id
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_certificate_status_change
  after insert or update of status on public.certificates
  for each row execute procedure public.handle_certificate_status_change();

-- Trigger function: Create audit log entries on certificate actions
create or replace function public.handle_certificate_audit_log()
returns trigger security definer as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.audit_logs (user_id, action, entity, entity_id, new_data)
    values (
      new.student_id,
      'CERTIFICATE_UPLOADED',
      'certificates',
      new.id,
      row_to_json(new)::jsonb
    );
  elsif (TG_OP = 'UPDATE') then
    if (old.status != new.status) then
      insert into public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
      values (
        auth.uid(),
        case
          when new.status = 'processing' then 'AI_ANALYSIS_STARTED'
          when new.status = 'waiting_review' then 'AI_ANALYSIS_COMPLETED'
          when new.status = 'approved' then 'LECTURER_APPROVED'
          when new.status = 'rejected' then 'LECTURER_REJECTED'
          else 'STATUS_UPDATED'
        end,
        'certificates',
        new.id,
        jsonb_build_object('status', old.status),
        jsonb_build_object('status', new.status, 'final_weight', new.final_weight)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_certificate_audit
  after insert or update on public.certificates
  for each row execute procedure public.handle_certificate_audit_log();

-- Setup private storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760, -- 10MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

-- Storage RLS Policies
create policy "Allow owners, lecturers, and admins to read files"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('lecturer', 'admin')
      )
    )
  );

create policy "Allow owners to upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Allow owners to delete files"
  on storage.objects for delete
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
