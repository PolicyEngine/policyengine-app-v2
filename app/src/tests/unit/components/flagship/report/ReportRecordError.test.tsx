import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportRecordError from '@/components/flagship/report/ReportRecordError';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';

const DAMAGED = new ReportSchemaError('invalid-field', 'provisions must be an array', 'provisions');
const NEWER = new ReportSchemaError(
  'newer-version',
  'Saved with report schema 3; this version reads up to 2',
  'schemaVersion'
);

describe('ReportRecordError', () => {
  test('given damaged details then it says so, with the reason kept for debugging', () => {
    render(<ReportRecordError error={DAMAGED} onOpenWithout={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: "This report's saved details can't be read" })
    ).toBeInTheDocument();
    expect(screen.getByText('They are damaged in this browser.')).toBeInTheDocument();
    expect(screen.getByText('provisions must be an array')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
  });

  test('given details a newer version saved then reloading is offered', () => {
    render(<ReportRecordError error={NEWER} onOpenWithout={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('given the user opens without the details then the callback runs', async () => {
    const user = userEvent.setup();
    const onOpenWithout = vi.fn();
    render(<ReportRecordError error={DAMAGED} onOpenWithout={onOpenWithout} />);

    await user.click(screen.getByRole('button', { name: 'Open without saved details' }));

    expect(onOpenWithout).toHaveBeenCalledTimes(1);
  });
});
