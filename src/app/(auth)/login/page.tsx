'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, Alert, Input } from '@/components/ui';

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
        // Fetch profile to redirect based on role
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = prof?.role || 'student';
        const dashboardPath = `/dashboard/${role}`;
        router.push(dashboardPath);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email atau password salah.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Masuk untuk verifikasi{' '}
          <span className="text-gradient">sertifikat mahasiswa</span>
        </>
      }
      subtitle="Login sebagai mahasiswa untuk upload, atau sebagai dosen untuk mereview sertifikat yang telah dianalisis AI."
    >
      <div className="bg-white rounded-3xl shadow-xl shadow-[rgb(34_72_19)]/10 border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Masuk ke Akun</h2>
          <p className="text-gray-500 text-sm mt-1">Gunakan kredensial yang sudah didaftarkan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            size="lg"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-gray-600 text-sm">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[rgb(34_72_19)] font-bold hover:text-[rgb(27_54_15)] transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}