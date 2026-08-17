'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Award, 
  Upload, 
  CheckCircle, 
  FileText, 
  Clock, 
  Shield, 
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Users,
  TrendingUp,
  FileCheck,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-gray-900">
                Certi<span className="text-[rgb(34_72_19)]">AI</span>
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                UIN Sumatera Utara
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="md">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[rgb(249_250_251)] to-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgb(232_245_233)] rounded-full blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[rgb(232_245_233)] rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
            <div className="text-center space-y-8">
              {/* Badge */}
              <div className="animate-fade-in flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[rgb(76_175_80)]/20 rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-[rgb(34_72_19)]" />
                    <span className="absolute inset-0 blur animate-pulse">
                      <Sparkles className="w-4 h-4 text-[rgb(76_175_80)]" />
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[rgb(34_72_19)] uppercase tracking-wider">
                    Sistem Verifikasi AI-Powered
                  </span>
                </div>
              </div>

              {/* Main Heading */}
              <div className="animate-fade-in delay-anim-100 space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                  Verifikasi Sertifikat
                  <br />
                  <span className="relative inline-block">
                    <span className="text-gradient">Lebih Cepat & Akurat</span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full text-[rgb(76_175_80)]"
                      height="12"
                      viewBox="0 0 300 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 10C50 5 250 5 298 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="animate-fade-in delay-anim-200 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Platform AI terdepan untuk verifikasi sertifikat mahasiswa UINSU. 
                Ekstraksi otomatis, rekomendasi bobot cerdas, dan verifikasi dosen — 
                semua dalam hitungan detik.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-in delay-anim-300 flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    icon={<Zap className="w-5 h-5" />}
                    className="text-base px-8 py-4 shadow-green"
                  >
                    Mulai Sekarang — Gratis
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="secondary" size="lg" className="text-base px-8 py-4">
                    Lihat Cara Kerja
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="animate-fade-in delay-anim-500 pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-[rgb(34_72_19)]">99%</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">Akurasi AI</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-3xl sm:text-4xl font-black text-[rgb(34_72_19)]">&lt;10s</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">Proses Analisis</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-[rgb(34_72_19)]">100%</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">Keamanan Data</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgb(232_245_233)] rounded-full text-xs font-bold text-[rgb(34_72_19)] uppercase tracking-wider mb-4">
                <Star className="w-3.5 h-3.5" />
                Fitur Unggulan
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
                Tiga Langkah Sederhana
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Dari upload hingga verifikasi, semuanya dirancang untuk efisiensi maksimal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card-hover p-8 group animate-fade-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Upload Sertifikat</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Drag & drop file PDF atau gambar sertifikat. Sistem kami mendukung berbagai format dan ukuran hingga 10MB.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(34_72_19)]">
                  <span>PDF, JPG, PNG</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card-hover p-8 group animate-fade-in delay-anim-100">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. AI Menganalisis</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Gemini AI membaca, mengekstrak informasi kegiatan, kategori, durasi, dan memberikan rekomendasi bobot secara cerdas.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(34_72_19)]">
                  <span>Powered by Google Gemini</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card-hover p-8 group animate-fade-in delay-anim-200">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Dosen Verifikasi</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Dosen review hasil AI, menyesuaikan bobot jika perlu, dan memberikan keputusan akhir dengan catatan.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(34_72_19)]">
                  <span>Human in the loop</span>
                  <Shield className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Benefits List */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Keunggulan
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                  Kenapa CertiAI?
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Sistem verifikasi sertifikat paling canggih untuk institusi pendidikan modern
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    {
                      icon: <Clock className="w-5 h-5" />,
                      title: 'Hemat Waktu 90%',
                      desc: 'AI memproses dalam detik, bukan jam atau hari',
                    },
                    {
                      icon: <Shield className="w-5 h-5" />,
                      title: 'Data Terenkripsi',
                      desc: 'File disimpan di storage privat dengan akses terbatas',
                    },
                    {
                      icon: <Users className="w-5 h-5" />,
                      title: 'Keputusan Final pada Dosen',
                      desc: 'AI hanya merekomendasikan, manusia yang memutuskan',
                    },
                    {
                      icon: <FileCheck className="w-5 h-5" />,
                      title: 'Audit Trail Lengkap',
                      desc: 'Semua aktivitas tercatat untuk transparansi',
                    },
                  ].map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[rgb(76_175_80)]/30 hover:shadow-md transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-[rgb(232_245_233)] rounded-lg flex items-center justify-center text-[rgb(34_72_19)]">
                        {benefit.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{benefit.title}</h4>
                        <p className="text-sm text-gray-600">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Visual */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] rounded-3xl blur-3xl opacity-20" />
                <div className="relative bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
                  <div className="space-y-4">
                    {/* Mock Certificate Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[rgb(232_245_233)] rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[rgb(34_72_19)]" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    </div>

                    {/* Mock AI Analysis */}
                    <div className="bg-gradient-to-br from-[rgb(232_245_233)] to-white border border-[rgb(76_175_80)]/30 rounded-xl p-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[rgb(34_72_19)]">
                        <Sparkles className="w-4 h-4" />
                        Hasil Analisis AI
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Kategori:</span>
                          <span className="font-bold text-gray-900">Workshop</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Durasi:</span>
                          <span className="font-bold text-gray-900">8 Jam</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rekomendasi:</span>
                          <span className="font-black text-[rgb(34_72_19)] text-lg">Bobot 1</span>
                        </div>
                      </div>
                    </div>

                    {/* Mock Approval */}
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-sm font-bold text-green-700">Status</span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-bold text-green-700">Disetujui</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(27_54_15)] relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                Siap Mengoptimalkan <br className="hidden sm:block" />
                Verifikasi Sertifikat?
              </h2>
              <p className="text-lg text-green-100 max-w-2xl mx-auto">
                Bergabung dengan UINSU dalam transformasi digital proses verifikasi sertifikat mahasiswa
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="bg-white text-[rgb(34_72_19)] hover:bg-gray-50 shadow-xl px-8 py-4 text-base font-bold"
                  >
                    Daftar Sekarang — Gratis
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    size="lg"
                    className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 py-4 text-base font-bold"
                  >
                    Sudah Punya Akun? Masuk
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] flex items-center justify-center shadow-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-gray-900">
                  Certi<span className="text-[rgb(34_72_19)]">AI</span>
                </span>
                <p className="text-xs text-gray-500">UIN Sumatera Utara</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                © 2026 CertiAI — Universitas Islam Negeri Sumatera Utara
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-semibold">AI assists. Human decides.</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
