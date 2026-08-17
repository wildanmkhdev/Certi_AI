'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Layers,
  ExternalLink,
  ClipboardList,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Star,
  Search,
  User,
} from 'lucide-react';
import { Certificate, Profile, CertificateAIAnalysis } from '@/types/database';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button, Input, Modal, Badge, Alert, Skeleton } from '@/components/ui';

interface CertificateWithStudent extends Certificate {
  student: {
    full_name: string;
    student_number: string;
    email: string;
  };
}

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingCerts, setPendingCerts] = useState<CertificateWithStudent[]>([]);
  const [historyCerts, setHistoryCerts] = useState<CertificateWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [search, setSearch] = useState('');

  // Review Modal states
  const [selectedCert, setSelectedCert] = useState<CertificateWithStudent | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CertificateAIAnalysis | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Review Form states
  const [finalWeight, setFinalWeight] = useState<number>(0);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    try {
      const { data: pending } = await supabase
        .from('certificates')
        .select('*, student:profiles!student_id(full_name, student_number, email)')
        .eq('status', 'waiting_review')
        .order('created_at', { ascending: true });

      const { data: history } = await supabase
        .from('certificates')
        .select('*, student:profiles!student_id(full_name, student_number, email)')
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false });

      if (pending) setPendingCerts(pending as CertificateWithStudent[]);
      if (history) setHistoryCerts(history as CertificateWithStudent[]);
    } catch (err) {
      console.error('Error fetching certificate queues:', err);
    }
  }, [supabase]);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(prof);
      await fetchQueues();
    } catch (err) {
      console.error('Error fetching lecturer data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, fetchQueues]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const openReviewModal = async (cert: CertificateWithStudent) => {
    setSelectedCert(cert);
    setAiAnalysis(null);
    setSignedUrl(null);
    setReviewNote('');
    setReviewError(null);
    setLoadingModal(true);

    try {
      const { data: analysis } = await supabase
        .from('certificate_ai_analysis')
        .select('*')
        .eq('certificate_id', cert.id)
        .maybeSingle();

      setAiAnalysis(analysis);
      setFinalWeight(analysis?.recommended_weight ?? 0);

      const { data: signed } = await supabase.storage
        .from('certificates')
        .createSignedUrl(cert.file_path, 3600);

      if (signed) {
        setSignedUrl(signed.signedUrl);
      }
    } catch (err) {
      console.error('Error loading review details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const submitReview = async (decision: 'approved' | 'rejected') => {
    if (!selectedCert || !profile) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const weight = decision === 'approved' ? Number(finalWeight) : 0;

      if (decision === 'approved' && (Number(finalWeight) < 0 || Number(finalWeight) > 10)) {
        throw new Error('Bobot akhir harus antara 0 sampai 10.');
      }

      const { error: reviewErr } = await supabase
        .from('certificate_reviews')
        .insert({
          certificate_id: selectedCert.id,
          lecturer_id: profile.id,
          final_weight: weight,
          status: decision,
          note: reviewNote,
        });

      if (reviewErr) throw reviewErr;

      const { error: certErr } = await supabase
        .from('certificates')
        .update({
          status: decision,
          final_weight: weight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCert.id);

      if (certErr) throw certErr;

      setSelectedCert(null);
      await fetchQueues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan keputusan review.';
      setReviewError(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtering
  const listToShow = activeTab === 'pending' ? pendingCerts : historyCerts;
  const filteredList = listToShow.filter(cert => {
    if (search === '') return true;
    const q = search.toLowerCase();
    return (
      cert.student?.full_name?.toLowerCase().includes(q) ||
      cert.student?.student_number?.toLowerCase().includes(q) ||
      cert.title?.toLowerCase().includes(q) ||
      cert.organizer?.toLowerCase().includes(q) ||
      cert.file_name.toLowerCase().includes(q)
    );
  });

  const statsPending = pendingCerts.length;
  const statsApproved = historyCerts.filter(c => c.status === 'approved').length;
  const statsRejected = historyCerts.filter(c => c.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 animate-shimmer" />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <DashboardHeader profile={profile} title="Dashboard" roleLabel="Dashboard Dosen Verifikator" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Menunggu Review" value={statsPending} icon={Clock} variant="warning" />
          <StatCard title="Disetujui" value={statsApproved} icon={CheckCircle} variant="success" />
          <StatCard title="Ditolak" value={statsRejected} icon={XCircle} variant="error" />
        </div>

        {/* Worklist */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200 self-start">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Antrian Review ({pendingCerts.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                Riwayat Review ({historyCerts.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 lg:w-72">
                <Input
                  placeholder="Cari mahasiswa, NIM, kegiatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={fetchQueues}
              >
                Segarkan
              </Button>
            </div>
          </div>

          {/* Content */}
          {filteredList.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto mb-4 border-2 border-gray-100">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-gray-700 font-bold text-base">
                {activeTab === 'pending' ? 'Semua Bersih!' : 'Belum Ada Riwayat'}
              </h4>
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto font-medium">
                {activeTab === 'pending'
                  ? 'Tidak ada sertifikat yang menunggu verifikasi saat ini.'
                  : 'Belum ada sertifikat yang telah selesai Anda review.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredList.map(cert => (
                <div
                  key={cert.id}
                  className="card-hover p-5 space-y-4 animate-fade-in"
                >
                  {/* Student info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{cert.student?.full_name}</p>
                        <p className="text-xs text-gray-500 font-bold">NIM: {cert.student?.student_number}</p>
                      </div>
                    </div>
                    {activeTab === 'history' && (
                      <Badge variant={cert.status === 'approved' ? 'success' : 'error'}>
                        {cert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </Badge>
                    )}
                  </div>

                  {/* Certificate info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800 truncate">{cert.title || cert.file_name}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{cert.organizer || '-'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cert.category && <Badge variant="uinsu" size="sm">{cert.category}</Badge>}
                      {activeTab === 'history' && (
                        <Badge variant="default" size="sm">Bobot: {cert.final_weight}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(cert.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <Button
                      variant={activeTab === 'pending' ? 'primary' : 'secondary'}
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => openReviewModal(cert)}
                    >
                      {activeTab === 'pending' ? 'Review' : 'Detail'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title={selectedCert?.status === 'waiting_review' ? 'Verifikasi & Evaluasi Sertifikat' : 'Detail Sertifikat Terverifikasi'}
        description={
          selectedCert
            ? `Mahasiswa: ${selectedCert.student?.full_name} (NIM: ${selectedCert.student?.student_number})`
            : undefined
        }
        size="xl"
      >
        {loadingModal ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[rgb(34_72_19)] animate-spin mb-4" />
            <span className="text-gray-500 text-sm font-bold">Memuat data review...</span>
          </div>
        ) : (
          selectedCert && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preview */}
              <div className="flex flex-col space-y-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Berkas Sertifikat Asli</h4>
                {signedUrl ? (
                  <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden flex-1 min-h-[350px] relative flex flex-col items-center justify-center p-6 text-center">
                    {selectedCert.file_type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signedUrl}
                        alt="Sertifikat Asli"
                        className="object-contain max-h-[400px] w-full shadow-sm rounded-lg"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-white border border-gray-200 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Dokumen Format PDF</p>
                          <p className="text-gray-500 text-xs mt-1 font-medium">
                            Unduh untuk membaca berkas PDF secara lengkap.
                          </p>
                        </div>
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[rgb(34_72_19)] hover:bg-[rgb(27_54_15)] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Unduh Dokumen
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 border-dashed rounded-2xl p-10 text-center text-gray-400 font-semibold">
                    Gagal memuat berkas.
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="space-y-6">
                {/* Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                    Informasi Kegiatan
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Nama Berkas</span>
                      <span className="text-gray-700 col-span-2 truncate font-medium">{selectedCert.file_name}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Judul Kegiatan</span>
                      <span className="text-gray-900 col-span-2 font-bold">{selectedCert.title || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Penyelenggara</span>
                      <span className="text-gray-700 col-span-2 font-medium">{selectedCert.organizer || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Kategori</span>
                      <span className="col-span-2">
                        {selectedCert.category ? (
                          <Badge variant="uinsu">{selectedCert.category}</Badge>
                        ) : (
                          <span className="text-gray-400">Belum Terdeteksi</span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Tanggal & Durasi</span>
                      <span className="text-gray-700 col-span-2 flex items-center gap-4 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {selectedCert.event_date || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Extraction */}
                {aiAnalysis && (
                  <div className="bg-gradient-to-br from-[rgb(232_245_233)] to-white border border-[rgb(76_175_80)]/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgb(76_175_80)]/20 pb-2">
                      <h4 className="font-bold text-[rgb(34_72_19)] text-xs uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Hasil Analisis & Rekomendasi AI
                      </h4>
                      <span className="text-[10px] text-gray-500 font-bold">
                        Confidence: {aiAnalysis.confidence != null ? `${(aiAnalysis.confidence * 100).toFixed(0)}%` : '-'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 p-2.5 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Rekomendasi Bobot AI</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{aiAnalysis.recommended_weight}</p>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Model AI</p>
                        <p className="text-xs font-bold text-gray-700 mt-2">{aiAnalysis.model_name}</p>
                      </div>
                    </div>

                    <div className="text-sm space-y-1.5">
                      <span className="text-gray-500 font-bold uppercase text-[10px] block">Justifikasi AI:</span>
                      <p className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 leading-relaxed text-xs font-medium">
                        {aiAnalysis.reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {selectedCert.status === 'waiting_review' ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                      Form Evaluasi Dosen
                    </h4>

                    {reviewError && (
                      <Alert variant="error" onClose={() => setReviewError(null)}>
                        {reviewError}
                      </Alert>
                    )}

                    <div className="space-y-4">
                      {/* AI recommendation hint */}
                      {aiAnalysis && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          AI merekomendasikan: <strong className="text-gray-900">{aiAnalysis.recommended_weight}</strong>
                        </p>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="final-weight" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                          Tentukan Bobot Akhir (0-10)
                        </label>
                        <input
                          id="final-weight"
                          type="number"
                          min="0"
                          max="10"
                          value={finalWeight}
                          onChange={(e) => setFinalWeight(Number(e.target.value))}
                          className={`w-full max-w-[150px] px-3.5 py-2.5 bg-white border rounded-xl text-gray-900 text-sm font-extrabold focus:outline-none focus:ring-2 ${
                            Number(finalWeight) < 0 || Number(finalWeight) > 10
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                              : 'border-gray-200 focus:border-[rgb(34_72_19)] focus:ring-[rgb(34_72_19)]/20'
                          }`}
                        />
                        {(Number(finalWeight) < 0 || Number(finalWeight) > 10) && (
                          <p className="text-xs text-red-600">Bobot harus antara 0-10.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="review-note" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                          Catatan Review / Umpan Balik Mahasiswa
                        </label>
                        <textarea
                          id="review-note"
                          placeholder="Tulis umpan balik verifikasi..."
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          rows={3}
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[rgb(34_72_19)] focus:ring-2 focus:ring-[rgb(34_72_19)]/20 text-sm leading-relaxed font-medium resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button
                          variant="danger"
                          loading={submittingReview}
                          icon={<ThumbsDown className="w-4 h-4" />}
                          onClick={() => submitReview('rejected')}
                          className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 shadow-none"
                        >
                          Tolak Sertifikat
                        </Button>
                        <Button
                          variant="success"
                          loading={submittingReview}
                          icon={<ThumbsUp className="w-4 h-4" />}
                          onClick={() => submitReview('approved')}
                        >
                          Setujui Sertifikat
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                      Keputusan Review Anda
                    </h4>
                    <div className="text-sm space-y-3.5">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Keputusan</span>
                        <span className={`font-bold ${selectedCert.status === 'approved' ? 'text-green-700' : 'text-red-600'}`}>
                          {selectedCert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Bobot Akhir</span>
                        <span className="text-gray-900 font-black text-sm">{selectedCert.final_weight}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Catatan Verifikator:</span>
                        <p className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 leading-relaxed text-xs italic font-medium">
                          {selectedCert.status === 'approved'
                            ? selectedCert.final_weight !== (aiAnalysis?.recommended_weight ?? -1)
                              ? 'Disetujui dengan penyesuaian bobot.'
                              : 'Disetujui sesuai rekomendasi AI.'
                            : 'Sertifikat tidak memenuhi kriteria verifikasi.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}