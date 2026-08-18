import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { MAX_CONCURRENCY } from '@/lib/queue/processor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // Auth check
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch batch
    const { data: batch, error: batchError } = await supabase
      .from('review_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check ownership (unless lecturer/admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isPrivileged = profile?.role === 'lecturer' || profile?.role === 'admin';
    if (!isPrivileged && batch.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch jobs — only columns that actually exist in certificates table
    const { data: jobs, error: jobsError } = await supabase
      .from('review_jobs')
      .select(`
        id,
        batch_id,
        certificate_id,
        status,
        priority,
        attempts,
        max_attempts,
        started_at,
        completed_at,
        processing_time_ms,
        error_message,
        created_at,
        updated_at,
        certificate:certificates (
          id,
          file_name,
          title,
          category,
          status
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (jobsError) {
      console.error('[BatchStatus] jobsError:', jobsError.message);
      throw new Error(jobsError.message);
    }

    // Calculate estimated seconds remaining
    const remaining = (batch.queued_count ?? 0) + (batch.processing_count ?? 0);
    let estimatedSeconds: number | null = null;

    if (remaining > 0 && batch.avg_processing_ms) {
      const avgSeconds = batch.avg_processing_ms / 1000;
      const activeWorkers = Math.max(1, MAX_CONCURRENCY);
      estimatedSeconds = Math.ceil((remaining / activeWorkers) * avgSeconds);
    } else if (remaining > 0) {
      estimatedSeconds = Math.ceil((remaining / MAX_CONCURRENCY) * 25);
    }

    // Progress percentage
    const progress = batch.total_certificates > 0
      ? Math.round((batch.completed_count / batch.total_certificates) * 100)
      : 0;

    return NextResponse.json({
      batch,
      jobs: jobs ?? [],
      estimatedSeconds,
      progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('[GET /api/batches/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
