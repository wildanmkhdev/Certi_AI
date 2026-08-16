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
  const [idNumber, setIdNumber] = useState(''); // student_number or lecturer_number
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
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">CertiAI</h1>
          <p className="text-slate-400 mt-2 text-sm text-center">
            Sistem Verifikasi Sertifikat Mahasiswa Berbasis AI
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-emerald-400 font-semibold text-lg">Pendaftaran Berhasil!</h3>
            <p className="text-slate-400 text-sm mt-2">
              Akun Anda telah terdaftar. Anda akan dialihkan ke halaman login dalam beberapa detik...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-800/50 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setIdNumber('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('lecturer');
                  setIdNumber('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'lecturer'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Dosen
              </button>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* ID Number (Student/Lecturer) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {role === 'student' ? 'Nomor Induk Mahasiswa (NIM)' : 'Nomor Induk Dosen (NIDN)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Shield className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder={role === 'student' ? 'Contoh: 220010150' : 'Contoh: 0423088902'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="contoh@universitas.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 Karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>

            <p className="text-slate-400 text-xs text-center mt-6">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
