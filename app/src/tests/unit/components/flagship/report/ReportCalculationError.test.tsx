import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportCalculationError from '@/components/flagship/report/ReportCalculationError';

const SERVER_FAILURE =
  'Society-wide calculation failed (502): {"status": "error", "message": "Simulation failed (correlation_id=abc123)", "result": null}';

describe('ReportCalculationError', () => {
  test('given a server failure then it reads plainly, with the reference to hand on', () => {
    render(<ReportCalculationError message={SERVER_FAILURE} />);

    expect(
      screen.getByRole('heading', { name: 'The simulation did not finish' })
    ).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Build' })).toBeInTheDocument();
  });

  test('given the reform can come back then editing restores it first', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ReportCalculationError message={SERVER_FAILURE} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Edit the reform' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
