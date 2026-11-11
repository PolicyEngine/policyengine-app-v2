import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportDetailsError from '@/components/flagship/report/ReportDetailsError';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';

const DAMAGED = new ReportSchemaError('invalid-field', 'provisions must be an array', 'provisions');
const NEWER = new ReportSchemaError(
  'newer-version',
  'Saved with report schema 3; this version reads up to 2',
  'schemaVersion'
);

describe('ReportDetailsError', () => {
  test('given damaged details then it says so, with the reason kept for debugging', () => {
    render(<ReportDetailsError error={DAMAGED} onOpenWithout={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: "Could not read this report's saved details" })
    ).toBeInTheDocument();
    expect(screen.getByText('They are damaged in this browser.')).toBeInTheDocument();
    expect(screen.getByText('provisions must be an array')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
  });

  test('given details a newer version saved then reloading is offered', () => {
    render(<ReportDetailsError error={NEWER} onOpenWithout={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('given the user opens without the details then the callback runs', async () => {
    const user = userEvent.setup();
    const onOpenWithout = vi.fn();
    render(<ReportDetailsError error={DAMAGED} onOpenWithout={onOpenWithout} />);

    await user.click(screen.getByRole('button', { name: 'Open without saved details' }));

    expect(onOpenWithout).toHaveBeenCalledTimes(1);
  });
});
