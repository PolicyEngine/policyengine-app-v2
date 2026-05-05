import { render } from '@test-utils';
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
      </section>
    );
  }),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

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

  test('given winners and losers overview card then expanded toolbar has CSV export data', () => {
    const output = createMockSocietyWideOutput();

    render(<SocietyWideOverview output={output} />);

    const winnersCardProps = dashboardCardProps.find(
      (props) => props.downloadFilename === 'winners-losers-income-decile.svg'
    );

    expect(winnersCardProps).toMatchObject({
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
        ['All', '0.2', '0.1', '0.6', '0.05', '0.05'],
      ]),
    });
  });
});
