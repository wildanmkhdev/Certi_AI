import Link from 'next/link';
import { Award, ArrowRight, ShieldCheck, Cpu, Zap, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      {/* HEADER */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Award className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CertiAI</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 active:scale-[0.98]"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-16 text-center space-y-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-blue-400 tracking-wider uppercase mx-auto animate-pulse">
          <Star className="w-3.5 h-3.5 fill-blue-400/20" />
          AI-Assisted Certificate Review
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Verifikasi Sertifikat Anda <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Lebih Cepat Dengan AI
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            CertiAI menggunakan kecerdasan buatan untuk membaca, mengekstrak data kegiatan, dan merekomendasikan bobot sertifikat mahasiswa secara instan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 text-sm w-full sm:w-auto justify-center active:scale-[0.99]"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold rounded-xl transition-all text-sm w-full sm:w-auto justify-center flex items-center"
          >
            Masuk Ke Akun
          </Link>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Ekstraksi Instan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI membaca file PDF/Gambar secara otomatis untuk mengambil nama, kategori, tanggal, dan durasi kegiatan.
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Rekomendasi Bobot</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sistem mencocokkan parameter sertifikat dengan tabel aturan pembobotan akademik untuk merekomendasikan poin bobot.
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Kendali Manusia</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI hanya memberi rekomendasi. Keputusan akhir tetap berada di tangan dosen verifikator untuk persetujuan akhir.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CertiAI. Sistem Verifikasi Sertifikat Mahasiswa.</p>
          <div className="flex gap-4">
            <span>AI assists. Human decides.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
