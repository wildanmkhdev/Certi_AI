import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  hover = false,
  interactive = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'bg-white border border-gray-200 rounded-2xl shadow-sm';
  
  const hoverClasses = hover || interactive
    ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-1'
    : '';
  
  const interactiveClasses = interactive
    ? 'cursor-pointer active:scale-[0.98]'
    : '';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const classes = `${baseClasses} ${hoverClasses} ${interactiveClasses} ${paddingClasses[padding]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between pb-4 border-b border-gray-100 ${className}`} {...props}>
      <div className="flex-1">
        {title && <h3 className="font-bold text-gray-900 text-base">{title}</h3>}
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        {children}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 border-t border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}
