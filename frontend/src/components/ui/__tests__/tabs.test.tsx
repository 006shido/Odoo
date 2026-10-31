import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  it('renders and switches active tab', async () => {
    render(
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">Monthly billing selected</TabsContent>
        <TabsContent value="yearly">Yearly billing selected</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText('Monthly billing selected')).toBeInTheDocument();
    expect(screen.queryByText('Yearly billing selected')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Yearly' }));

    expect(screen.getByText('Yearly billing selected')).toBeInTheDocument();
  });
});
