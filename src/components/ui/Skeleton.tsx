import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-shimmer bg-gray-100 rounded ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['70%', '90%', '60%', '80%', '50%'];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <SkeletonText lines={3} />
    </div>
  );
}
