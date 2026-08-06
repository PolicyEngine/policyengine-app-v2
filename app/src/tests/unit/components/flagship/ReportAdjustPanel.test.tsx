import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';

const mockRun = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

const PROVISIONS = [
  {
    path: 'gov.irs.credits.ctc.amount.base[0].amount',
    breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
    unit: 'currency-USD',
    baselineValue: 2000,
    value: 2500,
  },
];

function renderPanel() {
  return render(
    <ReportAdjustPanel
      title="CTC expansion"
      sourceNote="Federal · Introduced"
      provisions={PROVISIONS}
    />
  );
}

describe('ReportAdjustPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the panel then provisions are editable and recompute waits for a change', () => {
    renderPanel();

    expect(screen.getByLabelText(/adjusted value for gov\.irs/i)).toHaveValue(2500);
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
  });

  test('given an adjusted value then recompute runs with it and an adjusted title', async () => {
    const user = userEvent.setup();
    renderPanel();

    const input = screen.getByLabelText(/adjusted value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    expect(mockRun).toHaveBeenCalledWith('CTC expansion (adjusted)', 'Federal · Introduced', [
      expect.objectContaining({ path: PROVISIONS[0].path, value: 3600 }),
    ]);
  });

  test('given collapse then the panel shrinks to the adjust tab and reopens', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /collapse the adjust panel/i }));
    expect(screen.queryByRole('button', { name: /recompute/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /adjust parameters/i }));
    expect(screen.getByRole('button', { name: /recompute/i })).toBeInTheDocument();
  });

  test('given no provisions then the panel stays out of the way', () => {
    const { container } = render(<ReportAdjustPanel title="Empty" sourceNote="" provisions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
