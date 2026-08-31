'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Loader2,
  Calendar,
  Layers,
  ExternalLink,
  RefreshCw,
  FileCheck2,
  Search,
  Filter,
} from 'lucide-react';
import { Certificate, Profile, CertificateAIAnalysis } from '@/types/database';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { CertificateCard } from '@/components/dashboard/CertificateCard';
import { BatchProgress } from '@/components/dashboard/BatchProgress';
import { Button, Input, Modal, Badge, Skeleton } from '@/components/ui';
import { AdvisorCard } from '@/components/dashboard/AdvisorCard';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);

  // Batch progress state
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Detail Modal states
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CertificateAIAnalysis | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const fetchCertificates = useCallback(async (userId?: string) => {
    const resolvedUserId = userId
      ? userId
      : (await supabase.auth.getUser()).data.user?.id;

    if (!resolvedUserId) return;

    const { data } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', resolvedUserId)
      .order('created_at', { ascending: false });

    if (data) {
      setCertificates(data);
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
      await fetchCertificates(user.id);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, fetchCertificates]);

  useEffect(() => {
    fetchUserData();

    // Subscribe to realtime certificate changes (replaces polling interval)
    let userId: string | undefined;
    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id;
      if (!userId) return;

      const channel = supabase
        .channel('student-certificates-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'certificates',
            filter: `student_id=eq.${userId}`,
          },
          () => fetchCertificates(userId)
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, [fetchUserData, fetchCertificates, supabase]);

  const handleBatchUpload = async (files: File[]) => {
    if (selectedAdvisorIds.length === 0) {
      alert('Pilih minimal 1 dosen pembimbing tujuan di panel "Dosen Pembimbing Akademik" sebelum mengupload sertifikat.');
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session tidak ditemukan');

      // 1. Upload all files to Supabase Storage first
      const uploadedCerts: Array<{
        id: string;
        file_name: string;
        file_type: string;
        file_size: number;
        file_path: string;
      }> = [];

      for (const file of files) {
        const certificateId = crypto.randomUUID();
        const filePath = `${user.id}/${certificateId}/${file.name}`;

        const { error: storageError } = await supabase.storage
          .from('certificates')
          .upload(filePath, file);

        if (storageError) throw storageError;

        uploadedCerts.push({
          id: certificateId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
        });
      }

      // 2. Create batch + jobs via API (does NOT start AI yet)
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificates: uploadedCerts,
          reviewer_ids: selectedAdvisorIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Gagal membuat batch analisis');
      }

      const { batchId } = await res.json();

      // 3. Show progress tracker
      setActiveBatchId(batchId);

      // 4. Refresh certificate list
      await fetchCertificates(user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah sertifikat.';
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  const deleteCertificate = async (id: string, filePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sertifikat ini?')) return;
    try {
      await supabase.storage.from('certificates').remove([filePath]);
      await supabase.from('certificates').delete().eq('id', id);
      setCertificates(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting certificate:', err);
    }
  };

  const openModal = async (cert: Certificate) => {
    setSelectedCert(cert);
    setAiAnalysis(null);
    setSignedUrl(null);
    setLoadingModal(true);

    try {
      // 1. Fetch fresh certificate data from DB (in case AI updated title/organizer recently)
      const { data: freshCert } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', cert.id)
        .single();

      if (freshCert) {
        setSelectedCert(freshCert);
      }

      // 2. Fetch AI analysis
      const { data: analysis } = await supabase
        .from('certificate_ai_analysis')
        .select('*')
        .eq('certificate_id', cert.id)
        .maybeSingle();

      setAiAnalysis(analysis);

      // 3. Create signed URL for file preview
      const targetPath = freshCert ? freshCert.file_path : cert.file_path;
      const { data: signed } = await supabase.storage
        .from('certificates')
        .createSignedUrl(targetPath, 3600);

      if (signed) {
        setSignedUrl(signed.signedUrl);
      }
    } catch (err) {
      console.error('Error opening certificate details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  // Filters
  const filteredCerts = certificates.filter(cert => {
    const matchesSearch =
      search === '' ||
      cert.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (cert.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (cert.organizer || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statsTotal = certificates.length;
  const statsApproved = certificates.filter(c => c.status === 'approved').length;
  const statsWaiting = certificates.filter(c => c.status === 'waiting_review' || c.status === 'ai_completed').length;
  const statsRejected = certificates.filter(c => c.status === 'rejected').length;
  const statsWeight = certificates.reduce(
    (acc, c) => acc + (c.status === 'approved' ? Number(c.final_weight || 0) : 0),
    0
  );

  const statusOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'pending', label: 'Mengantri' },
    { value: 'processing', label: 'Diproses AI' },
    { value: 'waiting_review', label: 'Menunggu Dosen' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 animate-shimmer" />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <DashboardHeader profile={profile} title="Dashboard" roleLabel="Dashboard Mahasiswa" showNotifications />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Mobile Profile Card */}
        <div className="sm:hidden card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 font-bold">NIM: {profile?.student_number}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Unggahan" value={statsTotal} icon={FileText} />
          <StatCard title="Disetujui" value={statsApproved} icon={CheckCircle} variant="success" />
          <StatCard title="Menunggu Review" value={statsWaiting} icon={Clock} variant="warning" />
          <StatCard title="Ditolak" value={statsRejected} icon={XCircle} variant="error" />
          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-[rgb(232_245_233)] to-white border border-[rgb(76_175_80)]/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold text-[rgb(34_72_19)] uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Bobot Disetujui
              </p>
              <div className="w-10 h-10 rounded-xl bg-[rgb(34_72_19)]/10 flex items-center justify-center text-[rgb(34_72_19)]">
                <Star className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{statsWeight}</div>
          </div>
        </div>

        {/* Advisor Panel */}
        <AdvisorCard onSelectionChange={setSelectedAdvisorIds} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Upload Section */}
          <div className="space-y-6 lg:sticky lg:top-20">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Unggah Sertifikat</h3>
                  <p className="text-xs text-gray-500">AI akan menganalisis secara instan</p>
                </div>
              </div>
              <UploadZone onUpload={handleBatchUpload} uploading={uploading} />
            </div>

            {/* Batch Progress Panel */}
            {activeBatchId && (
              <BatchProgress
                batchId={activeBatchId}
                onComplete={() => fetchCertificates()}
                onDismiss={() => setActiveBatchId(null)}
              />
            )}
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-3">
                <div>
                  <h3 className="font-bold text-gray-900">Daftar Sertifikat</h3>
                  <p className="text-sm text-gray-500 mt-1">Total {certificates.length} sertifikat terunggah</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => fetchCertificates()}
                >
                  Segarkan
                </Button>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Cari sertifikat, kegiatan, penyelenggara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input !w-auto"
                    aria-label="Filter status"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of cards */}
              {filteredCerts.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border-2 border-gray-100">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h4 className="text-gray-700 font-bold text-base">
                    {certificates.length === 0 ? 'Belum Ada Sertifikat' : 'Tidak Ditemukan'}
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm font-medium leading-relaxed">
                    {certificates.length === 0
                      ? 'Gunakan panel unggah di samping untuk mengirim sertifikat kegiatan Anda.'
                      : 'Coba ubah kata kunci pencarian atau filter status.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCerts.map(cert => (
                    <div key={cert.id} className="animate-fade-in">
                      <CertificateCard
                        certificate={cert}
                        onView={openModal}
                        onDelete={(c) => deleteCertificate(c.id, c.file_path)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="Detail Sertifikat"
        description={selectedCert?.file_name}
        size="lg"
      >
        {loadingModal ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[rgb(34_72_19)] animate-spin mb-4" />
            <span className="text-gray-500 text-sm font-bold">Memuat detail sertifikat...</span>
          </div>
        ) : (
          selectedCert && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Preview */}
              <div className="flex flex-col space-y-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Pratinjau Dokumen</h4>
                {signedUrl ? (
                  <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden flex-1 min-h-[300px] relative flex flex-col items-center justify-center p-6 text-center">
                    {selectedCert.file_type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signedUrl}
                        alt={`Sertifikat ${selectedCert.title || selectedCert.file_name}`}
                        className="object-contain max-h-[350px] w-full shadow-sm rounded-lg"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-white border border-gray-200 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Dokumen PDF Terkunci</p>
                          <p className="text-gray-500 text-xs mt-1 font-medium">
                            Unduh untuk membaca dokumen PDF secara lengkap.
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
                    Dokumen tidak tersedia.
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-6">
                {/* Status */}
                <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                  selectedCert.status === 'approved'
                    ? 'bg-green-50/50 border-green-200 text-green-800'
                    : selectedCert.status === 'rejected' || selectedCert.status === 'failed'
                    ? 'bg-red-50/50 border-red-200 text-red-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-extrabold">Status Verifikasi</p>
                    <Badge variant={
                      selectedCert.status === 'approved' ? 'success'
                      : selectedCert.status === 'rejected' || selectedCert.status === 'failed' ? 'error'
                      : selectedCert.status === 'waiting_review' ? 'warning'
                      : 'default'
                    } className="mt-1">
                      {selectedCert.status === 'pending' && 'Mengantri Analisis AI'}
                      {selectedCert.status === 'processing' && 'Dianalisis AI'}
                      {selectedCert.status === 'waiting_review' && 'Menunggu Verifikasi Dosen'}
                      {selectedCert.status === 'approved' && 'Sertifikat Disetujui'}
                      {selectedCert.status === 'rejected' && 'Sertifikat Ditolak'}
                      {selectedCert.status === 'failed' && 'Gagal Analisis AI'}
                    </Badge>
                  </div>
                  {selectedCert.status === 'approved' && <CheckCircle className="w-8 h-8 text-green-600" />}
                  {(selectedCert.status === 'rejected' || selectedCert.status === 'failed') && <XCircle className="w-8 h-8 text-red-500" />}
                  {selectedCert.status === 'waiting_review' && <Clock className="w-8 h-8 text-amber-600 animate-pulse" />}
                </div>

                {/* Extracted details */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                    Informasi Ekstraksi AI
                  </h4>
                  {selectedCert.title ? (
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Kegiatan</span>
                        <span className="text-gray-800 col-span-2 font-bold">{selectedCert.title}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Penyelenggara</span>
                        <span className="text-gray-700 col-span-2 font-medium">{selectedCert.organizer}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Kategori</span>
                        <span className="col-span-2">
                          <Badge variant="uinsu">{selectedCert.category}</Badge>
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Tanggal</span>
                        <span className="text-gray-700 col-span-2 flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {selectedCert.event_date
                            ? new Date(selectedCert.event_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Durasi</span>
                        <span className="text-gray-700 col-span-2 flex items-center gap-1.5 font-medium">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic py-2 font-medium">
                      Sedang mengekstrak data dari sertifikat...
                    </p>
                  )}
                </div>

                {/* AI Recommendation */}
                {aiAnalysis && (
                  <div className="bg-gradient-to-br from-[rgb(232_245_233)] to-white border border-[rgb(76_175_80)]/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgb(76_175_80)]/20 pb-2">
                      <h4 className="font-bold text-[rgb(34_72_19)] text-xs uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Rekomendasi Analisis AI
                      </h4>
                      <span className="text-[10px] text-gray-500 font-bold">Model: {aiAnalysis.model_name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Rekomendasi Bobot</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{aiAnalysis.recommended_weight}</p>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Confidence Score</p>
                        <p className="text-xl font-black text-[rgb(34_72_19)] mt-1.5">
                          {aiAnalysis.confidence != null ? `${(aiAnalysis.confidence * 100).toFixed(0)}%` : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm space-y-1.5">
                      <span className="text-gray-500 font-bold block uppercase text-[10px]">Alasan AI:</span>
                      <p className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 leading-relaxed text-xs font-medium">
                        {aiAnalysis.reasoning || aiAnalysis.extracted_text || 'Sertifikat valid dan memenuhi kriteria verifikasi AI.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lecturer Decision */}
                {(selectedCert.status === 'approved' || selectedCert.status === 'rejected') && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                      Keputusan Verifikator Dosen
                    </h4>
                    <div className="text-sm space-y-3">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Bobot Akhir</span>
                        <span className="text-gray-900 col-span-2 font-black text-lg leading-none">
                          {selectedCert.final_weight}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Catatan Review Dosen:</span>
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