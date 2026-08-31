'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Shield, BookOpen, CheckCircle2, GraduationCap } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, Alert, Input } from '@/components/ui';
import { LecturerSearch } from '@/components/auth/LecturerSearch';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [advisor1, setAdvisor1] = useState<string | null>(null);
  const [advisor2, setAdvisor2] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Email validation
    if (!email.toLowerCase().endsWith('@uinsu.ac.id')) {
      setError('Gunakan email institusi UINSU (contoh@uinsu.ac.id).');
      setLoading(false);
      return;
    }

    if (role === 'student' && !advisor1) {
      setError('Pilih minimal Dosen Pembimbing 1.');
      setLoading(false);
      return;
    }

    try {
      const metadata: Record<string, string> = {
        role,
        full_name: fullName,
      };

      if (role === 'student') {
        metadata.student_number = idNumber;
        metadata.advisor_1_id = advisor1 || '';
        metadata.advisor_2_id = advisor2 || '';
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
        }, 2500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Mulai verifikasi{' '}
          <span className="text-gradient">sertifikat sekarang</span>
        </>
      }
      subtitle={
        role === 'student'
          ? 'Buat akun mahasiswa untuk mengupload sertifikat kegiatan dan memantau status verifikasi.'
          : 'Buat akun dosen untuk mereview dan memverifikasi sertifikat yang telah dianalisis AI.'
      }
    >
      <div className="bg-white rounded-3xl shadow-xl shadow-[rgb(34_72_19)]/10 border border-gray-100 p-8 space-y-6">
        {success ? (
          <div className="text-center py-12 space-y-4 animate-fade-in-scale">
            <div className="w-20 h-20 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-[rgb(34_72_19)]" />
            </div>
            <h3 className="text-2xl font-black text-gray-900">Pendaftaran Berhasil!</h3>
            <p className="text-gray-500 text-sm">
              Akun Anda telah dibuat. Mengarahkan ke halaman login...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900">
                {role === 'student' ? 'Daftar sebagai Mahasiswa' : 'Daftar sebagai Dosen'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Isi data untuk membuat akun baru</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Role Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    role === 'student'
                      ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    Mahasiswa
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('lecturer')}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    role === 'lecturer'
                      ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Dosen
                  </span>
                </button>
              </div>

              <Input
                type="text"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-5 h-5" />}
                required
                autoComplete="name"
              />

              <Input
                type="text"
                label={role === 'student' ? 'Nomor Induk Mahasiswa (NIM)' : 'Nomor Induk Dosen (NIDN)'}
                placeholder={role === 'student' ? 'Contoh: 220010150' : 'Contoh: 0423088902'}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                icon={<Shield className="w-5 h-5" />}
                required
              />

              {role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LecturerSearch
                    label="Dosen Pembimbing 1"
                    placeholder="Cari pembimbing 1..."
                    selectedId={advisor1}
                    onSelect={(l) => setAdvisor1(l ? l.id : null)}
                    required
                  />
                  <LecturerSearch
                    label="Dosen Pembimbing 2 (Opsional)"
                    placeholder="Cari pembimbing 2..."
                    selectedId={advisor2}
                    onSelect={(l) => setAdvisor2(l ? l.id : null)}
                  />
                </div>
              )}

              <Input
                type="email"
                label="Email UINSU"
                placeholder="contoh@uinsu.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                required
                autoComplete="email"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Min. 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
                autoComplete="new-password"
                hint="Gunakan password minimal 6 karakter"
              />

              <Button type="submit" fullWidth loading={loading} size="lg">
                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-[rgb(34_72_19)] font-bold hover:text-[rgb(27_54_15)] transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}