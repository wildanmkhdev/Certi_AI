-- ============================================================
-- Migration: Allow 'failed' status on certificates
--
-- Bug fix: The certificates check constraint did not include
-- 'failed', so the worker watchdog and job-failure path could not
-- mark stuck/failed certificates. This caused jobs to hang forever
-- in 'processing' with no failure notification to students.
-- ============================================================

alter table public.certificates
  drop constraint if exists certificates_status_check;

alter table public.certificates
  add constraint certificates_status_check
  check (status in ('pending', 'processing', 'ai_completed', 'waiting_review', 'approved', 'rejected', 'failed'))
  not valid;

alter table public.certificates
  validate constraint certificates_status_check;