import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const hasError = !!error;
    
    const inputClasses = `
      w-full px-4 py-2.5 bg-white border rounded-xl text-gray-900 placeholder-gray-400 
      transition-all duration-200 
      focus:outline-none focus:ring-2 
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-gray-200 focus:border-[rgb(34_72_19)] focus:ring-[rgb(34_72_19)]/20'
      }
      ${icon ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : ''}
      ${className}
    `;
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    const hasError = !!error;
    
    const textareaClasses = `
      w-full px-4 py-2.5 bg-white border rounded-xl text-gray-900 placeholder-gray-400 
      transition-all duration-200 
      focus:outline-none focus:ring-2 resize-none
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-gray-200 focus:border-[rgb(34_72_19)] focus:ring-[rgb(34_72_19)]/20'
      }
      ${className}
    `;
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={textareaClasses}
          {...props}
        />
        
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
