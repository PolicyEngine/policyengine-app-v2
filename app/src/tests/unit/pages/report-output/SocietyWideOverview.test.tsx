import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SocietyWideOverview, {
  buildOutcomeMapData,
  getDistrictPayloadAvailability,
  hasCompleteDistrictOutcomePayload,
} from '@/pages/report-output/SocietyWideOverview';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { mockUseCongressionalDistrictData } = vi.hoisted(() => ({
  mockUseCongressionalDistrictData: vi.fn(),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/components/visualization/USDistrictChoroplethMap', () => ({
  USDistrictChoroplethMap: vi.fn(() => <div data-testid="district-map" />),
}));

function createCongressionalDistrictContextMock(overrides: Record<string, unknown> = {}) {
  return {
    reformPolicyId: '96491',
    baselinePolicyId: '2',
    year: '2026',
    stateResponses: new Map(),
    completedCount: 0,
    loadingCount: 0,
    totalDistrictsLoaded: 0,
    totalStates: 51,
    isComplete: false,
    isLoading: false,
    hasStarted: false,
    errorCount: 0,
    erroredStates: new Set(),
    labelLookup: new Map([['AL-01', "Alabama's 1st congressional district"]]),
    isStateLevelReport: false,
    stateCode: null,
    startFetch: vi.fn(),
    validateAllLoaded: vi.fn(),
    getCompletedStates: vi.fn(),
    getLoadingStates: vi.fn(),
    ...overrides,
  };
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
    vi.clearAllMocks();
    mockUseCongressionalDistrictData.mockReturnValue(createCongressionalDistrictContextMock());
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

  test('saved districts without outcome shares trigger a same-payload refresh', () => {
    const startFetch = vi.fn();
    mockUseCongressionalDistrictData.mockReturnValue(
      createCongressionalDistrictContextMock({ startFetch })
    );

    const output = createMockSocietyWideOutput({
      congressional_district_impact: {
        districts: [
          {
            district: 'AL-01',
            average_household_income_change: 120,
            relative_household_income_change: 0.01,
          },
        ],
      },
    });

    render(<SocietyWideOverview output={output as any} showCongressionalCard />);

    expect(startFetch).toHaveBeenCalledTimes(1);
  });

  test('saved districts with outcome shares do not trigger a refresh', () => {
    const startFetch = vi.fn();
    mockUseCongressionalDistrictData.mockReturnValue(
      createCongressionalDistrictContextMock({ startFetch })
    );

    const output = createMockSocietyWideOutput({
      congressional_district_impact: {
        districts: [
          {
            district: 'AL-01',
            average_household_income_change: 120,
            relative_household_income_change: 0.01,
            winner_percentage: 0.58,
            loser_percentage: 0.21,
          },
        ],
      },
    });

    render(<SocietyWideOverview output={output as any} showCongressionalCard />);

    expect(startFetch).not.toHaveBeenCalled();
  });

  test('saved districts with complete winner shares but missing loser shares still trigger a refresh', () => {
    const startFetch = vi.fn();
    mockUseCongressionalDistrictData.mockReturnValue(
      createCongressionalDistrictContextMock({
        startFetch,
        labelLookup: new Map([
          ['AL-01', "Alabama's 1st congressional district"],
          ['AL-02', "Alabama's 2nd congressional district"],
        ]),
      })
    );

    const output = createMockSocietyWideOutput({
      congressional_district_impact: {
        districts: [
          {
            district: 'AL-01',
            average_household_income_change: 120,
            relative_household_income_change: 0.01,
            winner_percentage: 0.58,
          },
          {
            district: 'AL-02',
            average_household_income_change: 80,
            relative_household_income_change: 0.008,
            winner_percentage: 0.52,
          },
        ],
      },
    });

    render(<SocietyWideOverview output={output as any} showCongressionalCard />);

    expect(startFetch).toHaveBeenCalledTimes(1);
  });

  test('truncated saved districts trigger a same-payload refresh', () => {
    const startFetch = vi.fn();
    mockUseCongressionalDistrictData.mockReturnValue(
      createCongressionalDistrictContextMock({
        startFetch,
        labelLookup: new Map([
          ['AL-01', "Alabama's 1st congressional district"],
          ['AL-02', "Alabama's 2nd congressional district"],
        ]),
      })
    );

    const output = createMockSocietyWideOutput({
      congressional_district_impact: {
        districts: [
          {
            district: 'AL-01',
            average_household_income_change: 120,
            relative_household_income_change: 0.01,
            winner_percentage: 0.58,
            loser_percentage: 0.21,
          },
        ],
      },
    });

    render(<SocietyWideOverview output={output as any} showCongressionalCard />);

    expect(startFetch).toHaveBeenCalledTimes(1);
  });
});
