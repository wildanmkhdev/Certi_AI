import { NextRequest, NextResponse } from 'next/server';
import { runWorker } from '@/lib/queue/processor';

// Allow up to 5 minutes for AI processing within a single invocation
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return true; // No secret configured — allow all (dev mode)

  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${expectedSecret}`) return true;

  // Manual trigger sends: x-cron-secret: <CRON_SECRET>
  const secretHeader = request.headers.get('x-cron-secret');
  if (secretHeader === expectedSecret) return true;

  return false;
}

/**
 * GET /api/worker
 *
 * Called by Vercel Cron (every minute via vercel.json).
 * Also used as health check — returns queue stats when no jobs to process.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Worker] Cron triggered at', new Date().toISOString());

  try {
    const result = await runWorker();
    console.log('[Worker] Result:', JSON.stringify(result));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker error';
    console.error('[Worker] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/worker
 *
 * Called immediately after batch creation for fast first-job pickup.
 * Also protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Worker] Manual POST triggered at', new Date().toISOString());

  try {
    const result = await runWorker();
    console.log('[Worker] Result:', JSON.stringify(result));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker error';
    console.error('[Worker] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

