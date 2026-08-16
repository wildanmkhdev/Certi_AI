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
  Star,
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

      // 1. Insert review record
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

      // 2. Update certificate record status and final weight
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
    } catch (err: any) {
      setReviewError(err.message || 'Gagal menyimpan keputusan review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const statsPending = pendingCerts.length;
  const statsApproved = historyCerts.filter(c => c.status === 'approved').length;
  const statsRejected = historyCerts.filter(c => c.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-[#224813] animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Memuat Dashboard Dosen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#224813] to-emerald-600 flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 leading-none">Certi<span className="text-[#224813]">AI</span></span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#224813] border border-emerald-100 uppercase tracking-widest">UINSU</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Dashboard Dosen Verifikator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Summary */}
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#224813]">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold">NIDN: {profile?.lecturer_number}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-450 hover:text-red-650 hover:border-red-100 hover:bg-red-50/30 transition-all flex items-center justify-center cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Profile Card Mobile */}
        <div className="sm:hidden bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#224813]/10 flex items-center justify-center text-[#224813]">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{profile?.full_name}</p>
            <p className="text-xs text-slate-450 font-bold">NIDN: {profile?.lecturer_number}</p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-700">{statsPending}</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disetujui</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-700">{statsApproved}</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditolak</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-red-750">{statsRejected}</span>
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* WORKLIST */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Antrian Review ({pendingCerts.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                Riwayat Review ({historyCerts.length})
              </button>
            </div>

            <button
              onClick={fetchQueues}
              className="p-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-[#224813] transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </button>
          </div>

          {activeTab === 'pending' ? (
            pendingCerts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="text-slate-700 font-bold text-sm">Semua Bersih!</h4>
                <p className="text-slate-450 text-xs mt-1 font-medium">
                  Tidak ada sertifikat yang menunggu verifikasi saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Mahasiswa</th>
                      <th className="py-3 px-2">Kegiatan Terdeteksi</th>
                      <th className="py-3 px-2">Kategori</th>
                      <th className="py-3 px-2 text-center">Rekomendasi AI</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pendingCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <p className="font-bold text-slate-900">{cert.student?.full_name}</p>
                          <span className="text-[9px] text-slate-450 font-bold block mt-1">NIM: {cert.student?.student_number}</span>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-bold text-slate-800 truncate max-w-[200px]">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-slate-450 font-bold block mt-0.5">{cert.organizer || '-'}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-extrabold text-[#224813]">
                            {cert.category || 'Belum terdeteksi'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center font-extrabold text-slate-900 text-sm">
                          {cert.status === 'waiting_review' ? 'Menghitung...' : '-'}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => openReviewModal(cert)}
                            className="px-3.5 py-2 bg-gradient-to-r from-[#224813] to-emerald-700 hover:from-[#1a360f] hover:to-emerald-800 text-white rounded-xl font-bold transition-all shadow-sm shadow-[#224813]/10 active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer duration-300"
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
              <div className="text-center py-20 text-slate-450 text-xs font-semibold">
                Belum ada sertifikat yang telah selesai Anda review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Mahasiswa</th>
                      <th className="py-3 px-2">Nama Berkas</th>
                      <th className="py-3 px-2">Kategori</th>
                      <th className="py-3 px-2 text-center">Bobot Akhir</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {historyCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <p className="font-bold text-slate-900">{cert.student?.full_name}</p>
                          <span className="text-[9px] text-slate-450 font-bold block mt-0.5">NIM: {cert.student?.student_number}</span>
                        </td>
                        <td className="py-4 px-2 max-w-[150px] truncate">
                          <p className="font-bold text-slate-800 truncate">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-slate-450 font-semibold block mt-0.5">{new Date(cert.updated_at).toLocaleDateString('id-ID')}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-500">
                            {cert.category}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center font-black text-slate-900 text-sm">
                          {cert.final_weight}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border ${
                            cert.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                              : 'bg-red-50 text-red-800 border-red-150'
                          }`}>
                            {cert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => openReviewModal(cert)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#224813] text-[#224813] rounded-lg font-bold shadow-sm transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {selectedCert.status === 'waiting_review' ? 'Verifikasi & Evaluasi Sertifikat' : 'Detail Sertifikat Terverifikasi'}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">
                  Mahasiswa: <span className="text-slate-800 font-bold">{selectedCert.student?.full_name}</span> (NIM: {selectedCert.student?.student_number})
                </p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="p-1.5 px-3 rounded-lg bg-white border border-slate-250 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Modal Body */}
            {loadingModal ? (
              <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#224813] animate-spin mb-4" />
                <span className="text-slate-500 text-xs font-bold">Memuat data review...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: PDF/Image Preview */}
                <div className="flex flex-col space-y-4">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Berkas Sertifikat Asli</h4>
                  
                  {signedUrl ? (
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden flex-1 min-h-[350px] relative flex flex-col items-center justify-center p-6 text-center shadow-inner">
                      {selectedCert.file_type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signedUrl} alt="Sertifikat Asli" className="object-contain max-h-[400px] w-full shadow-sm rounded-lg" />
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white border border-slate-200 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Dokumen Format PDF</p>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Unduh untuk membaca berkas PDF secara lengkap.</p>
                          </div>
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-[#224813] hover:bg-[#1a360f] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#224813]/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Unduh Dokumen
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-200 border-dashed rounded-2xl p-10 text-center text-slate-405 font-bold">
                      Gagal memuat berkas.
                    </div>
                  )}
                </div>

                {/* Right Side: Claims + AI Extraction + Form */}
                <div className="space-y-6">
                  
                  {/* Grid claims vs AI */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">Informasi Kegiatan</h4>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-3">
                        <span className="text-slate-450 font-bold uppercase text-[9px]">Nama Berkas</span>
                        <span className="text-slate-700 col-span-2 truncate font-medium">{selectedCert.file_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-3">
                        <span className="text-slate-450 font-bold uppercase text-[9px]">Judul Kegiatan</span>
                        <span className="text-slate-900 col-span-2 font-bold">{selectedCert.title || '-'}</span>
                      </div>
                      
                      <div className="grid grid-cols-3">
                        <span className="text-slate-450 font-bold uppercase text-[9px]">Penyelenggara</span>
                        <span className="text-slate-750 col-span-2 font-medium">{selectedCert.organizer || '-'}</span>
                      </div>

                      <div className="grid grid-cols-3">
                        <span className="text-slate-450 font-bold uppercase text-[9px]">Kategori</span>
                        <span className="text-slate-800 col-span-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-extrabold text-[#224813]">
                            {selectedCert.category || 'Belum Terdeteksi'}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3">
                        <span className="text-slate-450 font-bold uppercase text-[9px]">Tanggal & Durasi</span>
                        <span className="text-slate-700 col-span-2 flex items-center gap-4 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCert.event_date ? selectedCert.event_date : '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Extraction Details */}
                  {aiAnalysis && (
                    <div className="bg-gradient-to-br from-emerald-50 to-[#224813]/5 border border-emerald-100 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                        <h4 className="font-bold text-[#224813] text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#D19200] text-[#D19200]" />
                          Hasil Analisis & Rekomendasi AI
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold">Confidence Score: {(aiAnalysis.confidence * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Rekomendasi Bobot AI</p>
                          <p className="text-2xl font-black text-slate-900 mt-0.5">{aiAnalysis.recommended_weight}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Model AI</p>
                          <p className="text-xs font-bold text-slate-700 mt-2">{aiAnalysis.model_name}</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <span className="text-slate-500 font-bold uppercase text-[9px] block">Justifikasi AI:</span>
                        <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-650 leading-relaxed text-[11px] font-medium shadow-sm">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Review Actions Form */}
                  {selectedCert.status === 'waiting_review' ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">Form Evaluasi Dosen</h4>
                      
                      {reviewError && (
                        <div className="p-3 bg-red-50 border border-red-250 text-red-700 text-xs font-semibold rounded-xl">
                          {reviewError}
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Weight input */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Tentukan Bobot Akhir (0-10)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="10"
                            value={finalWeight}
                            onChange={(e) => setFinalWeight(Number(e.target.value))}
                            className="w-full max-w-[150px] px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 focus:outline-none focus:border-[#224813] text-sm font-extrabold"
                          />
                        </div>

                        {/* Note textarea */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Catatan Review / Umpan Balik Mahasiswa
                          </label>
                          <textarea
                            placeholder="Tulis umpan balik verifikasi..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-white border border-slate-250 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#224813] text-xs leading-relaxed font-medium"
                          />
                        </div>

                        {/* Actions buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => submitReview('rejected')}
                            disabled={submittingReview}
                            className="py-3 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 text-red-750 font-bold rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm duration-300"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Tolak Sertifikat
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => submitReview('approved')}
                            disabled={submittingReview}
                            className="py-3 bg-gradient-to-r from-[#224813] to-emerald-700 hover:from-[#1a360f] hover:to-emerald-800 text-white font-bold rounded-xl shadow-md shadow-[#224813]/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs cursor-pointer duration-300"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Setujui Sertifikat
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show history details
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">Keputusan Review Anda</h4>
                      
                      <div className="text-xs space-y-3.5">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Keputusan</span>
                          <span className={`font-bold ${selectedCert.status === 'approved' ? 'text-emerald-700' : 'text-red-750'}`}>
                            {selectedCert.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Bobot Akhir</span>
                          <span className="text-slate-900 font-black text-sm">{selectedCert.final_weight}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-450 font-bold uppercase text-[9px] block">Catatan Verifikator:</span>
                          <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 leading-relaxed text-[11px] italic font-medium">
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
