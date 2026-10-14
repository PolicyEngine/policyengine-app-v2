import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { EmptyState } from '@/components/flagship/states';
import { Button } from '@/components/ui';

describe('EmptyState', () => {
  test('given a title and an action then both show, the action usable', async () => {
    // Given
    const user = userEvent.setup();
    const onBuild = vi.fn();
    render(
      <EmptyState
        title="No saved reforms yet."
        action={<Button onClick={onBuild}>Build a reform</Button>}
      />
    );

    // When
    await user.click(screen.getByRole('button', { name: 'Build a reform' }));

    // Then
    expect(screen.getByText('No saved reforms yet.')).toBeInTheDocument();
    expect(onBuild).toHaveBeenCalledTimes(1);
  });

  test('given a description then it reads under the title', () => {
    render(<EmptyState title="No bills match." description="Try another place." />);

    expect(screen.getByText('Try another place.')).toBeInTheDocument();
  });

  test('given no action then it is a message alone, not an alert', () => {
    render(<EmptyState title="No analyzed bills yet." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
