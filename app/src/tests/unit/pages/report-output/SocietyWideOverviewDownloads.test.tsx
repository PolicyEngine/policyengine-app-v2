import { fireEvent, render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SocietyWideOverview from '@/pages/report-output/SocietyWideOverview';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { dashboardCardProps, mockUseCongressionalDistrictData } = vi.hoisted(() => ({
  dashboardCardProps: [] as Record<string, any>[],
  mockUseCongressionalDistrictData: vi.fn(),
}));

vi.mock('@/components/report/DashboardCard', () => ({
  default: vi.fn((props: Record<string, any>) => {
    dashboardCardProps.push(props);
    return (
      <section>
        {props.shrunkenHeader}
        {props.shrunkenBody}
        {props.expandedControls}
      </section>
    );
  }),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui');
  return {
    ...actual,
    SegmentedControl: vi.fn(
      ({
        options,
        onValueChange,
      }: {
        options: Array<{ label: string; value: string; disabled?: boolean }>;
        onValueChange: (value: string) => void;
      }) => (
        <div>
          {options.map((option) => (
            <button
              key={option.value}
              role="tab"
              type="button"
              disabled={option.disabled}
              onClick={() => onValueChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    ),
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

vi.mock('@/components/visualization/USDistrictChoroplethMap', () => ({
  USDistrictChoroplethMap: vi.fn(() => <div data-testid="district-map" />),
}));

vi.mock('@/utils/formatPowers', () => ({
  formatBudgetaryImpact: vi.fn((value: number) => ({
    display: Math.abs(value).toFixed(0),
    label: '',
  })),
}));

function createCongressionalDistrictContextMock() {
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
  };
}

describe('SocietyWideOverview chart downloads', () => {
  beforeEach(() => {
    dashboardCardProps.length = 0;
    mockUseCongressionalDistrictData.mockReturnValue(createCongressionalDistrictContextMock());
    vi.clearAllMocks();
  });

  function latestCardProps(filename: string) {
    for (let index = dashboardCardProps.length - 1; index >= 0; index -= 1) {
      if (dashboardCardProps[index].downloadFilename === filename) {
        return dashboardCardProps[index];
      }
    }
    return undefined;
  }

  const output = createMockSocietyWideOutput({
    poverty_by_gender: {
      poverty: {
        male: { baseline: 0.1, reform: 0.09 },
        female: { baseline: 0.2, reform: 0.18 },
      },
      deep_poverty: {
        male: { baseline: 0.03, reform: 0.027 },
        female: { baseline: 0.04, reform: 0.036 },
      },
    },
    poverty_by_race: {
      poverty: {
        white: { baseline: 0.1, reform: 0.09 },
        black: { baseline: 0.2, reform: 0.18 },
        hispanic: { baseline: 0.3, reform: 0.24 },
        other: { baseline: 0.4, reform: 0.36 },
      },
    },
  });

  test('given overview cards then expanded toolbars include default CSV export data', () => {
    render(<SocietyWideOverview output={output} />);

    expect(latestCardProps('budgetary-impact.svg')).toMatchObject({
      csvFilename: 'budgetary-impact.csv',
      csvData: expect.arrayContaining([
        ['Category', 'Budgetary impact (billions)'],
        ['Net impact', 0.001],
      ]),
    });
    expect(latestCardProps('distributional-impact-income-average.svg')).toMatchObject({
      csvFilename: 'distributional-impact-income-average.csv',
      csvData: expect.arrayContaining([['Income decile', 'Average change']]),
    });
    expect(latestCardProps('poverty-impact-by-age.svg')).toMatchObject({
      csvFilename: 'poverty-impact-by-age.csv',
      csvData: expect.arrayContaining([['Age group', 'Baseline', 'Reform', 'Change']]),
    });
    expect(latestCardProps('inequality-impact.svg')).toMatchObject({
      csvFilename: 'inequality-impact.csv',
      csvData: expect.arrayContaining([['Metric', 'Baseline', 'Reform', 'Change']]),
    });

    expect(latestCardProps('winners-losers-income-decile.svg')).toMatchObject({
      csvFilename: 'winners-losers-income-decile.csv',
      csvData: expect.arrayContaining([
        [
          'Income decile',
          'Gain more than 5%',
          'Gain less than 5%',
          'No change',
          'Lose less than 5%',
          'Lose more than 5%',
        ],
        ['All', 0.2, 0.1, 0.6, 0.05, 0.05],
      ]),
    });
  });

  test('given decile mode changes then overview card CSV follows selected mode', () => {
    render(<SocietyWideOverview output={output} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Relative' }));

    expect(latestCardProps('distributional-impact-income-relative.svg')).toMatchObject({
      csvFilename: 'distributional-impact-income-relative.csv',
      csvData: expect.arrayContaining([['Income decile', 'Relative change']]),
    });
  });

  test('given poverty controls change then overview card CSV follows selected breakdown', () => {
    render(<SocietyWideOverview output={output} />);

    fireEvent.click(screen.getByRole('tab', { name: 'By gender' }));
    expect(latestCardProps('poverty-impact-by-gender.svg')).toMatchObject({
      csvFilename: 'poverty-impact-by-gender.csv',
      csvData: expect.arrayContaining([['Sex', 'Baseline', 'Reform', 'Change']]),
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Deep poverty' }));
    expect(latestCardProps('deep-poverty-impact-by-gender.svg')).toMatchObject({
      csvFilename: 'deep-poverty-impact-by-gender.csv',
      csvData: expect.arrayContaining([['Sex', 'Baseline', 'Reform', 'Change']]),
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Regular poverty' }));
    fireEvent.click(screen.getByRole('tab', { name: 'By race' }));
    expect(latestCardProps('poverty-impact-by-race.svg')).toMatchObject({
      csvFilename: 'poverty-impact-by-race.csv',
      csvData: expect.arrayContaining([['Race', 'Baseline', 'Reform', 'Change']]),
    });
  });
});
