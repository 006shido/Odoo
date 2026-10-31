import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles typing', async () => {
    render(<Textarea placeholder="Notes" />);
    const textarea = screen.getByPlaceholderText('Notes');
    await userEvent.type(textarea, 'Special subscription terms');
    expect(textarea).toHaveValue('Special subscription terms');
  });

  it('supports disabled state', () => {
    render(<Textarea disabled placeholder="Disabled notes" />);
    expect(screen.getByPlaceholderText('Disabled notes')).toBeDisabled();
  });
});
