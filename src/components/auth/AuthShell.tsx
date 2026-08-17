'use client';

import React from 'react';
import Link from 'next/link';
import { Award, Shield, BookOpen, Sparkles, Zap } from 'lucide-react';

export interface AuthShellProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900">
            Certi<span className="text-[rgb(34_72_19)]">AI</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Visual */}
          <div className="hidden lg:block space-y-6 animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[rgb(76_175_80)]/20 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-[rgb(34_72_19)]" />
              <span className="text-xs font-bold text-[rgb(34_72_19)]">
                Sistem Verifikasi Sertifikat UINSU
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-gray-900 leading-tight">
              {title}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">{subtitle}</p>

            {/* Feature highlights */}
            <div className="pt-8 space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[rgb(232_245_233)] flex items-center justify-center flex-shrink-0 text-[rgb(34_72_19)]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Analisis AI dalam Detik</p>
                  <p className="text-sm text-gray-500">Ekstraksi & rekomendasi bobot otomatis</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[rgb(232_245_233)] flex items-center justify-center flex-shrink-0 text-[rgb(34_72_19)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Data Aman</p>
                  <p className="text-sm text-gray-500">File tersimpan di storage privat UINSU</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[rgb(232_245_233)] flex items-center justify-center flex-shrink-0 text-[rgb(34_72_19)]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Dosen sebagai Final Decision</p>
                  <p className="text-sm text-gray-500">Keputusan akhir tetap pada verifikator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="animate-slide-in-right">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}