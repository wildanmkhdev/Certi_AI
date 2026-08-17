'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, Bell, LogOut, User, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Notification, Profile } from '@/types/database';

export interface DashboardHeaderProps {
  profile: Profile | null;
  title: string;
  roleLabel: string;
  showNotifications?: boolean;
}

export function DashboardHeader({
  profile,
  title,
  roleLabel,
  showNotifications = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  }, [profile, supabase]);

  useEffect(() => {
    if (showNotifications && profile) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [showNotifications, profile, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(34_72_19)] to-[rgb(76_175_80)] flex items-center justify-center shadow-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-gray-900 leading-none">
                  Certi<span className="text-[rgb(34_72_19)]">AI</span>
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgb(232_245_233)] text-[rgb(34_72_19)] border border-[rgb(76_175_80)]/30 uppercase tracking-widest">
                  UINSU
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                {roleLabel}
              </p>
            </div>
          </Link>
          <span className="hidden lg:block text-sm font-bold text-gray-900">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          {showNotifications && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                aria-label="Notifikasi"
                aria-expanded={showNotif}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[rgb(34_72_19)] hover:border-gray-300 transition-all relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unread}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl z-50 animate-fade-in-scale">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                    <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Notifikasi</h3>
                    {unread > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-[rgb(34_72_19)] hover:text-[rgb(27_54_15)] font-bold inline-flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">Tidak ada notifikasi.</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.is_read && markRead(notif.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            notif.is_read
                              ? 'bg-gray-50/50 border-gray-100 text-gray-500'
                              : 'bg-[rgb(232_245_233)]/30 border-[rgb(76_175_80)]/20 text-gray-800 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-gray-900">{notif.title}</span>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(34_72_19)] flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-gray-500 mt-1 text-[11px] leading-relaxed">{notif.message}</p>
                          <span className="text-[9px] text-gray-400 block mt-2 font-medium">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-[rgb(232_245_233)] flex items-center justify-center text-[rgb(34_72_19)]">
              <User className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.full_name}</p>
              <p className="text-[10px] text-gray-400 font-bold">
                {profile?.student_number || profile?.lecturer_number || profile?.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center justify-center cursor-pointer"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}