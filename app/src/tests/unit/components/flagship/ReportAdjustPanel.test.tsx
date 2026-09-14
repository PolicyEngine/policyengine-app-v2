import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';

const mockRun = vi.fn();
const mockFindByUser = vi.fn();
const mockCreate = vi.fn();
const { mockMetadata } = vi.hoisted(() => ({
  mockMetadata: {
    loading: false,
    error: null,
    currentCountry: 'us',
    currentLawId: 2,
    version: 'test',
    parameters: {
      'gov.irs.credits.ctc.amount.base[0].amount': {
        values: { '2020-01-01': 2000 },
      },
      'gov.usda.snap.max_allotment': {
        values: { '2020-01-01': 300 },
      },
    },
  },
}));

vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-redux')>();
  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) => selector({ metadata: mockMetadata }),
  };
});

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ findByUser: mockFindByUser, create: mockCreate }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ countryId: 'us' }),
  };
});

const PROVISIONS = [
  {
    path: 'gov.irs.credits.ctc.amount.base[0].amount',
    breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
    unit: 'currency-USD',
    baselineValue: 2000,
    values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
  },
  {
    path: 'gov.usda.snap.max_allotment',
    breadcrumb: 'USDA → SNAP → Maximum allotment',
    unit: 'currency-USD',
    baselineValue: 300,
    values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 350 }],
  },
];

async function renderPanel(provisions = PROVISIONS) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ReportAdjustPanel
        title="CTC expansion"
        sourceNote="Federal · Introduced"
        provisions={provisions}
      />
    </QueryClientProvider>
  );
  // Collapsed by default — expand via the edge tab before interacting.
  await userEvent.setup().click(screen.getByRole('button', { name: /open adjust parameters/i }));
  return result;
}

describe('ReportAdjustPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByUser.mockResolvedValue([]);
  });

  test('given the panel then provisions are editable and recompute waits for a change', async () => {
    await renderPanel();

    expect(screen.getByLabelText(/adjusted value for gov\.irs/i)).toHaveValue(2500);
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
  });

  test('given no matching reform then recompute saves a new one and runs linked to it', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel();

    const input = screen.getByLabelText(/adjusted value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'CTC expansion (adjusted)' })
    );
    const [runTitle, , runProvisions, reformId] = mockRun.mock.calls[0];
    expect(runTitle).toBe('CTC expansion (adjusted)');
    expect(reformId).toBe('rf-new');
    expect(runProvisions).toEqual([
      expect.objectContaining({
        path: PROVISIONS[0].path,
        values: [expect.objectContaining({ value: 3600 })],
      }),
      expect.objectContaining({
        path: PROVISIONS[1].path,
        values: [expect.objectContaining({ value: 350 })],
      }),
    ]);
    expect(runProvisions[0]).not.toHaveProperty('value');
  });

  test('given the adjusted set matches a saved reform then it is reused, not duplicated', async () => {
    mockFindByUser.mockResolvedValue([
      {
        id: 'rf-existing',
        label: 'My CTC reform',
        parameters: [
          {
            name: PROVISIONS[0].path,
            values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
          },
          {
            name: PROVISIONS[1].path,
            values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 350 }],
          },
        ],
      },
    ]);
    const user = userEvent.setup();
    await renderPanel();

    const input = screen.getByLabelText(/adjusted value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).not.toHaveBeenCalled();
    const [runTitle, , , reformId] = mockRun.mock.calls[0];
    expect(runTitle).toBe('My CTC reform');
    expect(reformId).toBe('rf-existing');
  });

  test('given a provision is removed then recompute runs without it', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /remove USDA/i }));
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    const [, , runProvisions] = mockRun.mock.calls[0];
    expect(runProvisions).toHaveLength(1);
    expect(runProvisions[0].path).toBe(PROVISIONS[0].path);
  });

  test('given all provisions are removed then recompute stays disabled with a restore path', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /remove IRS/i }));
    await user.click(screen.getByRole('button', { name: /remove USDA/i }));

    expect(screen.getByText(/all provisions removed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /restore 2 removed provisions/i }));
    expect(screen.getByLabelText(/adjusted value for gov\.irs/i)).toBeInTheDocument();
  });

  test('given every adjusted value matches current law then recompute is disabled and calls no stores or APIs', async () => {
    const user = userEvent.setup();
    await renderPanel();

    const ctc = screen.getByLabelText(/adjusted value for gov\.irs/i);
    const snap = screen.getByLabelText(/adjusted value for gov\.usda/i);
    await user.clear(ctc);
    await user.type(ctc, '2000');
    await user.clear(snap);
    await user.type(snap, '300');

    expect(screen.getByText(/selected values match current law/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
    expect(mockFindByUser).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('given one adjusted provision matches current law then only normalized effective parameters are saved and run', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'SNAP adjustment' });
    const user = userEvent.setup();
    await renderPanel();

    const ctc = screen.getByLabelText(/adjusted value for gov\.irs/i);
    await user.clear(ctc);
    await user.type(ctc, '2000');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: [
          expect.objectContaining({
            name: PROVISIONS[1].path,
            values: [expect.objectContaining({ value: 350 })],
          }),
        ],
      })
    );
    expect(mockRun.mock.calls[0][2]).toEqual([
      expect.objectContaining({
        path: PROVISIONS[1].path,
        values: [expect.objectContaining({ value: 350 })],
      }),
    ]);
  });

  test('given future-dated values then changing the current interval preserves later intervals', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'Dated CTC adjustment' });
    const datedProvisions = [
      {
        ...PROVISIONS[0],
        values: [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
          { startDate: '2027-01-01', endDate: '2100-12-31', value: 4200 },
        ],
      },
    ];
    const user = userEvent.setup();
    await renderPanel(datedProvisions);

    const input = screen.getByLabelText(/adjusted value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockRun.mock.calls[0][2][0].values).toEqual([
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 },
      { startDate: '2027-01-01', endDate: '2100-12-31', value: 4200 },
    ]);
  });

  test('given collapse then the panel shrinks to the adjust tab and reopens', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /collapse adjust parameters/i }));
    expect(screen.queryByRole('button', { name: /recompute/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
    expect(screen.getByRole('button', { name: /recompute/i })).toBeInTheDocument();
  });
});
