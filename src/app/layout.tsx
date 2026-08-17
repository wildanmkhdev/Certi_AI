import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CertiAI - AI Certificate Review System UINSU",
  description: "Sistem verifikasi sertifikat mahasiswa berbasis AI untuk UIN Sumatera Utara Medan. Upload, analisis AI, dan verifikasi dosen dalam satu platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
