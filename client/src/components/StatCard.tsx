import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const accentBorders: Record<string, string> = {
  default: 'border-brand-200',
  success: 'border-success-border',
  warning: 'border-warning-border',
  danger: 'border-danger-border',
};

export default function StatCard({ label, value, icon, accent = 'default' }: StatCardProps) {
  return (
    <div className={`bg-white border ${accentBorders[accent]} rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-widest uppercase font-mono text-brand-400">{label}</span>
        {icon && <span className="text-brand-400">{icon}</span>}
      </div>
      <div className="text-lg font-bold tracking-tight text-brand-900 font-sans">{value}</div>
    </div>
  );
}
