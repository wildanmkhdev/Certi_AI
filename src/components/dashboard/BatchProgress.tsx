'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  Loader2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import type { ReviewBatch, ReviewJob } from '@/types/database';

interface JobWithCertificate extends ReviewJob {
  certificate?: {
    id: string;
    file_name: string;
    title: string | null;
    category: string | null;
    status: string;
  } | null;
}

interface BatchProgressProps {
  batchId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `± ${seconds} detik`;
  const mins = Math.ceil(seconds / 60);
  return `± ${mins} menit`;
}

function JobStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-500 shrink-0 animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
    case 'cancelled':
      return <X className="w-4 h-4 text-gray-400 shrink-0" />;
    default: // queued
      return <Clock className="w-4 h-4 text-gray-300 shrink-0" />;
  }
}

function JobStatusLabel({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    completed: { text: 'Selesai', cls: 'text-emerald-600 bg-emerald-50' },
    processing: { text: 'Menganalisis', cls: 'text-blue-600 bg-blue-50' },
    failed: { text: 'Gagal', cls: 'text-red-500 bg-red-50' },
    cancelled: { text: 'Dibatalkan', cls: 'text-gray-400 bg-gray-50' },
    queued: { text: 'Antrean', cls: 'text-gray-400 bg-gray-50' },
  };
  const { text, cls } = map[status] ?? map['queued'];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {text}
    </span>
  );
}

export function BatchProgress({ batchId, onComplete, onDismiss }: BatchProgressProps) {
  const supabase = useRef(createClient()).current;
  const [batch, setBatch] = useState<ReviewBatch | null>(null);
  const [jobs, setJobs] = useState<JobWithCertificate[]>([]);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const hasCompletedRef = useRef(false);

  // Fetch full batch status
  const fetchBatchStatus = async () => {
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      if (!res.ok) return;
      const data = await res.json();
      setBatch(data.batch);
      setJobs(data.jobs ?? []);
      setEstimatedSeconds(data.estimatedSeconds);
      setLoading(false);

      // Trigger onComplete callback once
      if (
        data.batch?.status === 'completed' ||
        data.batch?.status === 'partial'
      ) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchStatus();

    // Subscribe to realtime changes on review_jobs for this batch
    const channel = supabase
      .channel(`batch-progress-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'review_jobs',
          filter: `batch_id=eq.${batchId}`,
        },
        () => {
          // Re-fetch full status on any job change
          fetchBatchStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'review_batches',
          filter: `id=eq.${batchId}`,
        },
        (payload) => {
          setBatch(prev => ({ ...prev, ...payload.new } as ReviewBatch));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  // ── Frontend-driven worker polling ─────────────────────────────────────────
  // On Vercel Hobby, cron only runs daily.
  // When user is watching a batch in progress, browser polls the worker
  // every 15 seconds to keep AI processing alive.
  useEffect(() => {
    const isDone =
      batch?.status === 'completed' ||
      batch?.status === 'partial' ||
      batch?.status === 'failed';

    if (isDone || !batch) return; // Don't poll when done

    const triggerWorker = () => {
      fetch('/api/worker', { method: 'GET' })
        .catch(() => {/* silent fail — worker is optional trigger */});
    };

    // Trigger immediately when batch starts
    triggerWorker();

    // Then poll worker every 4 seconds while active (keeps queue running fast)
    const workerInterval = setInterval(triggerWorker, 4_000);

    // Fallback: re-fetch batch status every 5 seconds
    // (guarantees UI updates step-by-step even if realtime websocket is slow)
    const pollInterval = setInterval(fetchBatchStatus, 5_000);

    return () => {
      clearInterval(workerInterval);
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.status, batchId]);

  if (loading) {
    return (
      <div className="card p-4 flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-2 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!batch) return null;

  const total = batch.total_certificates;
  const completed = batch.completed_count;
  const processing = batch.processing_count;
  const queued = batch.queued_count;
  const failed = batch.failed_count;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isDone = batch.status === 'completed' || batch.status === 'partial' || batch.status === 'failed';

  return (
    <div className="card overflow-hidden border border-[rgb(76_175_80)]/20 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0
          ${isDone
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-blue-100 text-blue-600'
          }
        `}>
          {isDone
            ? <CheckCircle className="w-4 h-4" />
            : <Loader2 className="w-4 h-4 animate-spin" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {isDone ? 'Analisis AI Selesai' : 'Analisis AI Berjalan'}
          </p>
          <p className="text-xs text-gray-500">
            {completed}/{total} sertifikat selesai
            {!isDone && estimatedSeconds ? ` · ${formatSeconds(estimatedSeconds)}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDone && onDismiss && (
            <button
              id="btn-dismiss-batch-progress"
              onClick={onDismiss}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
              aria-label="Tutup progress"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            id="btn-toggle-batch-expand"
            onClick={() => setExpanded(v => !v)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
            aria-label={expanded ? 'Sembunyikan detail' : 'Tampilkan detail'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isDone && failed > 0
                  ? 'bg-amber-400'
                  : isDone
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-600 w-9 text-right">{progress}%</span>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mt-2 flex-wrap">
          {completed > 0 && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {completed} selesai
            </span>
          )}
          {processing > 0 && (
            <span className="text-xs text-blue-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {processing} dianalisis
            </span>
          )}
          {queued > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {queued} antrean
            </span>
          )}
          {failed > 0 && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {failed} gagal
            </span>
          )}
        </div>
      </div>

      {/* Job List (expandable) */}
      {expanded && jobs.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {jobs.map((job, idx) => (
            <div key={job.id} className="px-4 py-2.5 flex items-center gap-3">
              <JobStatusIcon status={job.status} />

              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {job.certificate?.title || job.certificate?.file_name || `Sertifikat ${idx + 1}`}
                </p>
                {job.certificate?.category && (
                  <p className="text-xs text-gray-400">{job.certificate.category}</p>
                )}
                {job.error_message && job.status === 'failed' && (
                  <p className="text-xs text-red-400 truncate">{job.error_message}</p>
                )}
              </div>

              <JobStatusLabel status={job.status} />
            </div>
          ))}
        </div>
      )}

      {/* Footer — completion message */}
      {isDone && (
        <div className={`px-4 py-2.5 text-xs font-medium border-t border-gray-100 ${
          failed > 0
            ? 'bg-amber-50 text-amber-700'
            : 'bg-emerald-50 text-emerald-700'
        }`}>
          {failed > 0
            ? `${completed} dari ${total} sertifikat berhasil dianalisis. ${failed} sertifikat gagal — kamu dapat mencoba analisis ulang.`
            : `Semua sertifikat berhasil dianalisis dan siap untuk direview dosen.`
          }
        </div>
      )}
    </div>
  );
}
