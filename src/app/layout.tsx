import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CertiAI - Sistem Rekomendasi Bobot Sertifikat | UIN Sumatera Utara",
  description:
    "Unggah sertifikat kegiatan, sistem membaca dan merekomendasikan bobotnya. Dosen meninjau dan menyetujui — keputusan akhir tetap di tangan dosen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
