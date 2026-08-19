import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/batches
 *
 * Body: {
 *   certificates: Array<{
 *     id: string;          // pre-generated UUID (used for both file upload and DB record)
 *     file_name: string;
 *     file_type: string;
 *     file_size: number;
 *     file_path: string;   // path already uploaded to Supabase Storage
 *   }>
 * }
 *
 * Returns: { batchId: string }
 */
export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    // Authenticate user (via cookie-based session)
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificates } = body as {
      certificates: Array<{
        id: string;
        file_name: string;
        file_type: string;
        file_size: number;
        file_path: string;
      }>;
    };

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return NextResponse.json(
        { error: 'certificates array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (certificates.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 certificates per batch' },
        { status: 400 }
      );
    }

    // 1. Create the batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('review_batches')
      .insert({
        student_id: user.id,
        total_certificates: certificates.length,
        status: 'queued',
      })
      .select()
      .single();

    if (batchError || !batch) {
      throw new Error(batchError?.message ?? 'Failed to create batch');
    }

    // 2. Insert certificate records
    const certInserts = certificates.map(cert => ({
      id: cert.id,
      student_id: user.id,
      batch_id: batch.id,
      file_path: cert.file_path,
      file_name: cert.file_name,
      file_type: cert.file_type,
      file_size: cert.file_size,
      status: 'pending',
    }));

    const { error: certError } = await supabaseAdmin
      .from('certificates')
      .insert(certInserts);

    if (certError) {
      // Rollback batch
      await supabaseAdmin.from('review_batches').delete().eq('id', batch.id);
      throw new Error(certError.message);
    }

    // 3. Create review_job for each certificate
    const jobInserts = certificates.map((cert) => ({
      batch_id: batch.id,
      certificate_id: cert.id,
      status: 'queued',
      priority: 0,
    }));

    const { error: jobError } = await supabaseAdmin
      .from('review_jobs')
      .insert(jobInserts);

    if (jobError) {
      // Rollback
      await supabaseAdmin.from('review_batches').delete().eq('id', batch.id);
      throw new Error(jobError.message);
    }

    // 4. Update batch queue counts (trigger handles it, but do a quick count update)
    await supabaseAdmin
      .from('review_batches')
      .update({ queued_count: certificates.length })
      .eq('id', batch.id);

    // 5. Trigger worker asynchronously (fire-and-forget) so the upload response
    //    returns immediately with certificates in 'pending' (antri) state.
    //    AI results are written to the DB only after the worker finishes the
    //    analysis; the cron (vercel.json) remains the safety net if this
    //    background trigger is ever dropped.
    console.log('[Batches] Dispatching worker in background (fire-and-forget)...');
    const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/worker`;
    void fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    }).catch((workerErr) => {
      console.warn('[Batches] Background worker trigger error (non-blocking):', workerErr);
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      total: certificates.length,
      message: `${certificates.length} sertifikat berhasil dimasukkan ke antrian analisis AI.`,
    });
  } catch (error) {
    console.error('[POST /api/batches] Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/batches
 * Returns all batches for the authenticated student
 */
export async function GET() {
  try {
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: batches, error } = await supabaseAdmin
      .from('review_batches')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ batches: batches ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
