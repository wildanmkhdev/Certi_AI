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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#224813]/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[120px]" />

      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#224813] to-emerald-600 flex items-center justify-center shadow-md shadow-[#224813]/10 mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Certi<span className="text-[#224813]">AI</span></h1>
          <p className="text-slate-500 mt-1 text-sm text-center font-medium">
            Buat akun verifikasi sertifikat UINSU Anda
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#224813] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-[#224813] font-bold text-lg">Pendaftaran Berhasil!</h3>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              Akun Anda telah terdaftar. Anda akan dialihkan ke halaman login dalam beberapa detik...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setIdNumber('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  role === 'student'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
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
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  role === 'lecturer'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                Dosen
              </button>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#224813] focus:ring-2 focus:ring-[#224813]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* ID Number (Student/Lecturer) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {role === 'student' ? 'Nomor Induk Mahasiswa (NIM)' : 'Nomor Induk Dosen (NIDN)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Shield className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder={role === 'student' ? 'Contoh: 220010150' : 'Contoh: 0423088902'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#224813] focus:ring-2 focus:ring-[#224813]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="contoh@uinsu.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#224813] focus:ring-2 focus:ring-[#224813]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 Karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#224813] focus:ring-2 focus:ring-[#224813]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#224813] to-emerald-700 hover:from-[#1a360f] hover:to-emerald-800 text-white font-bold rounded-xl shadow-md shadow-[#224813]/10 hover:shadow-[#224813]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer duration-300"
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

            <p className="text-slate-500 text-xs text-center mt-6 font-medium">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-[#224813] hover:text-[#1a360f] font-bold underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
