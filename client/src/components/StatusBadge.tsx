import type { VerificationStatus } from '@/types';

const statusConfig: Record<VerificationStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  valid: {
    label: 'Deliverable',
    bg: 'bg-success-soft',
    text: 'text-success-text',
    border: 'border-success-border',
    dot: 'bg-success-solid',
  },
  risky: {
    label: 'Risky',
    bg: 'bg-warning-soft',
    text: 'text-warning-text',
    border: 'border-warning-border',
    dot: 'bg-warning-solid',
  },
  invalid: {
    label: 'Undeliverable',
    bg: 'bg-danger-soft',
    text: 'text-danger-text',
    border: 'border-danger-border',
    dot: 'bg-danger-solid',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-brand-50',
    text: 'text-brand-500',
    border: 'border-brand-200',
    dot: 'bg-brand-400',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-accent-50',
    text: 'text-accent-700',
    border: 'border-accent-100',
    dot: 'bg-accent-500',
  },
};

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
