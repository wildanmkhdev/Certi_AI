'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Award, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
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
              Masuk untuk verifikasi <br />
              <span className="text-[#059669]">sertifikat mahasiswa</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Login sebagai dosen untuk mereview dan memverifikasi sertifikat yang telah dianalisis oleh AI.
            </p>
            
            <div className="pt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <ArrowRight className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Analisis Cepat</p>
                  <p className="text-sm text-slate-500">Hasil AI dalam hitungan detik</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <ArrowRight className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Verifikasi Akurat</p>
                  <p className="text-sm text-slate-500">Keputusan akhir oleh dosen</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <ArrowRight className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Data Aman</p>
                  <p className="text-sm text-slate-500">File tersimpan di storage privat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl shadow-xl shadow-[#059669]/10 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Masuk ke Akun</h2>
              <p className="text-slate-500 text-sm">Gunakan kredensial yang sudah didaftarkan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

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
                    placeholder="••••••••"
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
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-600 text-sm">
                Belum punya akun?{' '}
                <Link href="/register" className="text-[#059669] font-bold hover:text-[#047857] transition-colors">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
