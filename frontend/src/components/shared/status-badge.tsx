import { Badge } from '@/components/ui/badge';
import type {
  SubscriptionStatus,
  QuotationStatus,
  InvoiceStatus,
} from '@/types';

type StatusValue = SubscriptionStatus | QuotationStatus | InvoiceStatus | string;

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  // Subscription statuses
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  draft: { variant: 'secondary', label: 'Draft' },
  expired: { variant: 'error', label: 'Expired' },
  closed: { variant: 'outline', label: 'Closed' },

  // Quotation statuses
  sent: { variant: 'default', label: 'Sent' },
  accepted: { variant: 'success', label: 'Accepted' },
  rejected: { variant: 'error', label: 'Rejected' },
  converted: { variant: 'success', label: 'Converted' },

  // Invoice statuses
  issued: { variant: 'default', label: 'Issued' },
  partially_paid: { variant: 'warning', label: 'Partially Paid' },
  paid: { variant: 'success', label: 'Paid' },
  void: { variant: 'outline', label: 'Void' },
  overdue: { variant: 'error', label: 'Overdue' },
};

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { variant: 'outline' as const, label: status };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
