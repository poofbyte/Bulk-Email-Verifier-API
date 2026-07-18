import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-800 border border-transparent',
  secondary: 'bg-white text-brand-700 hover:bg-neutral-100 border border-brand-200',
  danger: 'bg-danger-solid text-white hover:bg-red-700 border border-transparent',
  ghost: 'bg-transparent text-brand-600 hover:bg-neutral-100 border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-xs',
  lg: 'px-5 py-2.5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export default function Button({ variant = 'primary', size = 'sm', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
