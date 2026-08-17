import React from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: <Info className="w-5 h-5 flex-shrink-0" />,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    },
  };
  
  const config = variants[variant];
  
  return (
    <div
      className={`${config.bg} ${config.border} ${config.text} border rounded-xl p-4 flex items-start gap-3 ${className}`}
      role="alert"
    >
      {config.icon}
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-bold text-sm mb-1">{title}</h4>
        )}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className={`${config.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
