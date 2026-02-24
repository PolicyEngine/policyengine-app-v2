import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import {
  MOCK_AGG_STATUS_COMPLETE,
  MOCK_AGG_STATUS_COMPLETE_SINGLE,
  MOCK_AGG_STATUS_ERROR,
  MOCK_AGG_STATUS_IDLE,
  MOCK_AGG_STATUS_INITIALIZING,
  MOCK_AGG_STATUS_PENDING,
  MOCK_HOUSEHOLD,
  MOCK_POLICY_BASELINE,
  MOCK_POLICY_REFORM,
  MOCK_REPORT,
  MOCK_SIMULATION_BASELINE,
  MOCK_SIMULATION_REFORM,
  MOCK_USER_POLICY_BASELINE,
  MOCK_USER_POLICY_REFORM,
} from '@/tests/fixtures/pages/report-output/HouseholdReportOutput';

// Mock hooks
vi.mock('@/hooks/useCalculationStatus');
vi.mock('@/hooks/useStartCalculationOnLoad');

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock subpage components
vi.mock('@/pages/report-output/LoadingPage', () => ({
  default: vi.fn(({ message }: { message?: string; progress?: number }) => (
    <div data-testid="loading-page">{message || 'Loading...'}</div>
  )),
}));

vi.mock('@/pages/report-output/ErrorPage', () => ({
  default: vi.fn(({ error }: { error?: Error }) => (
    <div data-testid="error-page">{error?.message || 'Unknown error'}</div>
  )),
}));

vi.mock('@/pages/report-output/NotFoundSubPage', () => ({
  default: vi.fn(() => <div data-testid="not-found-page">Page Not Found</div>),
}));

vi.mock('@/pages/report-output/OverviewSubPage', () => ({
  default: vi.fn(() => <div data-testid="overview-page">Overview</div>),
}));

vi.mock('@/pages/report-output/PolicySubPage', () => ({
  default: vi.fn(() => <div data-testid="policy-page">Policy</div>),
}));

vi.mock('@/pages/report-output/PopulationSubPage', () => ({
  default: vi.fn(() => <div data-testid="population-page">Population</div>),
}));

vi.mock('@/pages/report-output/DynamicsSubPage', () => ({
  default: vi.fn(() => <div data-testid="dynamics-page">Dynamics</div>),
}));

vi.mock('@/pages/report-output/HouseholdComparativeAnalysisPage', () => ({
  HouseholdComparativeAnalysisPage: vi.fn(() => (
    <div data-testid="comparative-analysis-page">Comparative Analysis</div>
  )),
}));

const mockUseCalculationStatus = useCalculationStatus as ReturnType<typeof vi.fn>;
const mockUseStartCalculationOnLoad = useStartCalculationOnLoad as ReturnType<typeof vi.fn>;

describe('HouseholdReportOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStartCalculationOnLoad.mockReturnValue(undefined);
  });

  test('given data loading then shows loading page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={true}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.getByText('Loading report...')).toBeInTheDocument();
  });

  test('given data error then shows error page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);
    const dataError = new Error('Failed to fetch report');

    // When
    render(
      <HouseholdReportOutput
        report={undefined}
        simulations={undefined}
        isLoading={false}
        error={dataError}
      />
    );

    // Then
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch report')).toBeInTheDocument();
  });

  test('given no report then shows error page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={undefined}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByText('Report not found')).toBeInTheDocument();
  });

  test('given calculation initializing then shows loading status message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_INITIALIZING);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.getByText('Loading calculation status...')).toBeInTheDocument();
  });

  test('given calculation pending then shows computing message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_PENDING);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.getByText('Computing household impacts...')).toBeInTheDocument();
  });

  test('given calculation error then shows error page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_ERROR);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByText('Household calculation failed')).toBeInTheDocument();
  });

  test('given calculation complete with overview subpage then shows overview', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        userPolicies={[MOCK_USER_POLICY_BASELINE, MOCK_USER_POLICY_REFORM]}
        subpage="overview"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('overview-page')).toBeInTheDocument();
  });

  test('given calculation complete with policy subpage then shows policy page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
        userPolicies={[MOCK_USER_POLICY_BASELINE]}
        subpage="policy"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('policy-page')).toBeInTheDocument();
  });

  test('given calculation complete with population subpage then shows population page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        households={[MOCK_HOUSEHOLD]}
        subpage="population"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('population-page')).toBeInTheDocument();
  });

  test('given calculation complete with dynamics subpage then shows dynamics page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE]}
        subpage="dynamics"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('dynamics-page')).toBeInTheDocument();
  });

  test('given calculation complete with comparative-analysis subpage then shows comparative analysis', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
        subpage="comparative-analysis"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('comparative-analysis-page')).toBeInTheDocument();
  });

  test('given invalid subpage then shows not found page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_COMPLETE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        subpage="invalid"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  test('given report loaded then starts calculation on load with simulation-level configs', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        households={[MOCK_HOUSEHOLD]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(mockUseStartCalculationOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        configs: expect.arrayContaining([
          expect.objectContaining({
            calcId: 'sim-1',
            targetType: 'simulation',
            countryId: 'us',
            year: '2024',
            reportId: 'test-report-123',
          }),
        ]),
      })
    );
  });

  test('given multiple simulations then creates config per simulation', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        households={[MOCK_HOUSEHOLD]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    const call = mockUseStartCalculationOnLoad.mock.calls[0][0];
    expect(call.configs).toHaveLength(2);
    expect(call.configs[0].calcId).toBe('sim-1');
    expect(call.configs[1].calcId).toBe('sim-2');
  });

  test('given useCalculationStatus called then passes simulation IDs with simulation target type', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(mockUseCalculationStatus).toHaveBeenCalledWith(['sim-1', 'sim-2'], 'simulation');
  });

  test('given idle status then shows not found page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_AGG_STATUS_IDLE);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  test('given complete single sim with no output then shows not found', () => {
    // Given - complete but with null results in the response
    const nullResponse: HouseholdImpactResponse = {
      report_id: 'test-report',
      report_type: 'household',
      status: 'completed',
      baseline_simulation: null,
      reform_simulation: null,
      baseline_result: null,
      reform_result: null,
      impact: null,
      error_message: null,
    };
    const completeNoOutput = {
      ...MOCK_AGG_STATUS_COMPLETE_SINGLE,
      calculations: [
        {
          status: 'complete' as const,
          result: nullResponse,
          metadata: {
            calcId: 'sim-1',
            targetType: 'simulation' as const,
            calcType: 'household' as const,
            startedAt: Date.now(),
          },
        },
      ],
    };
    mockUseCalculationStatus.mockReturnValue(completeNoOutput);

    // When
    render(
      <HouseholdReportOutput
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });
});
