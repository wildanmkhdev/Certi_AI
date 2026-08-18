import React from 'react';
import type { CertificateStatus } from '@/types/database';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'uinsu';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-bold border';
  
  const variants = {
    default: 'bg-gray-50 text-gray-600 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    uinsu: 'bg-[rgb(232_245_233)] text-[rgb(34_72_19)] border-[rgb(76_175_80)]/30',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {icon && icon}
      {children}
    </span>
  );
}

export interface StatusBadgeProps {
  status: CertificateStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig: Record<CertificateStatus, { label: string; variant: BadgeProps['variant']; animate?: boolean }> = {
    pending: { label: 'Mengantri', variant: 'default' },
    processing: { label: 'Dianalisis AI', variant: 'info', animate: true },
    ai_completed: { label: 'AI Selesai', variant: 'info' },
    waiting_review: { label: 'Menunggu Dosen', variant: 'warning' },
    approved: { label: 'Disetujui', variant: 'success' },
    rejected: { label: 'Ditolak', variant: 'error' },
    failed: { label: 'Gagal Analisis', variant: 'error' },
  };
  
  const config = statusConfig[status];
  const animateClass = config.animate ? 'animate-pulse' : '';
  
  return (
    <Badge variant={config.variant} size={size} className={animateClass}>
      {config.label}
    </Badge>
  );
}
