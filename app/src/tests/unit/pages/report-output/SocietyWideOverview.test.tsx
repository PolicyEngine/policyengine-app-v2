import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import type { CongressionalDistrictDataContextValue } from '@/contexts/congressional-district';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { typography } from '@/designTokens';
import { useRegions } from '@/hooks/useRegions';
import SocietyWideOverview, {
  buildOutcomeMapData,
  getDistrictPayloadAvailability,
  hasCompleteDistrictOutcomePayload,
} from '@/pages/report-output/SocietyWideOverview';
import {
  TEXAS_REGION,
  UTAH_AND_TEXAS_LABELS,
} from '@/tests/fixtures/components/flagship/report/districtImpactMocks';
import { COMPUTE_DISTRICTS_LABEL } from '@/tests/fixtures/components/flagship/report/stateDistrictComputePanelMocks';
import { createMockContextValue } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import {
  economyWhere,
  fakeStateDistrictApi,
  NATIONWIDE_OUTPUT_WITH_DISTRICTS,
  STATE_COMPUTING,
  STATE_ERROR,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_YEAR,
  stateOk,
  US_STATE_REGIONS,
  UTAH,
  UTAH_REPORT_OUTPUT,
  type FakeStateApi,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

// Budget with every component exactly zero (an exact no-op). The mock's shallow
// merge replaces `budget` wholesale, so the full object is provided here.
const ALL_ZERO_BUDGET = {
  baseline_net_income: 12_000_000_000_000,
  benefit_spending_impact: 0,
  budgetary_impact: 0,
  households: 130_000_000,
  state_tax_revenue_impact: 0,
  tax_revenue_impact: 0,
};

const ALL_NO_CHANGE = {
  'Gain more than 5%': 0,
  'Gain less than 5%': 0,
  'Lose more than 5%': 0,
  'Lose less than 5%': 0,
  'No change': 1,
};

const { mockUseCongressionalDistrictData, plotProps } = vi.hoisted(() => ({
  mockUseCongressionalDistrictData: vi.fn(),
  plotProps: [] as Array<{ layout?: { font?: { family?: string } } }>,
}));

vi.mock('react-plotly.js', () => ({
  default: vi.fn((props: { layout?: { font?: { family?: string } } }) => {
    plotProps.push(props);
    return null;
  }),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/components/visualization/USDistrictChoroplethMap', () => ({
  USDistrictChoroplethMap: vi.fn(() => <div data-testid="district-map" />),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({ data: [] })),
}));

/** Renders inside a query client: the district card looks up and runs states. */
function renderWithQueries(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function createCongressionalDistrictContextMock(
  overrides: Partial<CongressionalDistrictDataContextValue> = {}
) {
  return createMockContextValue({
    reformPolicyId: '96491',
    baselinePolicyId: '2',
    year: '2026',
    labelLookup: new Map([['AL-01', "Alabama's 1st congressional district"]]),
    ...overrides,
  });
}

// Mock useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock formatBudgetaryImpact utility
vi.mock('@/utils/formatPowers', () => ({
  formatBudgetaryImpact: vi.fn((value: number) => {
    if (value === 0) {
      return { display: '0', label: '' };
    }
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return { display: (value / 1_000_000_000).toFixed(1), label: 'billion' };
    }
    if (absValue >= 1_000_000) {
      return { display: (value / 1_000_000).toFixed(1), label: 'million' };
    }
    return { display: value.toFixed(0), label: '' };
  }),
}));

describe('SocietyWideOverview', () => {
  beforeEach(() => {
    plotProps.length = 0;
    vi.clearAllMocks();
    mockUseCongressionalDistrictData.mockReturnValue(createCongressionalDistrictContextMock());
  });

  test('given compact overview charts then they use the shared chart font', () => {
    // Given
    const output = createMockSocietyWideOutput();

    // When
    render(<SocietyWideOverview output={output} />);

    // Then
    expect(plotProps.map((props) => props.layout?.font?.family)).toEqual([
      typography.fontFamily.primary,
      typography.fontFamily.primary,
    ]);
  });

  describe('budgetary impact section', () => {
    test('given positive budgetary impact then displays formatted value with raise subtext', () => {
      // Given
      const output = createMockSocietyWideOutput({
        budget: { budgetary_impact: 1_000_000 } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Budgetary impact')).toBeInTheDocument();
      expect(container.textContent).toContain('$1.0');
      expect(container.textContent).toContain('million');
      expect(container.textContent).toContain('This reform would raise');
    });

    test('given negative budgetary impact then displays cost subtext', () => {
      // Given
      const output = createMockSocietyWideOutput({
        budget: { budgetary_impact: -1_000_000 } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('This reform would cost');
    });

    test('given zero budgetary impact then shows no change message', () => {
      // Given
      const output = createMockSocietyWideOutput({ budget: { budgetary_impact: 0 } as any });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('No change');
      expect(container.textContent).toContain('no effect on the budget');
    });
  });

  describe('poverty impact section', () => {
    test('given poverty decrease then shows percentage decrease', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.09 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Poverty impact')).toBeInTheDocument();
      expect(container.textContent).toContain('10.0%');
      expect(container.textContent).toContain('decrease in poverty rate');
    });

    test('given poverty increase then shows percentage increase', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.12 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('20.0%');
      expect(container.textContent).toContain('increase in poverty rate');
    });

    test('given no poverty change then shows no change message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.1 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('No change');
      expect(container.textContent).toContain('Poverty rate unchanged');
    });

    test('given zero baseline poverty then handles edge case', () => {
      // Given - edge case where baseline is 0
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0, reform: 0.05 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then - component should handle division by zero gracefully
      expect(container.textContent).toContain('Poverty impact');
    });
  });

  describe('winners and losers section', () => {
    test('given both winners and losers then shows distribution', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0.2,
            'Gain less than 5%': 0.1,
            'Lose more than 5%': 0.05,
            'Lose less than 5%': 0.05,
            'No change': 0.6,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Winners and losers')).toBeInTheDocument();
      expect(container.textContent).toContain('Gain: 30.0%');
      expect(container.textContent).toContain('Lose: 10.0%');
      expect(container.textContent).toContain('No change: 60.0%');
    });

    test('given only winners then shows only gains', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0.2,
            'Gain less than 5%': 0.1,
            'Lose more than 5%': 0,
            'Lose less than 5%': 0,
            'No change': 0.7,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Gain: 30.0%');
      expect(container.textContent).toContain('Lose: 0.0%');
    });

    test('given only losers then shows only losses', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0,
            'Gain less than 5%': 0,
            'Lose more than 5%': 0.05,
            'Lose less than 5%': 0.05,
            'No change': 0.9,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Gain: 0.0%');
      expect(container.textContent).toContain('Lose: 10.0%');
    });
  });

  test('given complete output then renders all three sections', () => {
    // Given
    const output = createMockSocietyWideOutput();

    // When
    render(<SocietyWideOverview output={output} />);

    // Then
    expect(screen.getByText('Budgetary impact')).toBeInTheDocument();
    expect(screen.getByText('Poverty impact')).toBeInTheDocument();
    expect(screen.getByText('Winners and losers')).toBeInTheDocument();
  });

  describe('no-op callout', () => {
    test('given a complete no-op report then shows the informational callout with the simulated year', () => {
      // Given - every budget component is zero and 100% of the population is unchanged
      const output = createMockSocietyWideOutput({
        budget: { ...ALL_ZERO_BUDGET },
        intra_decile: { all: { ...ALL_NO_CHANGE } },
      });

      // When
      render(
        <ReportYearProvider year="2029">
          <SocietyWideOverview output={output} />
        </ReportYearProvider>
      );

      // Then
      expect(screen.getByText("This reform doesn't change any policy in 2029")).toBeInTheDocument();
      expect(screen.getByText(/Every output is identical to current law/)).toBeInTheDocument();
    });

    test('given no report year context then the callout falls back to a generic year phrase', () => {
      // Given
      const output = createMockSocietyWideOutput({
        budget: { ...ALL_ZERO_BUDGET },
        intra_decile: { all: { ...ALL_NO_CHANGE } },
      });

      // When - rendered without a ReportYearProvider
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(
        screen.getByText("This reform doesn't change any policy in the simulated year")
      ).toBeInTheDocument();
    });

    test('given a report with real impacts then the callout is absent', () => {
      // Given - the default mock has a nonzero budget and only 60% no change
      const output = createMockSocietyWideOutput();

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.queryByText(/doesn't change any policy/)).not.toBeInTheDocument();
    });

    test('given a revenue-neutral reform with winners and losers then the callout is absent', () => {
      // Given - budget nets to zero but only 60% of the population is unchanged
      const output = createMockSocietyWideOutput({
        budget: { ...ALL_ZERO_BUDGET },
        intra_decile: {
          all: {
            'Gain more than 5%': 0.1,
            'Gain less than 5%': 0.15,
            'Lose more than 5%': 0.05,
            'Lose less than 5%': 0.1,
            'No change': 0.6,
          },
        },
      });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.queryByText(/doesn't change any policy/)).not.toBeInTheDocument();
    });
  });

  test('buildOutcomeMapData reads winner shares from the district payload and tracks gaps', () => {
    const labelLookup = new Map([
      ['AL-01', "Alabama's 1st congressional district"],
      ['AL-02', "Alabama's 2nd congressional district"],
    ]);

    const result = buildOutcomeMapData(
      [{ district: 'AL-01', winner_percentage: 0.6 }, { district: 'AL-02' }],
      'winner',
      labelLookup
    );

    expect(result.points).toEqual([
      {
        geoId: 'AL-01',
        label: "Alabama's 1st congressional district",
        value: 0.6,
      },
    ]);
    expect(result.missingCount).toBe(1);
  });

  test('getDistrictPayloadAvailability tracks coverage and each outcome metric separately', () => {
    const labelLookup = new Map([
      ['AL-01', "Alabama's 1st congressional district"],
      ['AL-02', "Alabama's 2nd congressional district"],
    ]);

    expect(
      getDistrictPayloadAvailability(
        [
          { district: 'AL-01', winner_percentage: 0.6, loser_percentage: 0.2 },
          { district: 'AL-02', winner_percentage: 0.5 },
        ],
        labelLookup,
        null
      )
    ).toEqual({
      expectedDistrictIds: ['AL-01', 'AL-02'],
      hasCompleteCoverage: true,
      hasCompleteWinnerData: true,
      hasCompleteLoserData: false,
    });

    expect(
      getDistrictPayloadAvailability(
        [{ district: 'AL-01', winner_percentage: 0.6, loser_percentage: 0.2 }],
        labelLookup,
        null
      )
    ).toEqual({
      expectedDistrictIds: ['AL-01', 'AL-02'],
      hasCompleteCoverage: false,
      hasCompleteWinnerData: false,
      hasCompleteLoserData: false,
    });
  });

  test('hasCompleteDistrictOutcomePayload requires full district coverage plus both outcome shares', () => {
    const labelLookup = new Map([
      ['AL-01', "Alabama's 1st congressional district"],
      ['AL-02', "Alabama's 2nd congressional district"],
    ]);

    expect(
      hasCompleteDistrictOutcomePayload(
        [
          { district: 'AL-01', winner_percentage: 0.6, loser_percentage: 0.2 },
          { district: 'AL-02', winner_percentage: 0.5, loser_percentage: 0.3 },
        ],
        labelLookup,
        null
      )
    ).toBe(true);

    expect(
      hasCompleteDistrictOutcomePayload(
        [
          { district: 'AL-01', winner_percentage: 0.6, loser_percentage: 0.2 },
          { district: 'AL-02', winner_percentage: 0.5 },
        ],
        labelLookup,
        null
      )
    ).toBe(false);

    expect(
      hasCompleteDistrictOutcomePayload(
        [{ district: 'AL-01', winner_percentage: 0.6, loser_percentage: 0.2 }],
        labelLookup,
        null
      )
    ).toBe(false);
  });
});

describe('SocietyWideOverview congressional districts from state runs', () => {
  let api: FakeStateApi;

  const contextFor = (overrides: Record<string, unknown> = {}) =>
    createCongressionalDistrictContextMock({
      reformPolicyId: STATE_RUNS_REFORM_POLICY_ID,
      baselinePolicyId: STATE_RUNS_BASELINE_POLICY_ID,
      year: STATE_RUNS_YEAR,
      scope: 'nationwide',
      labelLookup: UTAH_AND_TEXAS_LABELS,
      ...overrides,
    });

  const serve = (options: Parameters<typeof fakeStateDistrictApi>[0] = {}) => {
    api = fakeStateDistrictApi(options);
    vi.stubGlobal('fetch', api.fetch);
  };

  /** What the card last asked the district map to draw. */
  const lastMap = () => vi.mocked(USDistrictChoroplethMap).mock.calls.at(-1)?.[0];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
    mockUseCongressionalDistrictData.mockReturnValue(contextFor());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a nationwide report then the card offers Compute and maps none of the result’s districts', async () => {
    // Given
    serve();

    // When
    renderWithQueries(
      <SocietyWideOverview output={NATIONWIDE_OUTPUT_WITH_DISTRICTS} showCongressionalCard />
    );

    // Then
    expect(
      await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('district-map')).not.toBeInTheDocument();
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given Compute then the card maps the finished states with how many are in', async () => {
    // Given
    const user = userEvent.setup();
    serve({ economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING) });
    renderWithQueries(
      <SocietyWideOverview output={NATIONWIDE_OUTPUT_WITH_DISTRICTS} showCongressionalCard />
    );

    // When
    await user.click(await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));

    // Then
    expect(await screen.findByText('1 of 51 states')).toBeInTheDocument();
    expect(screen.getByTestId('district-map')).toBeInTheDocument();
    expect(lastMap()?.data.map((point) => point.geoId)).toEqual(['UT-01', 'UT-02']);
  });

  test('given a failed state then the map marks it and the card offers Retry', async () => {
    // Given
    const user = userEvent.setup();
    serve({ economy: economyWhere({ [TEXAS_REGION]: () => STATE_ERROR }) });
    renderWithQueries(
      <SocietyWideOverview output={NATIONWIDE_OUTPUT_WITH_DISTRICTS} showCongressionalCard />
    );

    // When
    await user.click(await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));

    // Then
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await waitFor(() => expect(lastMap()?.errorStates).toEqual(['TX']));
    expect(screen.getByText('50 of 51 states are in')).toBeInTheDocument();
  });

  test('given a state report then the card maps its own districts and looks nothing up', async () => {
    // Given
    serve();
    mockUseCongressionalDistrictData.mockReturnValue(
      contextFor({ scope: 'state', stateCode: 'ut' })
    );

    // When
    renderWithQueries(<SocietyWideOverview output={UTAH_REPORT_OUTPUT} showCongressionalCard />);

    // Then
    expect(screen.getByTestId('district-map')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.requests()).toHaveLength(0);
  });
});
