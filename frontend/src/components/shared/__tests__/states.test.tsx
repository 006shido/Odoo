import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import userEvent from '@testing-library/user-event';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Add your first item to get started." />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add your first item to get started.')).toBeInTheDocument();
  });

  it('renders action button', async () => {
    const onClick = vi.fn();
    render(<EmptyState title="No items" action={{ label: 'Add Item', onClick }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom error message', () => {
    render(<ErrorState title="Not Found" message="The page does not exist." />);
    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(screen.getByText('The page does not exist.')).toBeInTheDocument();
  });

  it('renders retry button', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
