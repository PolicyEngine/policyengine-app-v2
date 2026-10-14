import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import type { RunReportBaseline } from '@/libs/flagship/runReport';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const mockRun = vi.fn();
const mockFindMine = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ findMine: mockFindMine, create: mockCreate }),
  };
});

const mockPush = vi.fn();

vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return { ...actual, useAppNavigate: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) };
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
    value: 2500,
  },
  {
    path: 'gov.usda.snap.max_allotment',
    breadcrumb: 'USDA → SNAP → Maximum allotment',
    unit: 'currency-USD',
    baselineValue: 300,
    value: 350,
  },
];

async function renderPanel({
  region,
  year,
  baseline,
}: { region?: string; year?: string; baseline?: RunReportBaseline } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ReportAdjustPanel
        title="CTC expansion"
        sourceNote="Federal · Introduced"
        provisions={PROVISIONS}
        region={region}
        year={year}
        baseline={baseline}
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
    mockFindMine.mockResolvedValue([]);
  });

  test('given the panel then provisions are editable and recompute waits for a change', async () => {
    await renderPanel();

    expect(screen.getByLabelText(/new value for maximum credit per child/i)).toHaveValue(2500);
    // What it was reads beside the editor, with no Before and After labels.
    expect(screen.getByText('Baseline: $2,000')).toBeInTheDocument();
    expect(screen.queryByText('Before')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
  });

  test('given a state report from a later year then recompute runs there, that year', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel({ region: 'state/va', year: '2027' });

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    const [, , , , year, options] = mockRun.mock.calls[0];
    expect(year).toBe(2027);
    expect(options).toEqual({ region: 'state/va' });
  });

  test('given the report population arrives after the panel then the panel follows it', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const panel = (region?: string) => (
      <QueryClientProvider client={queryClient}>
        <ReportAdjustPanel
          title="CTC expansion"
          sourceNote=""
          provisions={PROVISIONS}
          region={region}
        />
      </QueryClientProvider>
    );
    const { rerender } = render(panel(undefined));
    await userEvent.setup().click(screen.getByRole('button', { name: /open adjust parameters/i }));
    expect(screen.getByRole('button', { name: 'Population: Nationwide' })).toBeInTheDocument();

    rerender(panel('state/de'));

    expect(screen.getByRole('button', { name: 'Population: Delaware' })).toBeInTheDocument();
    // Following the report is not a change to recompute.
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
  });

  test('given Edit in Build then the reform as adjusted opens there as the draft', async () => {
    clearDraftReform();
    const user = userEvent.setup();
    await renderPanel({ region: 'state/de', year: '2027' });

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /edit in build/i }));

    expect(mockPush).toHaveBeenCalledWith('/us/build');
    const draft = getDraftReform();
    expect(draft).toMatchObject({
      label: 'CTC expansion',
      year: 2027,
      population: { scope: 'national', region: 'state/de' },
    });
    expect(draft?.provisions.map((provision) => [provision.path, provision.value])).toEqual([
      [PROVISIONS[0].path, 3600],
      [PROVISIONS[1].path, 350],
    ]);
    clearDraftReform();
  });

  describe('given a report compared with a saved reform', () => {
    const PLAN_B: RunReportBaseline = { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 };

    test('then recompute compares with it too', async () => {
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      const user = userEvent.setup();
      await renderPanel({ baseline: PLAN_B });

      const input = screen.getByLabelText(/new value for maximum credit per child/i);
      await user.clear(input);
      await user.type(input, '3600');
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      expect(mockRun.mock.calls[0][5]).toEqual({ region: undefined, baseline: PLAN_B });
    });

    test('then Edit in Build keeps the comparison in the draft', async () => {
      clearDraftReform();
      const user = userEvent.setup();
      await renderPanel({ baseline: PLAN_B });

      await user.click(screen.getByRole('button', { name: /edit in build/i }));

      expect(getDraftReform()?.baselineReformId).toBe('rf-plan-b');
      clearDraftReform();
    });
  });

  test('given a dated provision is edited then recompute runs the new value, not its dates', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportAdjustPanel
          title="CTC expansion"
          sourceNote=""
          provisions={[
            {
              ...PROVISIONS[0],
              intervals: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 }],
            },
          ]}
        />
      </QueryClientProvider>
    );
    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockRun.mock.calls[0][2]).toEqual([
      expect.objectContaining({ value: 3600, intervals: undefined }),
    ]);
  });

  test('given the reform is renamed then recompute saves and titles it with the name', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'Bigger CTC' });
    const user = userEvent.setup();
    await renderPanel();

    const name = screen.getByRole('textbox', { name: 'Reform name' });
    expect(name).toHaveValue('CTC expansion');
    await user.clear(name);
    await user.type(name, 'Bigger CTC');
    // A new name alone is a change to recompute.
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ label: 'Bigger CTC' }));
    expect(mockRun.mock.calls[0][0]).toBe('Bigger CTC');
  });

  test('given another population is chosen then recompute runs on it', async () => {
    seedDeductionMetadata({ regions: US_REGIONS });
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel({ region: 'us', year: '2026' });

    // Nothing changed yet: no recompute to offer.
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
    await user.click(await screen.findByRole('option', { name: /California/ }));
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockRun.mock.calls[0][5]).toEqual({ region: 'state/ca' });
    store.dispatch(clearMetadata());
  });

  test('given a nationwide report then recompute stays nationwide', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel({ region: 'us', year: '2026' });

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockRun.mock.calls[0][5]).toEqual({ region: undefined });
  });

  test('given no matching reform then recompute saves a new one and runs linked to it', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel();

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'CTC expansion (adjusted)' })
    );
    expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('userId');
    const [runTitle, , runProvisions, reformId] = mockRun.mock.calls[0];
    expect(runTitle).toBe('CTC expansion (adjusted)');
    expect(reformId).toBe('rf-new');
    expect(runProvisions).toEqual([
      expect.objectContaining({ path: PROVISIONS[0].path, value: 3600 }),
      expect.objectContaining({ path: PROVISIONS[1].path, value: 350 }),
    ]);
  });

  test('given recompute then only this browser’s saved reforms are searched for a match', async () => {
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /remove maximum allotment/i }));
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockFindMine).toHaveBeenCalledWith('us');
  });

  test('given the adjusted set matches a saved reform then it is reused, not duplicated', async () => {
    mockFindMine.mockResolvedValue([
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

    const input = screen.getByLabelText(/new value for maximum credit per child/i);
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

    await user.click(screen.getByRole('button', { name: /remove maximum allotment/i }));
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    const [, , runProvisions] = mockRun.mock.calls[0];
    expect(runProvisions).toHaveLength(1);
    expect(runProvisions[0].path).toBe(PROVISIONS[0].path);
  });

  test('given all provisions are removed then recompute stays disabled with a restore path', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /remove maximum credit per child/i }));
    await user.click(screen.getByRole('button', { name: /remove maximum allotment/i }));

    expect(screen.getByText(/all provisions removed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /restore 2 removed provisions/i }));
    expect(screen.getByLabelText(/new value for maximum credit per child/i)).toBeInTheDocument();
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
