'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Clock,
  Trash2,
  Settings,
  FileText,
  Plus,
  ToggleLeft,
  ToggleRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Profile, WeightRule, AuditLog, Certificate } from '@/types/database';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button, Input, Badge, Alert, Skeleton } from '@/components/ui';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightRules, setWeightRules] = useState<WeightRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'certs'>('rules');

  // New Rule Form states
  const [category, setCategory] = useState('Workshop');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [submittingRule, setSubmittingRule] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const { data: rules } = await supabase
        .from('weight_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('weight', { ascending: true });

      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: certs } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (rules) setWeightRules(rules);
      if (logs) setAuditLogs(logs);
      if (certs) setAllCertificates(certs);
    } catch (err) {
      console.error('Error fetching admin queues:', err);
    }
  }, [supabase]);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(prof);
      await fetchAllData();
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, fetchAllData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRule(true);
    setRuleError(null);

    try {
      const { error } = await supabase
        .from('weight_rules')
        .insert({
          category,
          min_duration: minDuration ? Number(minDuration) : null,
          max_duration: maxDuration ? Number(maxDuration) : null,
          weight: Number(weight),
          description,
          is_active: true,
        });

      if (error) throw error;

      setCategory('Workshop');
      setMinDuration('');
      setMaxDuration('');
      setWeight('');
      setDescription('');

      await fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan aturan bobot.';
      setRuleError(message);
    } finally {
      setSubmittingRule(false);
    }
  };

  const toggleRuleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('weight_rules')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error('Error toggling rule status:', err);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aturan bobot ini?')) return;
    try {
      const { error } = await supabase
        .from('weight_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const statsTotal = allCertificates.length;
  const statsWaiting = allCertificates.filter(c => c.status === 'waiting_review').length;
  const statsActiveRules = weightRules.filter(r => r.is_active).length;
  const statsLogs = auditLogs.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 animate-shimmer" />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <DashboardHeader profile={profile} title="Dashboard" roleLabel="Dashboard Administrator" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Sertifikat" value={statsTotal} icon={FileText} />
          <StatCard title="Aturan Bobot Aktif" value={statsActiveRules} icon={Settings} variant="success" />
          <StatCard title="Menunggu Review" value={statsWaiting} icon={Clock} variant="warning" />
          <StatCard title="Log Aktivitas" value={statsLogs} icon={Database} variant="primary" />
        </div>

        {/* Worklist */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-3">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200 self-start">
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Aturan Bobot
              </button>
              <button
                onClick={() => setActiveTab('certs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'certs'
                    ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Monitoring
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-[rgb(34_72_19)] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Database className="w-4 h-4" />
                Audit Logs
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchAllData}
              className="self-start sm:self-auto"
            >
              Segarkan
            </Button>
          </div>

          {/* RULES MANAGEMENT */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl space-y-4">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[rgb(34_72_19)]" />
                  Tambah Aturan Baru
                </h4>

                {ruleError && (
                  <Alert variant="error" onClose={() => setRuleError(null)}>
                    {ruleError}
                  </Alert>
                )}

                <form onSubmit={handleAddRule} className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input"
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Competition">Competition (Kompetisi)</option>
                      <option value="Certification">Certification (Sertifikasi)</option>
                      <option value="Training">Training (Pelatihan)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        Durasi Min {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        Durasi Max {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(e.target.value)}
                      />
                    </div>
                  </div>
                  {category === 'Competition' && (
                    <p className="text-xs text-gray-500 italic font-medium">
                      * Untuk Kompetisi: 1 = Lokal, 2 = Nasional, 3 = Internasional.
                    </p>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Rekomendasi Bobot</label>
                    <Input
                      type="number"
                      required
                      min="1"
                      max="10"
                      placeholder="Nilai bobot (1-10)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Deskripsi Aturan</label>
                    <textarea
                      placeholder="Contoh: Kompetisi tingkat nasional mendapat bobot 2."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="input resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    loading={submittingRule}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Simpan Aturan
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-2xl overflow-x-auto shadow-sm">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-4">Daftar Aturan Pembobotan</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3">Kategori</th>
                      <th className="py-3">Parameter</th>
                      <th className="py-3 text-center">Bobot</th>
                      <th className="py-3 hidden md:table-cell">Deskripsi</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {weightRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 font-bold text-gray-900">
                          <Badge variant="uinsu">{rule.category}</Badge>
                        </td>
                        <td className="py-3 font-mono text-[10px] text-gray-500">
                          {rule.category === 'Competition' ? (
                            rule.min_duration === 1 ? 'Lokal' : rule.min_duration === 2 ? 'Nasional' : 'Internasional'
                          ) : (
                            `${rule.min_duration || 0} s/d ${rule.max_duration || '∞'} jam`
                          )}
                        </td>
                        <td className="py-3 text-center font-black text-gray-900 text-sm">{rule.weight}</td>
                        <td className="py-3 text-gray-500 max-w-[150px] truncate hidden md:table-cell" title={rule.description || ''}>
                          {rule.description || '-'}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                            className={`p-1 rounded-lg transition-all cursor-pointer ${rule.is_active ? 'text-green-700 hover:text-green-800' : 'text-gray-400 hover:text-gray-500'}`}
                            title={rule.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {rule.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            title="Hapus Aturan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYSTEM CERTIFICATES VIEW */}
          {activeTab === 'certs' && (
            allCertificates.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm font-semibold">
                Belum ada sertifikat diunggah di sistem.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Nama Berkas</th>
                      <th className="py-3 px-2">Kategori AI</th>
                      <th className="py-3 px-2 text-center">Bobot Akhir</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Tanggal Unggah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {allCertificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2 font-mono text-[9px] text-gray-400">{cert.id.substring(0, 8)}...</td>
                        <td className="py-4 px-2">
                          <p className="font-bold text-gray-900 truncate max-w-[200px]">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-gray-400 block mt-0.5">{cert.file_name}</span>
                        </td>
                        <td className="py-4 px-2">
                          {cert.category ? (
                            <Badge variant="uinsu" size="sm">{cert.category}</Badge>
                          ) : (
                            <span className="text-gray-400">Belum Terdeteksi</span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center font-black text-gray-900">
                          {cert.status === 'approved' ? cert.final_weight : '-'}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <Badge variant={
                            cert.status === 'approved' ? 'success'
                            : cert.status === 'rejected' ? 'error'
                            : cert.status === 'waiting_review' ? 'warning'
                            : cert.status === 'processing' ? 'info'
                            : 'default'
                          } size="sm">
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-2 text-right text-gray-400 text-[10px]">
                          {new Date(cert.created_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'logs' && (
            auditLogs.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm font-semibold">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Waktu</th>
                      <th className="py-3 px-2">Aksi</th>
                      <th className="py-3 px-2">Entitas</th>
                      <th className="py-3 px-2 hidden md:table-cell">Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-mono text-[10px]">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-2 text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                        <td className="py-3.5 px-2 font-bold">
                          <Badge variant={
                            log.action.includes('UPLOAD') ? 'info'
                            : log.action.includes('APPROVED') ? 'success'
                            : log.action.includes('REJECTED') ? 'error'
                            : 'default'
                          } size="sm">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-2 text-gray-500">{log.entity} ({log.entity_id?.substring(0, 8)})</td>
                        <td className="py-3.5 px-2 max-w-[300px] truncate text-gray-400 hidden md:table-cell">
                          {log.new_data ? JSON.stringify(log.new_data) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}