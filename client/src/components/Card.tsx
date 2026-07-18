import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export default function Card({ children, className = '', dark = false }: CardProps) {
  if (dark) {
    return (
      <div className={`bg-neutral-900 text-white rounded-lg ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-brand-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${className}`}>
      {children}
    </div>
  );
}
