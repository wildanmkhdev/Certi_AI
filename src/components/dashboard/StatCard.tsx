import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  description,
}: StatCardProps) {
  const variants = {
    default: {
      bg: 'bg-white',
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-600',
      valueColor: 'text-gray-900',
    },
    success: {
      bg: 'bg-white',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-white',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    error: {
      bg: 'bg-white',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
    primary: {
      bg: 'bg-gradient-to-br from-[rgb(232_245_233)] to-white',
      iconBg: 'bg-[rgb(34_72_19)]/10',
      iconColor: 'text-[rgb(34_72_19)]',
      valueColor: 'text-[rgb(34_72_19)]',
    },
  };

  const config = variants[variant];

  return (
    <div className={`${config.bg} border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        <div className={`text-3xl font-black ${config.valueColor}`}>
          {value}
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2">
            {trend && (
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
