import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-all duration-150 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-accent text-accent-text',
        secondary:
          'border-transparent bg-surface-secondary/80 text-text-secondary backdrop-blur-md',
        success:
          'border-success/25 bg-success-light text-success font-semibold shadow-2xs',
        warning:
          'border-warning/25 bg-warning-light text-warning font-semibold shadow-2xs',
        error:
          'border-error/25 bg-error-light text-error font-semibold shadow-2xs',
        outline:
          'border-border text-text-secondary bg-surface/60 backdrop-blur-md',
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
