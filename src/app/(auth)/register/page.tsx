'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Shield, Award, BookOpen, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const metadata: Record<string, string> = {
        role,
        full_name: fullName,
      };

      if (role === 'student') {
        metadata.student_number = idNumber;
      } else {
        metadata.lecturer_number = idNumber;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center transition-transform group-hover:scale-105">
            <Award className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Certi<span className="text-[#059669]">AI</span></span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Illustration */}
          <div className="hidden lg:block space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <Award className="w-4 h-4 text-[#059669]" />
              <span className="text-sm font-semibold text-[#059669]">Sistem Verifikasi Sertifikat UINSU</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Mulai verifikasi <br />
              <span className="text-[#059669]">sertifikat sekarang</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              {role === 'student' 
                ? 'Buat akun mahasiswa untuk mengupload sertifikat kegiatan dan memantau status verifikasi.'
                : 'Buat akun dosen untuk mereview dan memverifikasi sertifikat yang telah dianalisis AI.'}
            </p>
            
            <div className="pt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Keamanan Terjamin</p>
                  <p className="text-sm text-slate-500">Data dan file tersimpan di storage privat</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <BookOpen className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Process Otomatis</p>
                  <p className="text-sm text-slate-500">AI membantu ekstraksi dan rekomendasi bobot</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Award className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Verified by Dosen</p>
                  <p className="text-sm text-slate-500">Keputusan akhir tetap oleh dosen verifikator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl shadow-xl shadow-[#059669]/10 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {role === 'student' ? 'Daftar sebagai Mahasiswa' : 'Daftar sebagai Dosen'}
              </h2>
              <p className="text-slate-500 text-sm">Isi data untuk membuat akun baru</p>
            </div>

            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-[#059669]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h3>
                <p className="text-slate-500 text-sm">
                  Akun Anda telah dibuat. Mengarahkan ke halaman login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Role Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                      role === 'student' 
                        ? 'bg-[#059669] text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Mahasiswa
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('lecturer')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                      role === 'lecturer' 
                        ? 'bg-[#059669] text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Dosen
                  </button>
                </div>

                {/* Full Name */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all"
                    />
                  </div>
                </div>

                {/* ID Number */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    {role === 'student' ? 'Nomor Induk Mahasiswa (NIM)' : 'Nomor Induk Dosen (NIDN)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Shield className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder={role === 'student' ? 'Contoh: 220010150' : 'Contoh: 0423088902'}
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email UINSU
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="contoh@uinsu.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Min. 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#059669]/20 hover:shadow-[#059669]/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-slate-600 text-sm">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-[#059669] font-bold hover:text-[#047857] transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
