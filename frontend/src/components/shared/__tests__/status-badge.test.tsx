import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/components/shared/status-badge';

describe('StatusBadge', () => {
  it('renders active status with success variant', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-success-light');
  });

  it('renders paused status with warning variant', () => {
    render(<StatusBadge status="paused" />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('renders overdue status with error variant', () => {
    render(<StatusBadge status="overdue" />);
    const badge = screen.getByText('Overdue');
    expect(badge.className).toContain('bg-error-light');
  });

  it('renders draft status with secondary variant', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders unknown status gracefully', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('renders all invoice statuses', () => {
    const statuses = ['issued', 'partially_paid', 'paid', 'void'];
    const labels = ['Issued', 'Partially Paid', 'Paid', 'Void'];
    statuses.forEach((status, i) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(labels[i]!)).toBeInTheDocument();
      unmount();
    });
  });
});

