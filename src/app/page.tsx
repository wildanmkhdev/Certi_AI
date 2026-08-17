'use client';

import Link from 'next/link';
import { Award, Upload, CheckCircle, FileText, Clock, User, BookOpen, Shield, Star, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      {/* HEADER */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900">Certi<span className="text-[#059669]">AI</span></span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">UIN SU Medan</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-[#059669]/15 active:scale-[0.98] flex items-center gap-2"
          >
            Daftar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full text-xs font-bold text-[#059669] uppercase tracking-wider">
            <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
            Sistem Verifikasi Sertifikat Berbasis AI
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1]">
            Verifikasi Sertifikat <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#10B981]">
              Lebih Cepat & Akurat
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload sertifikat kegiatan mahasiswa UINSU. AI kami akan menganalisis,
            mengekstrak informasi, dan merekomendasikan bobot — semua dalam hitungan detik.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-[#059669]/20 hover:shadow-[#059669]/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 bg-white border border-slate-200 hover:border-[#059669] text-slate-700 hover:text-[#059669] rounded-xl text-lg font-semibold transition-all active:scale-[0.98]"
            >
              Pelajari Cara Kerja
            </Link>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#059669] transition-colors duration-300">
              <Upload className="w-7 h-7 text-[#059669] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Sertifikat</h3>
            <p className="text-slate-600 leading-relaxed">
              Seret dan lepas file PDF atau gambar sertifikat. Sistem akan menyimpannya secara aman di storage privat.
            </p>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#059669] transition-colors duration-300">
              <FileText className="w-7 h-7 text-[#059669] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Menganalisis</h3>
            <p className="text-slate-600 leading-relaxed">
              Gemini AI membaca dan mengekstrak informasi kegiatan, kategori, dan menghitung bobot yang sesuai.
            </p>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#059669] transition-colors duration-300">
              <CheckCircle className="w-7 h-7 text-[#059669] group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Dosen Memverifikasi</h3>
            <p className="text-slate-600 leading-relaxed">
              Dosen review hasil AI, menyesuaikan bobot, dan memberikan keputusan akhir — keamanan terjaga.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mt-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Tata Cara Penggunaan</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Panduan lengkap untuk mahasiswa dan dosen dalam menggunakan sistem CertiAI
            </p>
          </div>

          {/* STUDENT GUIDE */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-12">
            <div className="bg-[#059669] p-6 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Untuk Mahasiswa</h3>
                <p className="text-green-100">Upload sertifikat, cek status, dan lihat hasil verifikasi</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Daftar Akun</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Klik tombol "Daftar" di header. Pilih role sebagai Mahasiswa, isi NIM, nama lengkap, dan email UINSU. Buat password dan selesaikan pendaftaran.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Login ke Dashboard</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Masukkan email dan password yang telah didaftarkan. Klik "Masuk" untuk masuk ke dashboard mahasiswa.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Upload Sertifikat</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Di dashboard, temukan area drag & drop untuk mengupload sertifikat. Format yang didukung: PDF, JPG, JPEG, PNG (maks. 10MB). Anda bisa seret file atau klik untuk memilih.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">4</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Monitor Status</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah upload, sistem akan memproses sertifikat melalui AI. Status akan berubah: Mengantri → Dianalisis AI → Menunggu Dosen → Disetujui/Ditolak. Periksa notifikasi untuk update.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">5</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Lihat Hasil</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Klik "Detail" pada sertifikat untuk melihat hasil analisis AI, bobot yang direkomendasikan, dan keputusan akhir dosen. Jika disetujui, bobot akhir akan tercatat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LECTURER GUIDE */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="bg-[#059669] p-6 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Untuk Dosen</h3>
                <p className="text-green-100">Review sertifikat mahasiswa, berikan bobot akhir, dan verifikasi keputusan</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Daftar / Login sebagai Dosen</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Saat registrasi, pilih role sebagai Dosen dan isi NIDN Anda. Setelah akun dibuat, login dengan email dan password yang didaftarkan.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Akses Dashboard Dosen</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah login, Anda akan langsung mengakses dashboard dosen yang menampilkan daftar sertifikat menunggu verifikasi.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Review Sertifikat</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Klik tombol "Review" pada sertifikat yang menunggu. Anda dapat melihat berkas asli (PDF/gambar), informasi ekstraksi AI, dan rekomendasi bobot.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">4</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Berikan Keputusan</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Review hasil AI. Anda dapat menyesuaikan bobot jika diperlukan, menambahkan catatan untuk mahasiswa, lalu memilih "Setujui" atau "Tolak" sertifikat.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-lg">5</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Mahasiswa Menerima Notifikasi</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah Anda menyetujui atau menolak sertifikat, mahasiswa akan langsung menerima notifikasi dan dapat melihat hasil verifikasi di dashboard mereka.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#059669]" />
              </div>
              <h4 className="font-bold text-[#059669] mb-2">Proses Cepat</h4>
              <p className="text-sm text-slate-600">AI menganalisis sertifikat dalam hitungan detik.</p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-[#059669]" />
              </div>
              <h4 className="font-bold text-[#059669] mb-2">Data Aman</h4>
              <p className="text-sm text-slate-600">File disimpan di storage privat, hanya bisa diakses pihak berwenang.</p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-[#059669]" />
              </div>
              <h4 className="font-bold text-[#059669] mb-2">Review Manusia</h4>
              <p className="text-sm text-slate-600">Keputusan akhir tetap berada pada dosen, bukan AI.</p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-[#059669]" />
              </div>
              <h4 className="font-bold text-[#059669] mb-2">Rekomendasi Bobot</h4>
              <p className="text-sm text-slate-600">AI memberikan rekomendasi bobot sesuai aturan UINSU.</p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Certi<span className="text-[#059669]">AI</span> UINSU</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 CertiAI. Universitas Islam Negeri Sumatera Utara Medan. <br className="md:hidden" />
              AI assists. Human decides.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
