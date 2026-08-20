'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  Lock,
  Shield,
  UserCheck,
  Zap,
} from 'lucide-react';

/* ----------------------------------------------------------------
   Elemen Signature: kartu sertifikat + stempel + kartu hasil melayang
   Metafora "sistem merekomendasikan, manusia memutuskan"
----------------------------------------------------------------- */
function SignatureArt() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] select-none" aria-hidden="true">
      {/* Main certificate card */}
      <div className="relative bg-white border border-green-200 rounded-[20px] p-6 sm:p-7 shadow-soft -rotate-[4deg]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-green-700" strokeWidth={3} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-green-200 rounded-full w-3/4" />
            <div className="h-2.5 bg-green-100 rounded-full w-1/2" />
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <div className="h-2.5 bg-green-100 rounded-full w-full" />
          <div className="h-2.5 bg-green-100 rounded-full w-11/12" />
          <div className="h-2.5 bg-green-100 rounded-full w-3/4" />
        </div>

        {/* Stamp */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gold px-3 py-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-700" />
          <span className="text-xs font-bold text-green-800 tracking-wide">
            Sertifikat Terverifikasi
          </span>
        </div>
      </div>

      {/* Floating result card */}
      <div className="absolute -right-2 sm:-right-6 -bottom-10 rotate-[3deg] w-[220px] sm:w-[240px] bg-white border border-green-200 rounded-[14px] p-4 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-green-700" />
          </div>
          <span className="text-xs font-bold text-green-800">
            Rekomendasi Bobot &amp; Hasil
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-soft">Kategori</span>
            <span className="font-semibold text-ink">Workshop</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Durasi</span>
            <span className="font-semibold text-ink">8 Jam</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Bobot</span>
            <span className="font-bold text-green-700">1</span>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1">
          <Check className="w-3 h-3 text-green-700" strokeWidth={3} />
          <span className="text-[11px] font-semibold text-green-800">Disetujui</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Section helpers
----------------------------------------------------------------- */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group bg-white border border-green-200 rounded-[14px] px-5 py-4 open:shadow-soft-sm">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-green-950 text-[17px] min-h-[44px]">
        {question}
        <ChevronDown className="w-5 h-5 text-green-700 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{children}</p>
    </details>
  );
}

/* ----------------------------------------------------------------
   Halaman utama
----------------------------------------------------------------- */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink flex flex-col">
      {/* NAV */}
      <header className="glass sticky top-0 z-50">
        <div className="container-page py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2.5 group">
            <span className="text-2xl font-semibold text-green-950 font-display tracking-tight">
              Certi<span className="text-green-800">AI</span>
            </span>
            <span className="hidden sm:inline text-[11px] font-medium text-ink-soft tracking-wide">
              UIN Sumatera Utara
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost px-5 text-[15px]">
              Masuk
            </Link>
            <Link href="/register" className="btn-primary px-6 text-[15px]">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-bg-soft to-white">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-bg-soft-2 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-bg-soft-2 rounded-full blur-3xl opacity-40 -translate-x-1/3 translate-y-1/4" />
          </div>

          <div className="relative container-page pt-14 pb-24 sm:pt-20 sm:pb-28">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-10 items-center">
              {/* Copy */}
              <div className="order-2 lg:order-1 text-center lg:text-left space-y-7">
                <SectionEyebrow>Sistem Rekomendasi Bobot Sertifikat</SectionEyebrow>

                <h1 className="text-[clamp(34px,4.4vw,52px)] leading-[1.12] text-green-950">
                  Bobot sertifikat direkomendasikan sistem, keputusan tetap di tangan{' '}
                  <span className="text-green-700">dosen</span>.
                </h1>

                <p className="text-lg text-ink-soft max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Unggah sertifikat kegiatan, sistem akan membaca dan merekomendasikan
                  bobotnya. Dosen tinggal meninjau dan menyetujui — lebih ringkas dari
                  proses manual selama ini.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/register" className="btn-primary px-8">
                    Daftar Sekarang — Gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="#cara-kerja" className="btn-ghost px-8">
                    Lihat Cara Kerja
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                  <span className="chip">🗂️ 3 Langkah Sederhana</span>
                  <span className="chip">📄 PDF &amp; Gambar, maks 10MB</span>
                  <span className="chip">✅ Keputusan Akhir oleh Dosen</span>
                </div>
              </div>

              {/* Signature art */}
              <div className="order-1 lg:order-2 pt-4 pb-10 lg:pt-0 lg:pb-0">
                <SignatureArt />
              </div>
            </div>
          </div>
        </section>

        {/* UNTUK SIAPA */}
        <section className="py-20 bg-white">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Untuk Siapa</SectionEyebrow>
              <h2 className="text-[clamp(26px,3vw,34px)] mt-4">
                Dibuat untuk dua peran, satu tujuan
              </h2>
              <p className="mt-3 text-ink-soft">
                Mahasiswa unggah dan pantau. Dosen tinjau dan putuskan. Semua tercatat
                rapi.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Mahasiswa */}
              <div className="card-rounded p-8">
                <div className="w-12 h-12 rounded-[14px] bg-green-100 flex items-center justify-center mb-5">
                  <GraduationCap className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-2xl mb-3">Untuk Mahasiswa</h3>
                <p className="text-ink-soft mb-6">
                  Unggah sertifikat kegiatan dan biarkan sistem membantu memprosesnya.
                  Pantau status dari mana saja.
                </p>
                <ul className="space-y-3">
                  {[
                    'Unggah dari HP atau laptop',
                    'Lihat status langsung tanpa menunggu lama',
                    'Riwayat tersimpan rapi',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px]">
                      <Check className="w-4 h-4 text-green-600 mt-1 shrink-0" strokeWidth={3} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dosen */}
              <div className="card-rounded p-8">
                <div className="w-12 h-12 rounded-[14px] bg-green-100 flex items-center justify-center mb-5">
                  <UserCheck className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-2xl mb-3">Untuk Dosen</h3>
                <p className="text-ink-soft mb-6">
                  Tinjau hasil rekomendasi dengan ringkas. Sesuaikan bila perlu, lalu
                  beri keputusan akhir.
                </p>
                <ul className="space-y-3">
                  {[
                    'Ringkasan siap ditinjau',
                    'Bobot bisa disesuaikan sesuai penilaian',
                    'Tercatat sebagai jejak audit',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px]">
                      <Check className="w-4 h-4 text-green-600 mt-1 shrink-0" strokeWidth={3} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="py-20 bg-bg-soft scroll-mt-20">
          <div className="container-page">
            <div className="card-dark px-6 py-14 sm:px-12 sm:py-16">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-green-100 uppercase tracking-wider">
                  Cara Kerja
                </div>
                <h2 className="text-white text-[clamp(26px,3vw,34px)] mt-4">
                  Tiga langkah sederhana
                </h2>
                <p className="mt-3 text-green-100/80">
                  Sistem membantu mengolah, dosen yang memutuskan.
                </p>
              </div>

              <ol className="grid md:grid-cols-3 gap-10 relative">
                <li className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white font-display text-lg font-semibold shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="text-white text-xl mb-2">Unggah Sertifikat</h3>
                      <p className="text-green-100/80 text-[15px]">
                        Drag &amp; drop, PDF/JPG/PNG maks 10MB.
                      </p>
                    </div>
                  </div>
                </li>

                <li className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white font-display text-lg font-semibold shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="text-white text-xl mb-2">
                        Sistem Membaca &amp; Merekomendasikan
                      </h3>
                      <p className="text-green-100/80 text-[15px]">
                        Mengenali kategori &amp; durasi, lalu merekomendasikan bobot.
                      </p>
                      <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-green-100">
                        Teknologi pembacaan otomatis
                      </span>
                    </div>
                  </div>
                </li>

                <li className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white font-display text-lg font-semibold shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="text-white text-xl mb-2">
                        Dosen Meninjau &amp; Menyetujui
                      </h3>
                      <p className="text-green-100/80 text-[15px]">
                        Dosen memeriksa rekomendasi sistem, menyesuaikan, lalu memberi
                        keputusan akhir.
                      </p>
                      <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-green-100">
                        Keputusan manusia
                      </span>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* KENAPA CertiAI */}
        <section className="py-20 bg-white">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Kenapa CertiAI</SectionEyebrow>
              <h2 className="text-[clamp(26px,3vw,34px)] mt-4">
                Dipercaya karena transparan
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: 'Cepat',
                  desc: 'Rekomendasi keluar dalam hitungan detik.',
                },
                {
                  icon: <Lock className="w-5 h-5" />,
                  title: 'Aman',
                  desc: 'Penyimpanan privat, akses terbatas.',
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: 'Manusia yang Memutuskan',
                  desc: 'Sistem hanya merekomendasikan, dosen yang menentukan.',
                },
                {
                  icon: <History className="w-5 h-5" />,
                  title: 'Tercatat Rapi',
                  desc: 'Jejak audit setiap tinjauan.',
                },
              ].map((item) => (
                <div key={item.title} className="card-hover p-7">
                  <div className="w-11 h-11 rounded-[14px] bg-green-100 flex items-center justify-center text-green-700 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg mb-2">{item.title}</h3>
                  <p className="text-[15px] text-ink-soft leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTOH HASIL REKOMENDASI */}
        <section className="py-20 bg-bg-soft">
          <div className="container-page">
            <div className="card-dark px-6 py-14 sm:px-12 sm:py-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Copy */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-green-100 uppercase tracking-wider">
                    Contoh Hasil
                  </div>
                  <h2 className="text-white text-[clamp(26px,3vw,34px)] mt-4 mb-4">
                    Seperti apa hasil rekomendasinya?
                  </h2>
                  <p className="text-green-100/80 text-[17px] leading-relaxed max-w-md">
                    Setelah sertifikat diunggah, sistem menyusun rekomendasi kategori,
                    durasi, dan bobot dalam satu tampilan ringkas — siap ditinjau dosen.
                  </p>
                </div>

                {/* Result card */}
                <div className="relative">
                  <div className="absolute -inset-4 bg-bg-soft-2 rounded-[28px] opacity-50 blur-2xl" aria-hidden="true" />
                  <div className="relative bg-white border border-green-200 rounded-[20px] p-6 sm:p-7 shadow-soft">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-[12px] bg-green-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-800">
                          Rekomendasi Bobot &amp; Hasil
                        </div>
                        <div className="text-xs text-ink-soft">Sertifikat-Pelatihan-Jurnalistik.pdf</div>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-green-200 pt-5">
                      <div className="flex justify-between text-[15px]">
                        <span className="text-ink-soft">Kategori</span>
                        <span className="font-semibold text-ink">Workshop</span>
                      </div>
                      <div className="flex justify-between text-[15px]">
                        <span className="text-ink-soft">Durasi</span>
                        <span className="font-semibold text-ink">8 Jam</span>
                      </div>
                      <div className="flex justify-between text-[15px]">
                        <span className="text-ink-soft">Rekomendasi Bobot</span>
                        <span className="font-bold text-green-700 text-lg">1</span>
                      </div>
                    </div>

                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-100 border border-green-200 px-3.5 py-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-700" />
                      <span className="text-[13px] font-semibold text-green-800">
                        Disetujui oleh Dosen Pembimbing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="container-page max-w-3xl">
            <div className="text-center mb-12">
              <SectionEyebrow>Pertanyaan Umum</SectionEyebrow>
              <h2 className="text-[clamp(26px,3vw,34px)] mt-4">Masih ada pertanyaan?</h2>
            </div>

            <div className="space-y-4">
              <FaqItem question="Format file apa saja yang didukung?">
                Sertifikat dapat diunggah dalam format PDF, JPG, atau PNG dengan ukuran
                maksimal 10MB per berkas.
              </FaqItem>
              <FaqItem question="Apakah bobot dari sistem langsung final?">
                Tidak. Sistem hanya memberikan rekomendasi. Keputusan akhir selalu diambil
                oleh dosen yang meninjau, termasuk menyesuaikan bobot bila diperlukan.
              </FaqItem>
              <FaqItem question="Di mana data saya disimpan?">
                Berkas dan hasil disimpan di penyimpanan privat dengan akses terbatas hanya
                untuk mahasiswa dan dosen yang berkepentingan.
              </FaqItem>
              <FaqItem question="Apakah CertiAI berbayar?">
                Gratis untuk mahasiswa dan dosen di lingkungan UIN Sumatera Utara.
              </FaqItem>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-20 bg-bg-soft">
          <div className="container-page">
            <div className="card-dark text-center px-6 py-16 sm:px-12">
              <h2 className="text-white text-[clamp(26px,3vw,36px)] max-w-2xl mx-auto">
                Siap mempercepat proses verifikasi sertifikat?
              </h2>
              <p className="mt-4 text-green-100/80 max-w-xl mx-auto">
                Daftar sekarang dan mulai unggah sertifikat pertama Anda. Dosen tinggal
                meninjau dan menyetujui.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-white px-8">
                  Daftar Sekarang — Gratis
                </Link>
                <Link href="/login" className="btn-outline-white px-8">
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-green-200 py-10">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-semibold text-green-950 font-display">
              Certi<span className="text-green-800">AI</span>
            </span>
            <span className="text-xs text-ink-soft">UIN Sumatera Utara</span>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-100 border border-green-200 text-[12px] font-semibold text-green-800">
              Sistem merekomendasikan. Manusia memutuskan.
            </span>
            <p className="text-sm text-ink-soft">
              © 2026 CertiAI — Universitas Islam Negeri Sumatera Utara
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}