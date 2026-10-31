import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-success-light');
  });

  it('renders warning variant', () => {
    render(<Badge variant="warning">Pending</Badge>);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('bg-warning-light');
  });

  it('renders error variant', () => {
    render(<Badge variant="error">Overdue</Badge>);
    const badge = screen.getByText('Overdue');
    expect(badge.className).toContain('bg-error-light');
  });

  it('renders outline variant', () => {
    render(<Badge variant="outline">Closed</Badge>);
    const badge = screen.getByText('Closed');
    expect(badge.className).toContain('border-border');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('custom-class');
  });
});
