import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import {
  provisionPeriods,
  type RunReportBaseline,
  type RunReportProvision,
} from '@/libs/flagship/runReport';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  FLAT_3000_REFORM,
  FLAT_CTC_PROVISION,
  PAST_REPORT_YEAR,
  PHASED_CTC_INTERVALS,
  PHASED_CTC_PROVISION,
  PHASED_CTC_REFORM,
  PHASED_REPORT_YEAR,
} from '@/tests/fixtures/components/flagship/reportAdjustPanelMocks';

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
  baselineUnknown,
}: {
  region?: string;
  year?: string;
  baseline?: RunReportBaseline;
  baselineUnknown?: boolean;
} = {}) {
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
        baselineUnknown={baselineUnknown}
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

  test('given the provisions arrive after the panel then it shows them, with nothing to recompute', async () => {
    // Given: a shared link renders the results before the reform policy loads.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const panel = (title: string, provisions: typeof PROVISIONS) => (
      <QueryClientProvider client={queryClient}>
        <ReportAdjustPanel title={title} sourceNote="" provisions={provisions} />
      </QueryClientProvider>
    );
    const { rerender } = render(panel('Impact report', []));

    // When
    rerender(panel('CTC expansion', [PROVISIONS[0]]));
    await userEvent.setup().click(screen.getByRole('button', { name: /open adjust parameters/i }));

    // Then
    expect(screen.getByLabelText(/new value for maximum credit per child/i)).toHaveValue(2500);
    expect(screen.getByRole('textbox', { name: 'Reform name' })).toHaveValue('CTC expansion');
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
    expect(provisionPeriods(mockRun.mock.calls[0][2][0])).toEqual({
      '2026-01-01.2100-12-31': 3600,
    });
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

  test('given a saved reform whose changes could not load then it is skipped, not matched or fatal', async () => {
    mockFindMine.mockResolvedValue([
      { id: 'rf-unloaded', label: 'Unloaded', parameters: [], parametersUnavailable: true },
    ]);
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
    const user = userEvent.setup();
    await renderPanel();

    // Removing every provision but one leaves a set an empty reform must not match
    const input = screen.getByLabelText(/new value for maximum credit per child/i);
    await user.clear(input);
    await user.type(input, '3600');
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockRun.mock.calls[0][3]).toBe('rf-new');
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

  test('given every value is back at current law then recompute waits, and says why', async () => {
    // Given
    const user = userEvent.setup();
    await renderPanel();

    // When: one provision removed, the other set back to its current-law value
    await user.click(screen.getByRole('button', { name: /remove maximum credit per child/i }));
    const allotment = screen.getByLabelText(/new value for maximum allotment/i);
    await user.clear(allotment);
    await user.type(allotment, '300');

    // Then
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
    expect(screen.getByText(/nothing differs from current law/i)).toBeInTheDocument();
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('given the baseline policy could not be loaded then recompute is off and says why', async () => {
    const user = userEvent.setup();
    await renderPanel({ baselineUnknown: true });

    await user.click(screen.getByRole('button', { name: /remove maximum allotment/i }));

    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
    expect(
      screen.getByText(
        'The baseline policy could not be loaded, so a recompute cannot compare with it.'
      )
    ).toBeInTheDocument();
  });

  test('given collapse then the panel shrinks to the adjust tab and reopens', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /collapse adjust parameters/i }));
    expect(screen.queryByRole('button', { name: /recompute/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
    expect(screen.getByRole('button', { name: /recompute/i })).toBeInTheDocument();
  });

  describe('given the report year and the provision’s dates', () => {
    function renderOne(provision: RunReportProvision, year: string) {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      return render(
        <QueryClientProvider client={queryClient}>
          <ReportAdjustPanel
            title="CTC expansion"
            sourceNote=""
            provisions={[provision]}
            year={year}
          />
        </QueryClientProvider>
      );
    }

    async function editAndRecompute(value: string) {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
      const input = screen.getByLabelText(/new value for maximum credit per child/i);
      await user.clear(input);
      await user.type(input, value);
      await user.click(screen.getByRole('button', { name: /recompute/i }));
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
    }

    test('given a past-year report then an edited value runs from that year', async () => {
      // Given
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      renderOne(FLAT_CTC_PROVISION, PAST_REPORT_YEAR);

      // When
      await editAndRecompute('3000');

      // Then
      const [, , provisions, , year] = mockRun.mock.calls[0];
      expect(year).toBe(Number(PAST_REPORT_YEAR));
      expect(provisionPeriods(provisions[0])).toEqual({ '2024-01-01.2100-12-31': 3000 });
    });

    test('given a past-year report then the saved reform sets the value from that year', async () => {
      // Given
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      renderOne(FLAT_CTC_PROVISION, PAST_REPORT_YEAR);

      // When
      await editAndRecompute('3000');

      // Then
      expect(mockCreate.mock.calls[0][0].parameters[0].values).toEqual([
        { startDate: '2024-01-01', endDate: '2100-12-31', value: 3000 },
      ]);
    });

    test('given a phased provision then each period edits on its own dates', async () => {
      // Given
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      const user = userEvent.setup();
      renderOne(PHASED_CTC_PROVISION, PHASED_REPORT_YEAR);
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

      // Then — one box per period, named by its dates
      expect(screen.getByLabelText(/maximum credit per child, 2026 only/i)).toBeInTheDocument();
      const later = screen.getByLabelText(/maximum credit per child, from 2027/i);

      // When
      await user.clear(later);
      await user.type(later, '3600');
      await user.click(screen.getByRole('button', { name: /recompute/i }));
      await waitFor(() => expect(mockRun).toHaveBeenCalled());

      // Then — the other period keeps its value
      expect(provisionPeriods(mockRun.mock.calls[0][2][0])).toEqual({
        '2026-01-01.2026-12-31': 2500,
        '2027-01-01.2100-12-31': 3600,
      });
    });

    test('given only more years then a recompute scores them, under the same name', async () => {
      // Given
      Element.prototype.scrollIntoView ??= vi.fn();
      Element.prototype.hasPointerCapture ??= vi.fn(() => false);
      mockFindMine.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion' });
      const user = userEvent.setup();
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ReportAdjustPanel
            title="CTC expansion"
            sourceNote=""
            provisions={[PHASED_CTC_PROVISION]}
            year="2026"
          />
        </QueryClientProvider>
      );
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
      expect(screen.getByRole('combobox', { name: 'Years' })).toHaveTextContent('2026 only');
      expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();

      // When
      await user.click(screen.getByRole('combobox', { name: 'Years' }));
      await user.click(await screen.findByRole('option', { name: '2026–2035 · 10 years' }));
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      expect(mockRun.mock.calls[0][0]).toBe('CTC expansion');
      expect(mockRun.mock.calls[0][5]).toMatchObject({ windowYears: 10 });
    });

    test('given a budget window then a recompute scores the same years', async () => {
      // Given
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      const user = userEvent.setup();
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ReportAdjustPanel
            title="CTC expansion"
            sourceNote=""
            provisions={[PHASED_CTC_PROVISION]}
            year="2026"
            budgetWindow={{ startYear: 2026, windowSize: 3 }}
          />
        </QueryClientProvider>
      );
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
      expect(screen.getByRole('combobox', { name: 'Years' })).toHaveTextContent(
        '2026–2028 · 3 years'
      );

      // When
      const input = screen.getByLabelText(/maximum credit per child, 2026 only/i);
      await user.clear(input);
      await user.type(input, '2600');
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      expect(mockRun.mock.calls[0][5]).toMatchObject({ windowYears: 3 });
    });

    test('given only the population changes then a saved reform with other dates is not reused', async () => {
      // Given
      seedDeductionMetadata({ regions: US_REGIONS });
      mockFindMine.mockResolvedValue([FLAT_3000_REFORM]);
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      const user = userEvent.setup();
      renderOne(PHASED_CTC_PROVISION, PHASED_REPORT_YEAR);
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

      // When
      await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
      await user.click(await screen.findByRole('option', { name: /California/ }));
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      const [runTitle, , , reformId] = mockRun.mock.calls[0];
      expect(reformId).toBe('rf-new');
      expect(runTitle).toBe('CTC expansion (adjusted)');
      store.dispatch(clearMetadata());
    });

    test('given no saved match then the saved reform has the dates that ran', async () => {
      // Given
      seedDeductionMetadata({ regions: US_REGIONS });
      mockCreate.mockResolvedValue({ id: 'rf-new', label: 'CTC expansion (adjusted)' });
      const user = userEvent.setup();
      renderOne(PHASED_CTC_PROVISION, PHASED_REPORT_YEAR);
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

      // When
      await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
      await user.click(await screen.findByRole('option', { name: /California/ }));
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      expect(mockCreate.mock.calls[0][0].parameters[0].values).toEqual(PHASED_CTC_INTERVALS);
      expect(provisionPeriods(mockRun.mock.calls[0][2][0])).toEqual({
        '2026-01-01.2026-12-31': 2500,
        '2027-01-01.2100-12-31': 3000,
      });
      store.dispatch(clearMetadata());
    });

    test('given the same dated reform is saved then it is reused', async () => {
      // Given
      seedDeductionMetadata({ regions: US_REGIONS });
      mockFindMine.mockResolvedValue([FLAT_3000_REFORM, PHASED_CTC_REFORM]);
      const user = userEvent.setup();
      renderOne(PHASED_CTC_PROVISION, PHASED_REPORT_YEAR);
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

      // When
      await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
      await user.click(await screen.findByRole('option', { name: /California/ }));
      await user.click(screen.getByRole('button', { name: /recompute/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalled());
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockRun.mock.calls[0][3]).toBe(PHASED_CTC_REFORM.id);
      store.dispatch(clearMetadata());
    });
  });
});
