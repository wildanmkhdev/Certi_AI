'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User as UserIcon,
  Loader2,
  Calendar,
  Layers,
  ExternalLink,
  ClipboardList,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';
import { Certificate, Profile } from '@/types/database';

interface CertificateWithStudent extends Certificate {
  student: {
    full_name: string;
    student_number: string;
    email: string;
  };
}

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingCerts, setPendingCerts] = useState<CertificateWithStudent[]>([]);
  const [historyCerts, setHistoryCerts] = useState<CertificateWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Review Modal states
  const [selectedCert, setSelectedCert] = useState<CertificateWithStudent | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Review Form states
  const [finalWeight, setFinalWeight] = useState<number>(0);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(prof);

      // Fetch review queues
      await fetchQueues();
    } catch (err) {
      console.error('Error fetching lecturer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      // 1. Fetch pending certificates (status: waiting_review, processing, pending)
      // Since processing/pending don't have AI yet, we specifically show waiting_review for review.
      const { data: pending } = await supabase
        .from('certificates')
        .select('*, student:profiles!student_id(full_name, student_number, email)')
        .eq('status', 'waiting_review')
        .order('created_at', { ascending: true });

      // 2. Fetch history (approved, rejected)
      const { data: history } = await supabase
        .from('certificates')
        .select('*, student:profiles!student_id(full_name, student_number, email)')
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false });

      if (pending) setPendingCerts(pending as any);
      if (history) setHistoryCerts(history as any);
    } catch (err) {
      console.error('Error fetching certificate queues:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const openReviewModal = async (cert: CertificateWithStudent) => {
    setSelectedCert(cert);
    setAiAnalysis(null);
    setSignedUrl(null);
    setReviewNote('');
    setReviewError(null);
    setLoadingModal(true);

    try {
      // 1. Fetch AI Analysis details
      const { data: analysis } = await supabase
        .from('certificate_ai_analysis')
        .select('*')
        .eq('certificate_id', cert.id)
        .maybeSingle();

      setAiAnalysis(analysis);
      
      // Default final weight to recommended weight
      setFinalWeight(analysis?.recommended_weight ?? 0);

      // 2. Generate Signed URL for preview
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

      // 1. Insert review record
      const { error: reviewError } = await supabase
        .from('certificate_reviews')
        .insert({
          certificate_id: selectedCert.id,
          lecturer_id: profile.id,
          final_weight: weight,
          status: decision,
          note: reviewNote,
        });

      if (reviewError) throw reviewError;

      // 2. Update certificate record status and final weight
      const { error: certError } = await supabase
        .from('certificates')
        .update({
          status: decision,
          final_weight: weight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCert.id);

      if (certError) throw certError;

      setSelectedCert(null);
      await fetchQueues();
    } catch (err: any) {
      setReviewError(err.message || 'Gagal menyimpan keputusan review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Stats calculation
  const statsPending = pendingCerts.length;
  const statsApproved = historyCerts.filter(c => c.status === 'approved').length;
  const statsRejected = historyCerts.filter(c => c.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Memuat Dashboard Dosen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CertiAI</h1>
              <p className="text-xs text-slate-400">Dashboard Dosen Verifikator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Summary */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-500">NIDN: {profile?.lecturer_number}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-red-400 hover:border-red-950/30 transition-all flex items-center justify-center"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Profile Card Mobile */}
        <div className="sm:hidden bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{profile?.full_name}</p>
            <p className="text-xs text-slate-500">NIDN: {profile?.lecturer_number}</p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-500">{statsPending}</span>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disetujui</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-emerald-400">{statsApproved}</span>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ditolak</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-red-500">{statsRejected}</span>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        {/* WORKLIST */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Antrian Review ({pendingCerts.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Riwayat Review ({historyCerts.length})
              </button>
            </div>

            <button
              onClick={fetchQueues}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-slate-400 transition-all flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Segarkan
            </button>
          </div>

          {activeTab === 'pending' ? (
            pendingCerts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-slate-600 mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-slate-400 font-bold">Semua Bersih!</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Tidak ada sertifikat yang menunggu verifikasi saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Mahasiswa</th>
                      <th className="py-3 px-2">Kegiatan Terdeteksi</th>
                      <th className="py-3 px-2">Kategori</th>
                      <th className="py-3 px-2 text-center">Rekomendasi AI</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {pendingCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-900/10 transition-all">
                        <td className="py-4 px-2">
                          <p className="font-bold text-white text-xs">{cert.student?.full_name}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">NIM: {cert.student?.student_number}</span>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-semibold text-slate-200 text-xs truncate max-w-[200px]">{cert.title || cert.file_name}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{cert.organizer || '-'}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[10px] font-bold text-blue-400">
                            {cert.category || 'Belum terdeteksi'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center font-extrabold text-white text-sm">
                          {cert.status === 'waiting_review' ? 'Menghitung...' : '-'}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => openReviewModal(cert)}
                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] inline-flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            historyCerts.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                Belum ada sertifikat yang telah selesai Anda review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Mahasiswa</th>
                      <th className="py-3 px-2">Nama Berkas</th>
                      <th className="py-3 px-2">Kategori</th>
                      <th className="py-3 px-2 text-center">Bobot Akhir</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historyCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-900/10 transition-all text-xs">
                        <td className="py-4 px-2">
                          <p className="font-bold text-white">{cert.student?.full_name}</p>
                          <span className="text-[10px] text-slate-550 block mt-0.5">NIM: {cert.student?.student_number}</span>
                        </td>
                        <td className="py-4 px-2 max-w-[150px] truncate">
                          <p className="font-semibold text-slate-200 truncate">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(cert.updated_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-bold text-slate-400">
                            {cert.category}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center font-black text-white text-sm">
                          {cert.final_weight}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                            cert.status === 'approved'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                              : 'bg-red-950/40 text-red-400 border border-red-900/40'
                          }`}>
                            {cert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => openReviewModal(cert)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white rounded-lg text-[11px] font-semibold transition-all"
                          >
                            Buka Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {selectedCert.status === 'waiting_review' ? 'Verifikasi & Evaluasi Sertifikat' : 'Detail Sertifikat Terverifikasi'}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Mahasiswa: <span className="text-slate-200 font-semibold">{selectedCert.student?.full_name}</span> (NIM: {selectedCert.student?.student_number})
                </p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-xs"
              >
                Tutup
              </button>
            </div>

            {/* Modal Body */}
            {loadingModal ? (
              <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <span className="text-slate-400 text-xs">Memuat data review...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: PDF/Image Preview */}
                <div className="flex flex-col space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Berkas Sertifikat Asli</h4>
                  
                  {signedUrl ? (
                    <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden flex-1 min-h-[350px] relative flex flex-col items-center justify-center p-6 text-center">
                      {selectedCert.file_type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signedUrl} alt="Sertifikat Asli" className="object-contain max-h-[400px] w-full" />
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 text-sm">Dokumen Format PDF</p>
                            <p className="text-slate-500 text-xs mt-1">Pratinjau langsung tidak tersedia untuk format PDF pribadi.</p>
                          </div>
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Buka / Unduh Berkas
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-800 border-dashed rounded-2xl p-10 text-center text-slate-650">
                      Gagal menghasilkan tautan berkas privat.
                    </div>
                  )}
                </div>

                {/* Right Side: Claims + AI Extraction + Form */}
                <div className="space-y-6">
                  
                  {/* Grid claims vs AI */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-2">Informasi Kegiatan</h4>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-semibold">Nama Berkas</span>
                        <span className="text-slate-300 col-span-2 truncate">{selectedCert.file_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-semibold">Judul Kegiatan</span>
                        <span className="text-white col-span-2 font-bold">{selectedCert.title || '-'}</span>
                      </div>
                      
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-semibold">Penyelenggara</span>
                        <span className="text-slate-300 col-span-2">{selectedCert.organizer || '-'}</span>
                      </div>

                      <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-semibold">Kategori</span>
                        <span className="text-slate-300 col-span-2">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-blue-400">
                            {selectedCert.category || 'Belum Terdeteksi'}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-semibold">Tanggal & Durasi</span>
                        <span className="text-slate-350 col-span-2 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-550" />
                            {selectedCert.event_date ? selectedCert.event_date : '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-550" />
                            {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Extraction Details */}
                  {aiAnalysis && (
                    <div className="bg-gradient-to-br from-blue-950/10 to-violet-950/10 border border-blue-900/30 rounded-xl p-5 space-y-4 shadow-lg shadow-blue-500/5">
                      <div className="flex items-center justify-between border-b border-blue-900/20 pb-2">
                        <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider">Hasil Analisis & Rekomendasi AI</h4>
                        <span className="text-[9px] text-slate-550">Confidence Score: {(aiAnalysis.confidence * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Rekomendasi Bobot AI</p>
                          <p className="text-2xl font-black text-white mt-0.5">{aiAnalysis.recommended_weight}</p>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Model AI</p>
                          <p className="text-xs font-bold text-slate-300 mt-2">{aiAnalysis.model_name}</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <span className="text-slate-500 font-semibold block">Justifikasi / Alasan AI:</span>
                        <p className="p-3 bg-slate-950/50 border border-slate-850/80 rounded-xl text-slate-300 leading-relaxed text-[11px]">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Review Actions Form */}
                  {selectedCert.status === 'waiting_review' ? (
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-2">Form Evaluasi Dosen</h4>
                      
                      {reviewError && (
                        <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl">
                          {reviewError}
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Weight input */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                            Tentukan Bobot Akhir
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="10"
                            value={finalWeight}
                            onChange={(e) => setFinalWeight(Number(e.target.value))}
                            className="w-full max-w-[150px] px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm font-extrabold"
                          />
                        </div>

                        {/* Note textarea */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                            Catatan Review / Umpan Balik
                          </label>
                          <textarea
                            placeholder="Tulis umpan balik Anda untuk mahasiswa..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                          />
                        </div>

                        {/* Actions buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => submitReview('rejected')}
                            disabled={submittingReview}
                            className="py-3 border border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 font-bold rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Tolak Sertifikat
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => submitReview('approved')}
                            disabled={submittingReview}
                            className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Setujui Sertifikat
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show history details
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-2">Keputusan Review Anda</h4>
                      
                      <div className="text-xs space-y-3.5">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Keputusan</span>
                          <span className={`font-bold ${selectedCert.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedCert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Bobot Akhir</span>
                          <span className="text-white font-black">{selectedCert.final_weight}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 font-semibold block">Catatan Verifikator:</span>
                          <p className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 leading-relaxed text-[11px] italic">
                            {selectedCert.status === 'approved' ? (selectedCert.final_weight !== (aiAnalysis?.recommended_weight ?? -1) ? 'Disetujui dengan penyesuaian bobot.' : 'Disetujui sesuai rekomendasi AI.') : 'Sertifikat tidak memenuhi kriteria verifikasi.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
