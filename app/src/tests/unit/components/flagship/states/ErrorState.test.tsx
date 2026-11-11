import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ErrorState } from '@/components/flagship/states';
import { Button } from '@/components/ui';

describe('ErrorState', () => {
  test('given a failure then it is announced as an alert, with its title as a heading', () => {
    render(<ErrorState title="Could not load the report" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the report');
    expect(screen.getByRole('heading', { name: 'Could not load the report' })).toBeInTheDocument();
  });

  test('given no retry then no try again button shows', () => {
    render(<ErrorState title="Report not found" actions={<Button>Back to Build</Button>} />);

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Build' })).toBeInTheDocument();
  });

  test('given try again is clicked then the retry runs', async () => {
    // Given
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState title="Could not load the bill feed" onRetry={onRetry} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('given a retry still in flight then the button waits for it, then comes back', async () => {
    // Given
    const user = userEvent.setup();
    let settle: () => void = () => {};
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
    );
    render(<ErrorState title="Could not load your reforms" onRetry={onRetry} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('button', { name: 'Trying again…' })).toBeDisabled();

    // And when the retry settles, the button is back
    settle();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  test('given a failed retry then the button comes back for another try', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn().mockRejectedValue(new Error('still down'));
    render(<ErrorState title="Could not load the bill feed" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  test('given the compact form then the message and retry show without a heading', () => {
    render(
      <ErrorState
        compact
        title="The budget window could not be calculated"
        description="The 2031 simulation failed."
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The budget window could not be calculated'
    );
    expect(screen.getByText('The 2031 simulation failed.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
