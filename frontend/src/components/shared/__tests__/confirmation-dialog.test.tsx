import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Button } from '@/components/ui/button';

describe('ConfirmationDialog', () => {
  it('opens and triggers onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationDialog
        trigger={<Button>Pause Subscription</Button>}
        title="Pause this subscription?"
        description="The customer will not be billed while paused."
        confirmLabel="Confirm Pause"
        onConfirm={onConfirm}
      />,
    );

    const triggerBtn = screen.getByRole('button', { name: 'Pause Subscription' });
    await userEvent.click(triggerBtn);

    expect(screen.getByText('Pause this subscription?')).toBeInTheDocument();
    expect(screen.getByText('The customer will not be billed while paused.')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirm Pause' });
    await userEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
