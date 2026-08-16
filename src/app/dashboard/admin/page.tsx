'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User as UserIcon,
  Loader2,
  Trash2,
  Layers,
  Settings,
  Shield,
  FileText,
  UserPlus,
  Plus,
  ToggleLeft,
  ToggleRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Profile, WeightRule, AuditLog, Certificate } from '@/types/database';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(prof);

      // Fetch dashboard data
      await fetchAllData();
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // 1. Fetch weight rules
      const { data: rules } = await supabase
        .from('weight_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('weight', { ascending: true });

      // 2. Fetch audit logs (with user profile email)
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // 3. Fetch all system certificates
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Add weight rule
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

      // Reset form
      setCategory('Workshop');
      setMinDuration('');
      setMaxDuration('');
      setWeight('');
      setDescription('');
      
      await fetchAllData();
    } catch (err: any) {
      setRuleError(err.message || 'Gagal menambahkan aturan bobot.');
    } finally {
      setSubmittingRule(false);
    }
  };

  // Toggle active/inactive rule
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

  // Delete rule
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Memuat Dashboard Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CertiAI</h1>
              <p className="text-xs text-slate-400">Dashboard Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Summary */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-red-400 hover:border-red-950/30 transition-all flex items-center justify-center"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* STATS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sertifikat</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-white">{allCertificates.length}</span>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aturan Bobot Aktif</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-emerald-400">
                {weightRules.filter(r => r.is_active).length}
              </span>
              <Settings className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-500">
                {allCertificates.filter(c => c.status === 'waiting_review').length}
              </span>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Log Aktivitas</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-violet-400">{auditLogs.length}</span>
              <Database className="w-6 h-6 text-violet-500" />
            </div>
          </div>
        </div>

        {/* WORKLIST */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'rules'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Aturan Bobot
              </button>
              <button
                onClick={() => setActiveTab('certs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'certs'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Monitoring Sertifikat
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4" />
                Audit Logs
              </button>
            </div>

            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-slate-400 transition-all flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Segarkan
            </button>
          </div>

          {/* RULES MANAGEMENT */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Add Rule Form */}
              <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Tambah Aturan Baru
                </h4>
                
                {ruleError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl">
                    {ruleError}
                  </div>
                )}

                <form onSubmit={handleAddRule} className="space-y-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Competition">Competition (Kompetisi)</option>
                      <option value="Certification">Certification (Sertifikasi)</option>
                      <option value="Training">Training (Pelatihan)</option>
                    </select>
                  </div>

                  {/* Min / Max Durations */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider block">
                        Durasi Min {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider block">
                        Durasi Max {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {category === 'Competition' && (
                    <p className="text-[9px] text-slate-500 italic leading-relaxed">
                      * Untuk Kompetisi: 1 = Lokal, 2 = Nasional, 3 = Internasional.
                    </p>
                  )}

                  {/* Weight */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Rekomendasi Bobot</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      placeholder="Nilai bobot (1-10)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-extrabold"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Deskripsi Aturan</label>
                    <textarea
                      placeholder="Contoh: Kompetisi tingkat nasional mendapat bobot 2."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRule}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    {submittingRule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Simpan Aturan
                  </button>
                </form>
              </div>

              {/* Rules List */}
              <div className="lg:col-span-2 bg-slate-950/20 border border-slate-850 p-6 rounded-2xl overflow-x-auto">
                <h4 className="font-bold text-white text-sm mb-4">Daftar Aturan Pembobotan Sistem</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5">Kategori</th>
                      <th className="py-2.5">Parameter</th>
                      <th className="py-2.5 text-center">Bobot</th>
                      <th className="py-2.5">Deskripsi</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {weightRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-900/10 transition-all">
                        <td className="py-3 font-bold text-white">{rule.category}</td>
                        <td className="py-3 font-mono text-[10px]">
                          {rule.category === 'Competition' ? (
                            rule.min_duration === 1 ? 'Lokal' : rule.min_duration === 2 ? 'Nasional' : 'Internasional'
                          ) : (
                            `${rule.min_duration || 0} s/d ${rule.max_duration || '∞'} jam`
                          )}
                        </td>
                        <td className="py-3 text-center font-black text-white text-sm">{rule.weight}</td>
                        <td className="py-3 text-slate-400 max-w-[150px] truncate" title={rule.description || ''}>
                          {rule.description || '-'}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                            className={`p-1.5 rounded-lg transition-all ${rule.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-650 hover:text-slate-500'}`}
                          >
                            {rule.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1.5 hover:bg-red-950/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
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
              <div className="text-center py-20 text-slate-500 text-xs">
                Belum ada sertifikat diunggah di sistem.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">ID Sertifikat</th>
                      <th className="py-3 px-2">Nama Berkas</th>
                      <th className="py-3 px-2">Kategori AI</th>
                      <th className="py-3 px-2 text-center">Bobot Akhir</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Tanggal Unggah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {allCertificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-900/10 transition-all">
                        <td className="py-3.5 px-2 font-mono text-[10px] text-slate-500">{cert.id.substring(0, 8)}...</td>
                        <td className="py-3.5 px-2">
                          <p className="font-bold text-white text-xs truncate max-w-[200px]">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-slate-500">{cert.file_name}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-bold text-blue-400">
                            {cert.category || 'Belum Terdeteksi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center font-bold text-white">
                          {cert.status === 'approved' ? cert.final_weight : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                            cert.status === 'pending'
                              ? 'bg-slate-850 text-slate-400 border border-slate-800'
                              : cert.status === 'processing'
                              ? 'bg-blue-950/50 text-blue-400 border border-blue-900/50'
                              : cert.status === 'waiting_review'
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-900/50'
                              : cert.status === 'approved'
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                              : 'bg-red-950/50 text-red-400 border border-red-900/50'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-500">
                          {new Date(cert.created_at).toLocaleString()}
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
              <div className="text-center py-20 text-slate-500 text-xs">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Waktu</th>
                      <th className="py-3 px-2">Aksi</th>
                      <th className="py-3 px-2">Entitas</th>
                      <th className="py-3 px-2">Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/10 transition-all font-mono text-[11px]">
                        <td className="py-3.5 px-2 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-3.5 px-2 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            log.action.includes('UPLOAD')
                              ? 'bg-blue-950 text-blue-400 border border-blue-900'
                              : log.action.includes('APPROVED')
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                              : log.action.includes('REJECTED')
                              ? 'bg-red-950 text-red-400 border border-red-900'
                              : 'bg-slate-850 text-slate-400 border border-slate-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-400">{log.entity} ({log.entity_id?.substring(0, 8)})</td>
                        <td className="py-3.5 px-2 max-w-[300px] truncate text-slate-500">
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
