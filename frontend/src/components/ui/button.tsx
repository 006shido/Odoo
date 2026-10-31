import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-text shadow-xs hover:bg-accent-hover hover:shadow-sm active:bg-accent',
        secondary:
          'bg-surface-secondary text-text-primary border border-border/40 shadow-xs hover:bg-surface-tertiary',
        outline:
          'border border-border/80 bg-surface/80 backdrop-blur-sm text-text-primary shadow-xs hover:bg-surface-secondary hover:border-border',
        ghost:
          'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
        destructive:
          'bg-error text-white shadow-xs hover:bg-error/90 hover:shadow-sm',
        link:
          'text-accent underline-offset-4 hover:underline active:scale-100',
        glass:
          'apple-glass text-text-primary hover:bg-surface/90 shadow-xs',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 rounded-xl px-5 text-sm font-medium',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
