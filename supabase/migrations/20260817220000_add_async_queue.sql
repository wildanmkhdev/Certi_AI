-- ============================================================
-- Migration: Add async batch/queue system
-- ============================================================

-- 1. Add batch_id to existing certificates table
alter table public.certificates
  add column if not exists batch_id uuid;

-- 2. Create review_batches table
create table public.review_batches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  total_certificates integer not null default 0,
  completed_count integer not null default 0,
  processing_count integer not null default 0,
  queued_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null check (status in ('queued', 'processing', 'completed', 'partial', 'failed')) default 'queued',
  avg_processing_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 3. Create review_jobs table
create table public.review_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.review_batches(id) on delete cascade not null,
  certificate_id uuid references public.certificates(id) on delete cascade not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')) default 'queued',
  priority integer not null default 0,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  processing_time_ms integer,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Indexes for performance
create index idx_review_batches_student_id on public.review_batches(student_id);
create index idx_review_batches_status on public.review_batches(status);
create index idx_review_jobs_batch_id on public.review_jobs(batch_id);
create index idx_review_jobs_certificate_id on public.review_jobs(certificate_id);
create index idx_review_jobs_status on public.review_jobs(status);
create index idx_review_jobs_queued on public.review_jobs(priority desc, created_at asc) where status = 'queued';
create index idx_certificates_batch_id on public.certificates(batch_id);

-- 5. Enable RLS
alter table public.review_batches enable row level security;
alter table public.review_jobs enable row level security;

-- 6. RLS Policies: review_batches
create policy "Students can view own batches"
  on public.review_batches for select
  using (student_id = auth.uid());

create policy "Lecturers can view all batches"
  on public.review_batches for select
  using (public.is_lecturer(auth.uid()) or public.is_admin(auth.uid()));

create policy "Students can insert own batches"
  on public.review_batches for insert
  with check (student_id = auth.uid());

-- 7. RLS Policies: review_jobs
create policy "Students can view own jobs"
  on public.review_jobs for select
  using (
    exists (
      select 1 from public.review_batches
      where id = review_jobs.batch_id and student_id = auth.uid()
    )
  );

create policy "Lecturers can view all jobs"
  on public.review_jobs for select
  using (public.is_lecturer(auth.uid()) or public.is_admin(auth.uid()));

-- 8. Atomic job claim function (called by worker, bypasses RLS via security definer)
create or replace function public.claim_next_job()
returns public.review_jobs
language plpgsql
security definer
as $$
declare
  claimed_job public.review_jobs;
begin
  -- Atomically pick the highest-priority queued job and mark it processing
  update public.review_jobs
  set
    status = 'processing',
    started_at = now(),
    updated_at = now()
  where id = (
    select id
    from public.review_jobs
    where status = 'queued'
      and attempts < max_attempts
    order by priority desc, created_at asc
    limit 1
    for update skip locked
  )
  returning * into claimed_job;

  return claimed_job;
end;
$$;

-- 9. Trigger function: keep batch stats in sync when job status changes
create or replace function public.update_batch_progress()
returns trigger
language plpgsql
security definer
as $$
declare
  batch_stats record;
  new_batch_status text;
begin
  -- Recalculate all counts from actual job rows
  select
    count(*) filter (where status = 'completed') as completed,
    count(*) filter (where status = 'processing') as processing,
    count(*) filter (where status = 'queued') as queued,
    count(*) filter (where status = 'failed') as failed,
    count(*) as total,
    case
      when count(*) filter (where status = 'completed' and processing_time_ms is not null) > 0
      then (sum(processing_time_ms) filter (where status = 'completed' and processing_time_ms is not null) /
            count(*) filter (where status = 'completed' and processing_time_ms is not null))::integer
      else null
    end as avg_ms
  into batch_stats
  from public.review_jobs
  where batch_id = coalesce(NEW.batch_id, OLD.batch_id);

  -- Determine batch status
  if batch_stats.total = 0 then
    new_batch_status := 'queued';
  elsif batch_stats.completed = batch_stats.total then
    new_batch_status := 'completed';
  elsif batch_stats.failed = batch_stats.total then
    new_batch_status := 'failed';
  elsif batch_stats.failed > 0 and (batch_stats.completed + batch_stats.failed) = batch_stats.total then
    new_batch_status := 'partial';
  elsif batch_stats.processing > 0 or batch_stats.completed > 0 then
    new_batch_status := 'processing';
  else
    new_batch_status := 'queued';
  end if;

  -- Update the batch
  update public.review_batches
  set
    completed_count = batch_stats.completed,
    processing_count = batch_stats.processing,
    queued_count = batch_stats.queued,
    failed_count = batch_stats.failed,
    status = new_batch_status,
    avg_processing_ms = batch_stats.avg_ms,
    updated_at = now(),
    completed_at = case
      when new_batch_status in ('completed', 'partial', 'failed') then now()
      else null
    end
  where id = coalesce(NEW.batch_id, OLD.batch_id);

  return NEW;
end;
$$;

create trigger on_review_job_change
  after insert or update of status on public.review_jobs
  for each row execute function public.update_batch_progress();

-- 10. Enable Realtime full replica identity
alter table public.review_jobs replica identity full;
alter table public.review_batches replica identity full;
