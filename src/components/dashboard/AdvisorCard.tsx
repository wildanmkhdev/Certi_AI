'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Shield, User, Edit2, CheckCircle2, AlertCircle, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { LecturerSearch } from '@/components/auth/LecturerSearch';

interface LecturerProfile {
  id: string;
  full_name: string;
  lecturer_number: string;
}

interface AdvisorCardProps {
  onSelectionChange: (selectedIds: string[]) => void;
}

export function AdvisorCard({ onSelectionChange }: AdvisorCardProps) {
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(true);
  const [advisors, setAdvisors] = useState<Record<number, LecturerProfile | null>>({
    1: null,
    2: null,
  });

  // Edit states
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [tempLecturer, setTempLecturer] = useState<LecturerProfile | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected target lecturers for next upload
  const [targets, setTargets] = useState<Record<number, boolean>>({
    1: true, // Advisor 1 checked by default
    2: false,
  });

  const fetchAdvisors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchErr } = await supabase
        .from('student_advisors')
        .select('slot, lecturer:profiles!lecturer_id(id, full_name, lecturer_number)');

      if (fetchErr) throw fetchErr;

      const mapped: Record<number, LecturerProfile | null> = { 1: null, 2: null };
      if (data) {
        data.forEach((row: any) => {
          mapped[row.slot] = row.lecturer;
        });
      }
      setAdvisors(mapped);
    } catch (err) {
      console.error('Error fetching advisors:', err);
      setError('Gagal memuat dosen pembimbing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  // Update parent when targets or advisors change
  useEffect(() => {
    const selectedIds: string[] = [];
    if (targets[1] && advisors[1]) selectedIds.push(advisors[1].id);
    if (targets[2] && advisors[2]) selectedIds.push(advisors[2].id);
    onSelectionChange(selectedIds);
  }, [targets, advisors]);

  const handleStartEdit = (slot: number) => {
    setEditingSlot(slot);
    setTempLecturer(advisors[slot]);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
    setTempLecturer(null);
    setError(null);
  };

  const handleSaveAdvisor = async (slot: number) => {
    setUpdating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session tidak ditemukan');

      if (slot === 1 && !tempLecturer) {
        throw new Error('Dosen Pembimbing 1 wajib diisi.');
      }

      // Check duplicates
      const otherSlot = slot === 1 ? 2 : 1;
      const otherAdvisor = advisors[otherSlot];
      if (tempLecturer && otherAdvisor && tempLecturer.id === otherAdvisor.id) {
        throw new Error('Pembimbing 1 dan Pembimbing 2 tidak boleh dosen yang sama.');
      }

      if (!tempLecturer) {
        // Delete advisor if cleared
        const { error: deleteErr } = await supabase
          .from('student_advisors')
          .delete()
          .eq('student_id', user.id)
          .eq('slot', slot);

        if (deleteErr) throw deleteErr;
      } else {
        // Upsert advisor
        const { error: upsertErr } = await supabase
          .from('student_advisors')
          .upsert({
            student_id: user.id,
            lecturer_id: tempLecturer.id,
            slot: slot,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,slot' });

        if (upsertErr) throw upsertErr;
      }

      // Refresh list
      await fetchAdvisors();
      setEditingSlot(null);
      setTempLecturer(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan dosen pembimbing.';
      setError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleTargetChange = (slot: number) => {
    if (slot === 1 && !targets[2] && !advisors[2]) {
      // Cannot uncheck if no advisor 2
      return;
    }
    setTargets(prev => {
      const next = { ...prev, [slot]: !prev[slot] };
      // Guarantee at least one is selected if both advisors exist
      if (!next[1] && !next[2]) {
        next[slot] = true;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-gray-150 rounded-2xl" />
          <div className="h-20 bg-gray-150 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shadow-[rgb(34_72_19)]/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[rgb(34_72_19)]" />
            Dosen Pembimbing Akademik
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar dosen pembimbing Anda. Centang dosen tujuan untuk pengajuan review sertifikat berikutnya.
          </p>
        </div>
        {!advisors[1] && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Lengkapi Pembimbing
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-red-100 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="flex-1 font-semibold">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advisor Slot 1 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          editingSlot === 1 
            ? 'border-[rgb(34_72_19)] bg-[rgb(241_246_249)]/30' 
            : 'border-gray-100 bg-gray-50/50'
        }`}>
          {editingSlot === 1 ? (
            <div className="space-y-4">
              <LecturerSearch
                label="Dosen Pembimbing 1 (Wajib)"
                selectedId={tempLecturer ? tempLecturer.id : null}
                onSelect={(l) => setTempLecturer(l as LecturerProfile | null)}
                required
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={updating}>
                  Batal
                </Button>
                <Button size="sm" onClick={() => handleSaveAdvisor(1)} loading={updating} className="gap-1.5">
                  <Save className="w-4 h-4" /> Simpan
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={targets[1]}
                  disabled={!advisors[1]}
                  onChange={() => handleTargetChange(1)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-[rgb(34_72_19)] focus:ring-[rgb(34_72_19)]/20 cursor-pointer"
                />
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(34_72_19)] block">
                      Pembimbing 1
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">
                      {advisors[1] ? advisors[1].full_name : 'Belum Ditentukan'}
                    </h4>
                    {advisors[1] && (
                      <p className="text-xs text-gray-500">NIDN: {advisors[1].lecturer_number}</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartEdit(1)}
                className="p-1.5 hover:bg-gray-200/50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Advisor Slot 2 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          editingSlot === 2 
            ? 'border-[rgb(34_72_19)] bg-[rgb(241_246_249)]/30' 
            : 'border-gray-100 bg-gray-50/50'
        }`}>
          {editingSlot === 2 ? (
            <div className="space-y-4">
              <LecturerSearch
                label="Dosen Pembimbing 2 (Opsional)"
                selectedId={tempLecturer ? tempLecturer.id : null}
                onSelect={(l) => setTempLecturer(l as LecturerProfile | null)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={updating}>
                  Batal
                </Button>
                <Button size="sm" onClick={() => handleSaveAdvisor(2)} loading={updating} className="gap-1.5">
                  <Save className="w-4 h-4" /> Simpan
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={targets[2]}
                  disabled={!advisors[2]}
                  onChange={() => handleTargetChange(2)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-[rgb(34_72_19)] focus:ring-[rgb(34_72_19)]/20 cursor-pointer"
                />
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(34_72_19)] block">
                      Pembimbing 2
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">
                      {advisors[2] ? advisors[2].full_name : 'Belum Ditentukan'}
                    </h4>
                    {advisors[2] && (
                      <p className="text-xs text-gray-500">NIDN: {advisors[2].lecturer_number}</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartEdit(2)}
                className="p-1.5 hover:bg-gray-200/50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {advisors[1] && (
        <div className="bg-[rgb(241_246_249)]/50 p-4 rounded-2xl flex items-start gap-2.5 border border-[rgb(34_72_19)]/10">
          <CheckCircle2 className="w-5 h-5 text-[rgb(34_72_19)] shrink-0 mt-0.5" />
          <div className="text-xs text-[rgb(34_72_19)] leading-relaxed font-semibold">
            Sertifikat yang di-upload berikutnya akan dikirim ke:{' '}
            <strong className="underline">
              {[
                targets[1] && advisors[1]?.full_name,
                targets[2] && advisors[2]?.full_name,
              ]
                .filter(Boolean)
                .join(' & ')}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
