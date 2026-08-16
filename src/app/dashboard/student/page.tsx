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
  ExternalLink,
  RefreshCw,
  Star,
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
        await supabase.storage.from('certificates').remove([filePath]);
        throw insertError;
      }

      // Trigger AI Analysis route handler in the background
      fetch('/api/certificates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: cert.id }),
      }).catch(err => console.error('Background AI call error:', err));

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
      await supabase.storage.from('certificates').remove([filePath]);
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
      const { data: analysis } = await supabase
        .from('certificate_ai_analysis')
        .select('*')
        .eq('certificate_id', cert.id)
        .maybeSingle();

      setAiAnalysis(analysis);

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

  const statsTotal = certificates.length;
  const statsApproved = certificates.filter(c => c.status === 'approved').length;
  const statsPending = certificates.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const statsWaiting = certificates.filter(c => c.status === 'waiting_review' || c.status === 'ai_completed').length;
  const statsRejected = certificates.filter(c => c.status === 'rejected').length;
  const statsWeight = certificates.reduce((acc, c) => acc + (c.status === 'approved' ? Number(c.final_weight || 0) : 0), 0);

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-55 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-[#224813] animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Memuat Dashboard Mahasiswa...</p>
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
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Dashboard Mahasiswa</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#224813] hover:border-slate-300 transition-all relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Notifikasi</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-[#224813] hover:text-[#1a360f] font-bold"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Tidak ada notifikasi.</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markNotificationRead(notif.id);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            notif.is_read
                              ? 'bg-slate-50/50 border-slate-100 text-slate-500'
                              : 'bg-emerald-50/30 border-emerald-100 text-slate-800 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900">{notif.title}</span>
                            {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 block mt-2 font-medium">
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
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#224813]">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold">NIM: {profile?.student_number}</p>
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
            <p className="text-xs text-slate-450 font-bold">NIM: {profile?.student_number}</p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Unggahan</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{statsTotal}</span>
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-700">{statsWaiting}</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
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

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-50 to-[#224813]/5 border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-[#224813] uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#D19200] text-[#D19200] animate-pulse" />
              Bobot Disetujui
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-slate-900">{statsWeight}</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-600/10 flex items-center justify-center text-[#224813]">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* UPLOAD SECTION (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Unggah Sertifikat Baru</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed font-medium">
                  Seret atau pilih file sertifikat Anda. AI UINSU akan menganalisis data kegiatan & merekomendasikan bobot secara instan.
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-shake">
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
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center relative overflow-hidden ${
                  dragActive
                    ? 'border-[#224813] bg-emerald-50/40 shadow-inner'
                    : 'border-slate-200 bg-slate-50/55 hover:border-[#224813]/40 hover:bg-emerald-50/10'
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
                    <Loader2 className="w-8 h-8 text-[#224813] animate-spin" />
                    <span className="text-slate-800 text-xs font-bold">Menganalisis file dengan AI...</span>
                    <span className="text-slate-400 text-[10px] font-medium">Harap tunggu, jangan tutup halaman ini</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-250 flex items-center justify-center mb-4 text-[#224813] shadow-sm hover:scale-105 transition-transform duration-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-bold text-xs">Pilih dokumen atau seret ke sini</span>
                    <span className="text-slate-400 text-[9px] mt-1.5 block font-medium">PDF, JPG, JPEG, PNG hingga 10MB</span>
                  </>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aturan Singkat Bobot UINSU:</h4>
                <ul className="text-[10px] text-slate-500 list-disc list-inside space-y-1 font-medium">
                  <li>Workshop 4-8 jam = Bobot 1</li>
                  <li>Workshop &gt;8 jam = Bobot 2</li>
                  <li>Seminar &lt;4 jam = Bobot 1</li>
                  <li>Kompetisi: Lokal (1), Nasional (2), Internasional (3)</li>
                  <li>Sertifikasi Keahlian Profesi = Bobot 3</li>
                </ul>
              </div>
            </div>
          </div>

          {/* LIST SECTION (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Daftar Sertifikat Anda</h3>
                  <p className="text-slate-500 text-xs mt-1 font-medium">Total {certificates.length} sertifikat terunggah</p>
                </div>
                <button
                  onClick={() => {
                    fetchCertificates();
                    fetchNotifications();
                  }}
                  className="p-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-[#224813] transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Segarkan
                </button>
              </div>

              {certificates.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-700 font-bold text-sm">Belum Ada Sertifikat</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-xs font-medium">
                    Gunakan panel unggah di samping untuk mengirim sertifikat kegiatan Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Nama Berkas</th>
                        <th className="py-3 px-2 hidden md:table-cell">Kategori / Kegiatan</th>
                        <th className="py-3 px-2 text-center">Bobot</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {certificates.map(cert => (
                        <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2 max-w-[150px] md:max-w-[200px] truncate">
                            <p className="font-bold text-slate-900 truncate" title={cert.file_name}>
                              {cert.file_name}
                            </p>
                            <span className="text-[9px] text-slate-450 font-semibold block mt-1">
                              {new Date(cert.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </td>
                          <td className="py-4 px-2 hidden md:table-cell">
                            {cert.title ? (
                              <div>
                                <p className="font-bold text-slate-800">{cert.title}</p>
                                <span className="text-[9px] text-slate-450 font-bold">
                                  {cert.category} • {cert.organizer}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-medium">Sedang memproses AI...</span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-center font-extrabold text-slate-900 text-sm">
                            {cert.status === 'approved' ? cert.final_weight : '-'}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider border ${
                              cert.status === 'pending'
                                ? 'bg-slate-50 text-slate-500 border-slate-200'
                                : cert.status === 'processing'
                                ? 'bg-blue-50 text-blue-800 border-blue-150 animate-pulse'
                                : cert.status === 'waiting_review' || cert.status === 'ai_completed'
                                ? 'bg-amber-50/60 text-amber-800 border-amber-150'
                                : cert.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                                : 'bg-red-50/60 text-red-800 border-red-150'
                            }`}>
                              {cert.status === 'pending' && 'Mengantri'}
                              {cert.status === 'processing' && 'Dianalisis AI'}
                              {(cert.status === 'waiting_review' || cert.status === 'ai_completed') && 'Menunggu Dosen'}
                              {cert.status === 'approved' && 'Disetujui'}
                              {cert.status === 'rejected' && 'Ditolak'}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openModal(cert)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#224813] text-[#224813] rounded-lg font-bold shadow-sm transition-all cursor-pointer"
                              >
                                Detail
                              </button>
                              
                              <button
                                onClick={() => deleteCertificate(cert.id, cert.file_path)}
                                className="p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 text-slate-400 hover:text-red-650 rounded-lg shadow-sm transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Detail Sertifikat</h3>
                <p className="text-slate-500 text-xs truncate max-w-md mt-0.5 font-medium">{selectedCert.file_name}</p>
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
              <div className="flex-1 py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#224813] animate-spin mb-4" />
                <span className="text-slate-500 text-xs font-bold">Memuat detail sertifikat...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Preview or Download Info */}
                <div className="flex flex-col space-y-4">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Pratinjau Dokumen</h4>
                  
                  {signedUrl ? (
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden flex-1 min-h-[300px] relative flex flex-col items-center justify-center p-6 text-center shadow-inner">
                      {selectedCert.file_type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signedUrl} alt="Sertifikat" className="object-contain max-h-[350px] w-full shadow-sm rounded-lg" />
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white border border-slate-200 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Dokumen PDF Terkunci</p>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Unduh untuk membaca dokumen PDF secara lengkap.</p>
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
                    <div className="border border-slate-200 border-dashed rounded-2xl p-10 text-center text-slate-400 font-semibold">
                      Dokumen tidak tersedia.
                    </div>
                  )}
                </div>

                {/* Right Side: Analysis and Decisions */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                    selectedCert.status === 'approved'
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                      : selectedCert.status === 'rejected'
                      ? 'bg-red-50/50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <p className="text-[9px] text-slate-450 uppercase tracking-wider font-extrabold">Status Verifikasi</p>
                      <p className="font-bold text-xs mt-0.5">
                        {selectedCert.status === 'pending' && 'Mengantri Analisis AI'}
                        {selectedCert.status === 'processing' && 'Dianalisis AI UINSU'}
                        {selectedCert.status === 'waiting_review' && 'Menunggu Verifikasi Dosen'}
                        {selectedCert.status === 'approved' && 'Sertifikat Disetujui'}
                        {selectedCert.status === 'rejected' && 'Sertifikat Ditolak'}
                      </p>
                    </div>
                    {selectedCert.status === 'approved' && <CheckCircle className="w-8 h-8 text-emerald-600" />}
                    {selectedCert.status === 'rejected' && <XCircle className="w-8 h-8 text-red-550" />}
                    {selectedCert.status === 'waiting_review' && <Clock className="w-8 h-8 text-amber-600 animate-pulse" />}
                  </div>

                  {/* Extracted Details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">Informasi Ekstraksi AI</h4>
                    
                    {selectedCert.title ? (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Kegiatan</span>
                          <span className="text-slate-800 col-span-2 font-bold">{selectedCert.title}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Penyelenggara</span>
                          <span className="text-slate-750 col-span-2 font-medium">{selectedCert.organizer}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Kategori</span>
                          <span className="text-slate-800 col-span-2">
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-extrabold text-[#224813]">
                              {selectedCert.category}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Tanggal</span>
                          <span className="text-slate-750 col-span-2 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCert.event_date ? new Date(selectedCert.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Durasi</span>
                          <span className="text-slate-750 col-span-2 flex items-center gap-1.5 font-medium">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCert.duration_hours ? `${selectedCert.duration_hours} Jam` : '-'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2 font-medium">Sedang mengekstrak data dari sertifikat...</p>
                    )}
                  </div>

                  {/* AI Analysis Recommendations */}
                  {aiAnalysis && (
                    <div className="bg-gradient-to-br from-emerald-50 to-[#224813]/5 border border-emerald-100 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                        <h4 className="font-bold text-[#224813] text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#D19200] text-[#D19200]" />
                          Rekomendasi Analisis AI
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold">Model: {aiAnalysis.model_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Rekomendasi Bobot</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{aiAnalysis.recommended_weight}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Confidence Score</p>
                          <p className="text-xl font-black text-emerald-800 mt-1.5">{(aiAnalysis.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <span className="text-slate-500 font-bold block uppercase text-[9px]">Alasan AI:</span>
                        <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-650 leading-relaxed text-[11px] font-medium shadow-sm">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lecturer Decision and Feedback */}
                  {selectedCert.status === 'approved' || selectedCert.status === 'rejected' ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">Keputusan Verifikator Dosen</h4>
                      
                      <div className="text-xs space-y-3">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-450 font-bold uppercase text-[9px]">Bobot Akhir</span>
                          <span className="text-slate-900 col-span-2 font-black text-base leading-none">{selectedCert.final_weight}</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-slate-450 font-bold uppercase text-[9px] block">Catatan Review Dosen:</span>
                          <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 leading-relaxed text-[11px] italic font-medium">
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
