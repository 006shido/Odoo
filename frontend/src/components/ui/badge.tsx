import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-accent text-accent-text',
        secondary:
          'border-transparent bg-surface-secondary text-text-secondary',
        success:
          'border-success/20 bg-success-light text-success',
        warning:
          'border-warning/20 bg-warning-light text-warning',
        error:
          'border-error/20 bg-error-light text-error',
        outline:
          'border-border text-text-secondary bg-surface',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'error' && 'bg-error',
            variant === 'default' && 'bg-white',
            (!variant || variant === 'secondary' || variant === 'outline') && 'bg-text-tertiary',
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
