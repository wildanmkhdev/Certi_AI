'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  LogOut,
  User as UserIcon,
  Loader2,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Certificate, Profile, Notification } from '@/types/database';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Upload Form states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail Modal states
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchUserData();
    
    // Set up polling for certificates and notifications to get updates from AI analysis
    const interval = setInterval(() => {
      fetchCertificates();
      fetchNotifications();
    }, 6000);

    return () => clearInterval(interval);
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

      // Certificates & Notifications
      await Promise.all([
        fetchCertificates(user.id),
        fetchNotifications(user.id)
      ]);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async (userId?: string) => {
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      uid = user.id;
    }

    const { data } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      setCertificates(data);
    }
  };

  const fetchNotifications = async (userId?: string) => {
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      uid = user.id;
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Upload Logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    // Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Tipe file tidak didukung. Harap unggah PDF, JPG, atau PNG.');
      setUploading(false);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('Ukuran file melebihi batas 10 MB.');
      setUploading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session not found');

      const certificateId = crypto.randomUUID();
      // Path format: {user_id}/{certificate_id}/{filename}
      const filePath = `${user.id}/${certificateId}/${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadStorageError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadStorageError) {
        throw uploadStorageError;
      }

      // Create Certificate record in database
      const { data: cert, error: insertError } = await supabase
        .from('certificates')
        .insert({
          id: certificateId,
          student_id: user.id,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        // cleanup file
        await supabase.storage.from('certificates').remove([filePath]);
        throw insertError;
      }

      // Trigger AI Analysis route handler in the background
      fetch('/api/certificates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: cert.id }),
      }).catch(err => console.error('Background AI call error:', err));

      // Fetch immediately
      await fetchCertificates(user.id);
      await fetchNotifications(user.id);
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah sertifikat.');
    } finally {
      setUploading(false);
    }
  };

  const deleteCertificate = async (id: string, filePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sertifikat ini?')) return;

    try {
      // Delete storage file
      await supabase.storage.from('certificates').remove([filePath]);
      // Delete database record (cascade takes care of notifications/AI analysis)
      await supabase.from('certificates').delete().eq('id', id);

      setCertificates(prev => prev.filter(c => c.id !== id));
      if (selectedCert?.id === id) {
        setSelectedCert(null);
      }
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
      // 1. Fetch AI Analysis details
      const { data: analysis } = await supabase
        .from('certificate_ai_analysis')
        .select('*')
        .eq('certificate_id', cert.id)
        .maybeSingle();

      setAiAnalysis(analysis);

      // 2. Generate Signed URL for preview
      const { data: signed } = await supabase.storage
        .from('certificates')
        .createSignedUrl(cert.file_path, 3600);

      if (signed) {
        setSignedUrl(signed.signedUrl);
      }
    } catch (err) {
      console.error('Error opening certificate details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!profile) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Stats calculation
  const statsTotal = certificates.length;
  const statsApproved = certificates.filter(c => c.status === 'approved').length;
  const statsPending = certificates.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const statsWaiting = certificates.filter(c => c.status === 'waiting_review' || c.status === 'ai_completed').length;
  const statsRejected = certificates.filter(c => c.status === 'rejected').length;
  const statsWeight = certificates.reduce((acc, c) => acc + (c.status === 'approved' ? Number(c.final_weight || 0) : 0), 0);

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Memuat Dashboard Mahasiswa...</p>
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
              <p className="text-xs text-slate-400">Dashboard Mahasiswa</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-white">Notifikasi</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Tidak ada notifikasi.</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markNotificationRead(notif.id);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            notif.is_read
                              ? 'bg-slate-950/20 border-slate-800/40 text-slate-400'
                              : 'bg-blue-950/20 border-blue-900/40 text-slate-200 shadow-md shadow-blue-500/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold">{notif.title}</span>
                            {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-slate-400 mt-1">{notif.message}</p>
                          <span className="text-[10px] text-slate-600 block mt-2">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Summary */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-500">NIM: {profile?.student_number}</p>
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
            <p className="text-xs text-slate-500">NIM: {profile?.student_number}</p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Unggahan</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{statsTotal}</span>
              <FileText className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disetujui Dosen</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-emerald-400">{statsApproved}</span>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-500">{statsWaiting}</span>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ditolak Dosen</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-red-500">{statsRejected}</span>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-900/10 to-violet-900/10 border border-blue-900/30 rounded-2xl p-5 shadow-lg shadow-blue-500/5">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Bobot Akhir</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-white">{statsWeight}</span>
              <Award className="w-7 h-7 text-blue-400" />
            </div>
          </div>
        </div>

        {/* MAIN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* UPLOAD SECTION (1 Col) */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="font-bold text-white text-lg">Unggah Sertifikat Baru</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Unggah berkas sertifikat Anda. AI akan menganalisis nama, durasi, kategori, dan rekomendasi bobot secara otomatis.
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl">
                  {uploadError}
                </div>
              )}

              {/* Drag Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center relative overflow-hidden ${
                  dragActive
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                
                {uploading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-slate-200 text-sm font-semibold">Mengunggah & Memproses AI...</span>
                    <span className="text-slate-500 text-[10px]">Jangan menutup halaman ini</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-105 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-slate-300 font-semibold text-sm">Pilih berkas atau seret kemari</span>
                    <span className="text-slate-500 text-[10px] mt-2 block">PDF, JPG, JPEG, PNG hingga 10MB</span>
                  </>
                )}
              </div>

              <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aturan Singkat Bobot:</h4>
                <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
                  <li>Workshop 4-8 jam = Bobot 1</li>
                  <li>Workshop &gt;8 jam = Bobot 2</li>
                  <li>Seminar &lt;4 jam = Bobot 1</li>
                  <li>Kompetisi: Lokal (1), Nasional (2), Internasional (3)</li>
                  <li>Sertifikasi Keahlian = Bobot 3</li>
                </ul>
              </div>
            </div>
          </div>

          {/* LIST SECTION (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="font-bold text-white text-lg">Daftar Sertifikat Anda</h3>
                  <p className="text-slate-400 text-xs mt-1">Total {certificates.length} sertifikat telah diunggah</p>
                </div>
                <button
                  onClick={() => {
                    fetchCertificates();
                    fetchNotifications();
                  }}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-slate-400 transition-all flex items-center gap-2 text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  Segarkan
                </button>
              </div>

              {certificates.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-slate-600 mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-400 font-bold">Belum Ada Sertifikat</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs">
                    Gunakan panel sebelah kiri untuk mengunggah sertifikat kegiatan Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-2">Nama Berkas</th>
                        <th className="py-3 px-2 hidden md:table-cell">Kategori / Kegiatan</th>
                        <th className="py-3 px-2 text-center">Bobot</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {certificates.map(cert => (
                        <tr key={cert.id} className="hover:bg-slate-900/10 transition-all">
                          <td className="py-4 px-2 max-w-[150px] md:max-w-[200px] truncate">
                            <p className="font-bold text-white text-xs truncate" title={cert.file_name}>
                              {cert.file_name}
                            </p>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              {new Date(cert.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4 px-2 hidden md:table-cell">
                            {cert.title ? (
                              <div>
                                <p className="font-semibold text-slate-200 text-xs">{cert.title}</p>
                                <span className="text-[10px] text-slate-500">
                                  {cert.category} • {cert.organizer}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-600 italic text-xs">Memproses AI...</span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-center font-extrabold text-sm text-white">
                            {cert.status === 'approved' ? cert.final_weight : cert.status === 'waiting_review' ? '-' : '-'}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                              cert.status === 'pending'
                                ? 'bg-slate-850 text-slate-400 border border-slate-800'
                                : cert.status === 'processing'
                                ? 'bg-blue-950/50 text-blue-400 border border-blue-900/50 animate-pulse'
                                : cert.status === 'waiting_review' || cert.status === 'ai_completed'
                                ? 'bg-amber-950/50 text-amber-400 border border-amber-900/50'
                                : cert.status === 'approved'
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                                : 'bg-red-950/50 text-red-400 border border-red-900/50'
                            }`}>
                              {cert.status === 'pending' && 'Mengantri'}
                              {cert.status === 'processing' && 'Dianalisis AI'}
                              {(cert.status === 'waiting_review' || cert.status === 'ai_completed') && 'Menunggu Review'}
                              {cert.status === 'approved' && 'Disetujui'}
                              {cert.status === 'rejected' && 'Ditolak'}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openModal(cert)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
                              >
                                Detail
                              </button>
                              
                              <button
                                onClick={() => deleteCertificate(cert.id, cert.file_path)}
                                className="p-2 bg-slate-900/30 hover:bg-red-950/30 border border-transparent hover:border-red-950/50 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* DETAIL MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-lg">Detail Sertifikat</h3>
                <p className="text-slate-400 text-xs truncate max-w-md mt-0.5">{selectedCert.file_name}</p>
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
              <div className="flex-1 py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <span className="text-slate-400 text-xs">Memuat detail sertifikat...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Preview or Download Info */}
                <div className="flex flex-col space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Pratinjau Dokumen</h4>
                  
                  {signedUrl ? (
                    <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden flex-1 min-h-[300px] relative flex flex-col items-center justify-center p-6 text-center">
                      {selectedCert.file_type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signedUrl} alt="Sertifikat" className="object-contain max-h-[350px] w-full" />
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 text-sm">Dokumen PDF Terenkripsi</p>
                            <p className="text-slate-500 text-xs mt-1">Pratinjau langsung tidak tersedia untuk format PDF pribadi.</p>
                          </div>
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Buka / Unduh Berkas
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-800 border-dashed rounded-2xl p-10 text-center text-slate-600">
                      Tautan file tidak tersedia.
                    </div>
                  )}
                </div>

                {/* Right Side: Analysis and Decisions */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    selectedCert.status === 'approved'
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                      : selectedCert.status === 'rejected'
                      ? 'bg-red-950/20 border-red-900/40 text-red-400'
                      : 'bg-slate-950/30 border-slate-850 text-slate-300'
                  }`}>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status Sertifikat</p>
                      <p className="font-bold text-sm mt-0.5">
                        {selectedCert.status === 'pending' && 'Mengantri untuk Analisis AI'}
                        {selectedCert.status === 'processing' && 'Sedang Dianalisis AI'}
                        {selectedCert.status === 'waiting_review' && 'Menunggu Verifikasi Dosen'}
                        {selectedCert.status === 'approved' && 'Telah Disetujui'}
                        {selectedCert.status === 'rejected' && 'Telah Ditolak'}
                      </p>
                    </div>
                    {selectedCert.status === 'approved' && <CheckCircle className="w-8 h-8 text-emerald-500" />}
                    {selectedCert.status === 'rejected' && <XCircle className="w-8 h-8 text-red-500" />}
                    {selectedCert.status === 'waiting_review' && <Clock className="w-8 h-8 text-amber-500" />}
                  </div>

                  {/* Extracted Details */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-2">Informasi Ekstraksi</h4>
                    
                    {selectedCert.title ? (
                      <div className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Kegiatan</span>
                          <span className="text-slate-200 col-span-2 font-bold">{selectedCert.title}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Penyelenggara</span>
                          <span className="text-slate-200 col-span-2">{selectedCert.organizer}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Kategori</span>
                          <span className="text-slate-200 col-span-2">
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-blue-400">
                              {selectedCert.category}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Tanggal</span>
                          <span className="text-slate-200 col-span-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {selectedCert.event_date ? new Date(selectedCert.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Durasi</span>
                          <span className="text-slate-200 col-span-2 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">Sedang mengekstrak data dari sertifikat...</p>
                    )}
                  </div>

                  {/* AI Analysis Recommendations */}
                  {aiAnalysis && (
                    <div className="bg-gradient-to-br from-blue-950/10 to-violet-950/10 border border-blue-900/30 rounded-xl p-5 space-y-4 shadow-lg shadow-blue-500/5">
                      <div className="flex items-center justify-between border-b border-blue-900/20 pb-2">
                        <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider">Rekomendasi Analisis AI</h4>
                        <span className="text-[10px] text-slate-500">Model: {aiAnalysis.model_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-lg text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Rekomendasi Bobot</p>
                          <p className="text-2xl font-black text-white mt-1">{aiAnalysis.recommended_weight}</p>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-lg text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Confidence Score</p>
                          <p className="text-xl font-black text-blue-400 mt-1.5">{(aiAnalysis.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <span className="text-slate-500 font-semibold block">Alasan AI:</span>
                        <p className="p-3 bg-slate-950/50 border border-slate-850/80 rounded-xl text-slate-300 leading-relaxed text-[11px]">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lecturer Decision and Feedback */}
                  {selectedCert.status === 'approved' || selectedCert.status === 'rejected' ? (
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-900 pb-2">Keputusan Verifikator Dosen</h4>
                      
                      <div className="text-xs space-y-3.5">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500 font-semibold">Bobot Akhir</span>
                          <span className="text-white col-span-2 font-black text-sm">{selectedCert.final_weight}</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-slate-500 font-semibold block">Catatan Review Dosen:</span>
                          <p className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 leading-relaxed text-[11px] italic">
                            {selectedCert.status === 'approved' ? (selectedCert.final_weight !== (aiAnalysis?.recommended_weight ?? -1) ? 'Disetujui dengan penyesuaian bobot.' : 'Disetujui sesuai rekomendasi AI.') : 'Sertifikat tidak memenuhi kriteria verifikasi.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
