import Link from 'next/link';
import { Award, ArrowRight, ShieldCheck, Cpu, Zap, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#224813]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />

      {/* HEADER */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#224813] to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-700/10 hover:scale-105 transition-transform duration-300">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900">Certi<span className="text-[#224813]">AI</span></span>
            <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase -mt-1">UIN SU MEDAN</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-600 hover:text-[#224813] transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#224813] hover:bg-[#1a360f] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#224813]/10 hover:shadow-[#224813]/25 active:scale-[0.98] duration-300"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-16 text-center space-y-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-extrabold text-[#224813] tracking-wider uppercase mx-auto shadow-sm">
          <Star className="w-3.5 h-3.5 fill-[#D19200] text-[#D19200]" />
          AI-Assisted Certificate Review System
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-none">
            Verifikasi Sertifikat Anda <br />
            <span className="bg-gradient-to-r from-[#224813] via-emerald-700 to-[#D19200] bg-clip-text text-transparent">
              Lebih Cepat & Akurat Dengan AI
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            CertiAI menggunakan kecerdasan buatan untuk membaca, mengekstrak data kegiatan, dan merekomendasikan bobot sertifikat mahasiswa UINSU secara instan dan aman.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="px-7 py-3.5 bg-gradient-to-r from-[#224813] to-emerald-700 hover:from-[#1b3a0f] hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-850/15 hover:shadow-emerald-850/25 transition-all duration-300 flex items-center gap-2 text-sm w-full sm:w-auto justify-center active:scale-[0.99]"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-[#224813] hover:border-[#224813]/20 font-bold rounded-xl transition-all duration-300 text-sm w-full sm:w-auto justify-center flex items-center shadow-sm"
          >
            Masuk Ke Akun
          </Link>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 bg-white border border-slate-150 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-emerald-600/20 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#224813] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Ekstraksi Instan</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              AI membaca file PDF atau Gambar secara otomatis untuk mengambil nama, kategori, tanggal, dan durasi kegiatan.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-150 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-emerald-600/20 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#224813] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Rekomendasi Bobot</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Sistem mencocokkan parameter sertifikat dengan aturan pembobotan akademik UINSU secara langsung untuk merekomendasikan poin bobot.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-150 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-emerald-600/20 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#224813] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Verifikasi Dosen</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Kecerdasan Buatan (AI) hanya merekomendasikan. Persetujuan dan keputusan final ada pada dosen verifikator.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CertiAI. Universitas Islam Negeri Sumatera Utara Medan.</p>
          <div className="flex gap-4 font-semibold">
            <span className="text-[#224813]">AI assists. Human decides.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
