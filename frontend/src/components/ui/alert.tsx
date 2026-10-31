import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-5 [&>svg]:w-5',
  {
    variants: {
      variant: {
        default: 'bg-surface text-text-primary border-border',
        success: 'bg-success-light text-success border-success/20 [&>svg]:text-success',
        warning: 'bg-warning-light text-warning border-warning/20 [&>svg]:text-warning',
        error: 'bg-error-light text-error border-error/20 [&>svg]:text-error',
        info: 'bg-info-light text-info border-info/20 [&>svg]:text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const iconMap = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
    const IconComponent = iconMap[variant ?? 'default'];
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {showIcon && <IconComponent />}
        {children}
      </div>
    );
  },
);
Alert.displayName = 'Alert';

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };

