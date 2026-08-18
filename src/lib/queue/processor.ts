/**
 * Queue Processor
 *
 * Manages job lifecycle:
 * - claimJob()     — atomically claim one queued job
 * - processJob()   — run AI pipeline and save results
 * - runWorker()    — claim + process up to MAX_CONCURRENCY slots
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { runPipeline } from '@/lib/ai/pipeline';

export const MAX_CONCURRENCY = parseInt(
  process.env.QUEUE_MAX_CONCURRENCY ?? '3',
  10
);

// Job timeout: 10 minutes
export const JOB_TIMEOUT_MS = 10 * 60 * 1000;

export interface ClaimedJob {
  id: string;
  batch_id: string;
  certificate_id: string;
  attempts: number;
  max_attempts: number;
}

// ─── Claim one queued job (atomic via DB function) ────────────────────────────

export async function claimNextJob(): Promise<ClaimedJob | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc('claim_next_job');

  if (error) {
    console.error('[Worker] claim_next_job error:', error.message);
    return null;
  }

  if (!data || !data.id) return null;

  return {
    id: data.id,
    batch_id: data.batch_id,
    certificate_id: data.certificate_id,
    attempts: data.attempts,
    max_attempts: data.max_attempts,
  };
}

// ─── Count currently processing jobs ─────────────────────────────────────────

export async function countProcessingJobs(): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('review_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  if (error) return 0;
  return count ?? 0;
}

function sanitizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  return null;
}

// ─── Process a single job ─────────────────────────────────────────────────────

export async function processJob(job: ClaimedJob): Promise<void> {
  const supabase = createAdminClient();
  const startTime = Date.now();

  console.log(`[Worker] Processing job ${job.id} (cert: ${job.certificate_id}, attempt: ${job.attempts + 1})`);

  try {
    // Update certificate status to processing
    await supabase
      .from('certificates')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.certificate_id);

    // Run the AI pipeline
    const result = await runPipeline(job.certificate_id);
    const processingMs = Date.now() - startTime;

    // Sanitize values for PostgreSQL safety
    const safeDate = sanitizeDate(result.extraction.event_date);
    const safeDuration = typeof result.extraction.duration_hours === 'number'
      ? Math.max(0, Math.round(result.extraction.duration_hours))
      : null;
    const safeWeight = typeof result.analysis.weight === 'number'
      ? Math.max(0, Math.round(result.analysis.weight))
      : 1;
    const safeConfidence = typeof result.analysis.confidence === 'number'
      ? Math.min(1, Math.max(0, result.analysis.confidence))
      : 0.9;

    // Save AI analysis result (delete old row if re-run, then insert)
    await supabase
      .from('certificate_ai_analysis')
      .delete()
      .eq('certificate_id', job.certificate_id);

    const { error: aiError } = await supabase
      .from('certificate_ai_analysis')
      .insert({
        certificate_id: job.certificate_id,
        extracted_text: result.extraction.activity_name,
        title: result.extraction.activity_name,
        organizer: result.extraction.organizer,
        category: result.analysis.category,
        event_date: safeDate,
        duration_hours: safeDuration,
        recommended_weight: safeWeight,
        confidence: safeConfidence,
        reasoning: result.analysis.reason,
        model_name: result.modelName,
      });

    if (aiError) throw new Error(`AI Analysis save failed: ${aiError.message}`);

    // Update certificate with extracted data
    const { error: certError } = await supabase
      .from('certificates')
      .update({
        title: result.extraction.activity_name,
        organizer: result.extraction.organizer,
        category: result.analysis.category,
        event_date: safeDate,
        duration_hours: safeDuration,
        certificate_number: result.extraction.certificate_number,
        status: 'waiting_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.certificate_id);

    if (certError) throw new Error(`Certificate update failed: ${certError.message}`);

    // Mark job as completed
    await supabase
      .from('review_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processing_time_ms: processingMs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`[Worker] Job ${job.id} completed successfully in ${processingMs}ms`);


  } catch (error) {
    const processingMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isRetryable = isRetryableError(message);
    const newAttempts = job.attempts + 1;
    const shouldRetry = isRetryable && newAttempts < job.max_attempts;

    console.error(`[Worker] Job ${job.id} failed (attempt ${newAttempts}/${job.max_attempts}): ${message}`);

    if (shouldRetry) {
      // Re-queue for retry
      await supabase
        .from('review_jobs')
        .update({
          status: 'queued',
          attempts: newAttempts,
          error_message: `Attempt ${newAttempts}: ${message}`,
          processing_time_ms: processingMs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Rollback certificate to pending so it can retry
      await supabase
        .from('certificates')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', job.certificate_id);
    } else {
      // Mark as permanently failed
      await supabase
        .from('review_jobs')
        .update({
          status: 'failed',
          attempts: newAttempts,
          error_message: message,
          processing_time_ms: processingMs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await supabase
        .from('certificates')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', job.certificate_id);
    }
  }
}

// ─── Determine if an error warrants retry ─────────────────────────────────────

function isRetryableError(message: string): boolean {
  const retryablePatterns = [
    'rate limit',
    'quota',
    '429',
    'timeout',
    'network',
    'ECONNRESET',
    'ETIMEDOUT',
    'fetch failed',
    'service unavailable',
    '503',
    '500',
  ];
  const lower = message.toLowerCase();
  return retryablePatterns.some(p => lower.includes(p));
}

// ─── Watchdog: Auto-fail stuck jobs after timeout ────────────────────────────

export async function cleanupStuckJobs(): Promise<number> {
  const supabase = createAdminClient();
  const timeoutThreshold = new Date(Date.now() - JOB_TIMEOUT_MS).toISOString();

  // Find jobs that are stuck in 'processing' state for more than 10 minutes
  const { data: stuckJobs } = await supabase
    .from('review_jobs')
    .select('id, certificate_id, started_at')
    .eq('status', 'processing')
    .lt('started_at', timeoutThreshold);

  if (!stuckJobs || stuckJobs.length === 0) return 0;

  console.log(`[Watchdog] Found ${stuckJobs.length} stuck jobs (> 10 min), marking as failed`);

  // Mark each stuck job as failed
  for (const job of stuckJobs) {
    await supabase
      .from('review_jobs')
      .update({
        status: 'failed',
        error_message: 'Job timeout: exceeded 10 minute processing limit',
        processing_time_ms: JOB_TIMEOUT_MS,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Also mark certificate as failed
    await supabase
      .from('certificates')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', job.certificate_id);
  }

  return stuckJobs.length;
}

// ─── Worker Run — called by cron/API ─────────────────────────────────────────

export interface WorkerRunResult {
  claimed: number;
  processed: number;
  errors: string[];
  skipped: boolean;
  reason?: string;
  cleanedUp?: number;
}

export async function runWorker(): Promise<WorkerRunResult> {
  const result: WorkerRunResult = {
    claimed: 0,
    processed: 0,
    errors: [],
    skipped: false,
    cleanedUp: 0,
  };

  // First, cleanup any stuck jobs (timeout watchdog)
  try {
    result.cleanedUp = await cleanupStuckJobs();
  } catch (err) {
    console.error('[Worker] Watchdog cleanup error:', err);
  }

  // Check current concurrency
  const processing = await countProcessingJobs();
  const available = MAX_CONCURRENCY - processing;

  if (available <= 0) {
    result.skipped = true;
    result.reason = `Concurrency limit reached (${processing}/${MAX_CONCURRENCY} active)`;
    return result;
  }

  // Claim and process jobs up to available slots
  const promises: Promise<void>[] = [];

  for (let i = 0; i < available; i++) {
    const job = await claimNextJob();
    if (!job) break; // No more queued jobs

    result.claimed++;
    promises.push(
      processJob(job)
        .then(() => { result.processed++; })
        .catch(err => {
          result.errors.push(err instanceof Error ? err.message : String(err));
        })
    );
  }

  // Run all claimed jobs in parallel
  await Promise.allSettled(promises);

  return result;
}
