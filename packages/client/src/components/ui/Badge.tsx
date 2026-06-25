import { HTMLAttributes } from 'react';

type BadgeVariant = 'accent' | 'blue' | 'success' | 'danger' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'bg-accent-dim text-accent border border-accent/30',
  blue: 'bg-blue-dim text-blue border border-blue/30',
  success: 'bg-success-dim text-success border border-success/30',
  danger: 'bg-danger-dim text-danger border border-danger/30',
  default: 'bg-dark-elevated text-gray-400 border border-dark-border',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
