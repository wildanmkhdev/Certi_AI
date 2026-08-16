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

      // 2. Fetch audit logs
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

  const statsTotal = allCertificates.length;
  const statsWaiting = allCertificates.filter(c => c.status === 'waiting_review').length;
  const statsActiveRules = weightRules.filter(r => r.is_active).length;
  const statsLogs = auditLogs.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-[#224813] animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Memuat Dashboard Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#224813] to-emerald-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 leading-none">Certi<span className="text-[#224813]">AI</span></span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#224813] border border-emerald-100 uppercase tracking-widest">UINSU</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Dashboard Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Summary */}
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#224813]">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-405 font-bold uppercase">Administrator</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-455 hover:text-red-650 hover:border-red-100 hover:bg-red-50/30 transition-all flex items-center justify-center cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* STATS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Sertifikat</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{statsTotal}</span>
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Aturan Bobot Aktif</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-700">{statsActiveRules}</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Settings className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-700">{statsWaiting}</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Log Aktivitas</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-violet-750">{statsLogs}</span>
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-650">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* WORKLIST */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Aturan Bobot
              </button>
              <button
                onClick={() => setActiveTab('certs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'certs'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Monitoring
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-[#224813] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                Audit Logs
              </button>
            </div>

            <button
              onClick={fetchAllData}
              className="p-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-[#224813] transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </button>
          </div>

          {/* RULES MANAGEMENT */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Add Rule Form */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#224813]" />
                  Tambah Aturan Baru
                </h4>
                
                {ruleError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-shake">
                    {ruleError}
                  </div>
                )}

                <form onSubmit={handleAddRule} className="space-y-4 text-xs font-medium">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 focus:outline-none focus:border-[#224813] font-bold"
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Durasi Min {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-850 focus:outline-none focus:border-[#224813] font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Durasi Max {category === 'Competition' ? '(Level)' : '(Jam)'}
                      </label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-850 focus:outline-none focus:border-[#224813] font-bold"
                      />
                    </div>
                  </div>
                  {category === 'Competition' && (
                    <p className="text-[9px] text-slate-450 italic leading-relaxed font-bold">
                      * Untuk Kompetisi: 1 = Lokal, 2 = Nasional, 3 = Internasional.
                    </p>
                  )}

                  {/* Weight */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rekomendasi Bobot</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      placeholder="Nilai bobot (1-10)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-850 focus:outline-none focus:border-[#224813] font-black text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Deskripsi Aturan</label>
                    <textarea
                      placeholder="Contoh: Kompetisi tingkat nasional mendapat bobot 2."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-white border border-slate-250 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#224813] leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRule}
                    className="w-full py-3 bg-[#224813] hover:bg-[#1a360f] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#224813]/10 flex items-center justify-center gap-1.5 cursor-pointer duration-300"
                  >
                    {submittingRule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Simpan Aturan
                  </button>
                </form>
              </div>

              {/* Rules List */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl overflow-x-auto shadow-sm">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4">Daftar Aturan Pembobotan</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3">Kategori</th>
                      <th className="py-3">Parameter</th>
                      <th className="py-3 text-center">Bobot</th>
                      <th className="py-3">Deskripsi</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {weightRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-bold text-slate-900">{rule.category}</td>
                        <td className="py-3 font-mono text-[10px] text-slate-500">
                          {rule.category === 'Competition' ? (
                            rule.min_duration === 1 ? 'Lokal' : rule.min_duration === 2 ? 'Nasional' : 'Internasional'
                          ) : (
                            `${rule.min_duration || 0} s/d ${rule.max_duration || '∞'} jam`
                          )}
                        </td>
                        <td className="py-3 text-center font-black text-slate-900 text-sm">{rule.weight}</td>
                        <td className="py-3 text-slate-500 max-w-[150px] truncate" title={rule.description || ''}>
                          {rule.description || '-'}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                            className={`p-1 rounded-lg transition-all cursor-pointer ${rule.is_active ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-500'}`}
                          >
                            {rule.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 text-slate-400 hover:text-red-650 rounded-lg transition-all cursor-pointer"
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
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                Belum ada sertifikat diunggah di sistem.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Nama Berkas</th>
                      <th className="py-3 px-2">Kategori AI</th>
                      <th className="py-3 px-2 text-center">Bobot Akhir</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Tanggal Unggah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {allCertificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2 font-mono text-[9px] text-slate-400">{cert.id.substring(0, 8)}...</td>
                        <td className="py-4 px-2">
                          <p className="font-bold text-slate-900 truncate max-w-[200px]">{cert.title || cert.file_name}</p>
                          <span className="text-[9px] text-slate-450 block mt-0.5">{cert.file_name}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-extrabold text-[#224813]">
                            {cert.category || 'Belum Terdeteksi'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center font-black text-slate-900">
                          {cert.status === 'approved' ? cert.final_weight : '-'}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border ${
                            cert.status === 'pending'
                              ? 'bg-slate-50 text-slate-500 border-slate-200'
                              : cert.status === 'processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-150 animate-pulse'
                              : cert.status === 'waiting_review'
                              ? 'bg-amber-50 text-amber-800 border-amber-150'
                              : cert.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                              : 'bg-red-50 text-red-850 border-red-150'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right text-slate-450 text-[10px]">
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
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Waktu</th>
                      <th className="py-3 px-2">Aksi</th>
                      <th className="py-3 px-2">Entitas</th>
                      <th className="py-3 px-2">Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[10px]">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-2 text-slate-450">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                        <td className="py-3.5 px-2 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                            log.action.includes('UPLOAD')
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : log.action.includes('APPROVED')
                              ? 'bg-emerald-50 text-emerald-850 border-emerald-200'
                              : log.action.includes('REJECTED')
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500">{log.entity} ({log.entity_id?.substring(0, 8)})</td>
                        <td className="py-3.5 px-2 max-w-[300px] truncate text-slate-450">
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
