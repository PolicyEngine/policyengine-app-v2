import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useReportProgressDisplay } from '@/hooks/useReportProgressDisplay';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { SocietyWideReportOutput } from '@/pages/report-output/SocietyWideReportOutput';
import {
  MOCK_CALC_STATUS_COMPLETE,
  MOCK_CALC_STATUS_ERROR,
  MOCK_CALC_STATUS_IDLE,
  MOCK_CALC_STATUS_INITIALIZING,
  MOCK_CALC_STATUS_PENDING,
  MOCK_GEOGRAPHY,
  MOCK_POLICY_BASELINE,
  MOCK_POLICY_REFORM,
  MOCK_REPORT,
  MOCK_SIMULATION_BASELINE,
  MOCK_SIMULATION_REFORM,
  MOCK_USER_POLICY,
} from '@/tests/fixtures/pages/report-output/SocietyWideReportOutput';

// Mock hooks
vi.mock('@/hooks/useCalculationStatus');
vi.mock('@/hooks/useReportProgressDisplay');
vi.mock('@/hooks/useStartCalculationOnLoad');
// Mock subpage components with inline mocks to avoid hoisting issues
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
  default: vi.fn(() => <div data-testid="overview-page">Cost</div>),
}));

vi.mock('@/pages/report-output/MigrationSubPage', () => ({
  default: vi.fn(() => <div data-testid="migration-page">Migration</div>),
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

const mockUseCalculationStatus = useCalculationStatus as ReturnType<typeof vi.fn>;
const mockUseReportProgressDisplay = useReportProgressDisplay as ReturnType<typeof vi.fn>;
const mockUseStartCalculationOnLoad = useStartCalculationOnLoad as ReturnType<typeof vi.fn>;

describe('SocietyWideReportOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportProgressDisplay.mockReturnValue({
      displayProgress: 0,
      hasCalcStatus: false,
      message: undefined,
    });
    mockUseStartCalculationOnLoad.mockReturnValue(undefined);
  });

  test('given no report then shows error message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_IDLE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={undefined}
        simulations={[MOCK_SIMULATION_BASELINE]}
        subpage="overview"
      />
    );

    // Then
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByText('Report not found')).toBeInTheDocument();
  });

  test('given calculation initializing then shows loading status message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_INITIALIZING);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.getByText('Loading calculation status...')).toBeInTheDocument();
  });

  test('given calculation pending then shows computing message with progress', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_PENDING);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.getByText('Computing society-wide impacts...')).toBeInTheDocument();
  });

  test('given calculation error then shows error message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_ERROR);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByText('Calculation failed')).toBeInTheDocument();
  });

  test('given calculation complete then shows migration subpage with output', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_COMPLETE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="migration"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
        userPolicies={[MOCK_USER_POLICY]}
        geographies={[MOCK_GEOGRAPHY]}
      />
    );

    // Then
    expect(screen.getByTestId('migration-page')).toBeInTheDocument();
  });

  test('given no output yet then shows not found message', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_IDLE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  test('given report loaded then starts calculation on load', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_IDLE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(mockUseStartCalculationOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        configs: expect.arrayContaining([
          expect.objectContaining({
            calcId: 'test-report-123',
            targetType: 'report',
            countryId: 'us',
          }),
        ]),
      })
    );
  });

  test('given policy subpage then shows policy page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_COMPLETE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="policy"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
        userPolicies={[MOCK_USER_POLICY]}
      />
    );

    // Then
    expect(screen.getByTestId('policy-page')).toBeInTheDocument();
  });

  test('given population subpage then shows population page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_COMPLETE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="population"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM]}
        geographies={[MOCK_GEOGRAPHY]}
      />
    );

    // Then
    expect(screen.getByTestId('population-page')).toBeInTheDocument();
  });

  test('given dynamics subpage then shows dynamics page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_COMPLETE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="dynamics"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
        userPolicies={[MOCK_USER_POLICY]}
      />
    );

    // Then
    expect(screen.getByTestId('dynamics-page')).toBeInTheDocument();
  });

  test('given reproduce subpage with resolved dataset in report output then uses exact dataset url', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_IDLE);
    const reportWithBundleOutput = {
      ...MOCK_REPORT,
      output: {
        dataset: 'hf://policyengine/policyengine-us-data/enhanced_cps_2024.h5@1.77.0',
        policyengine_version: '3.4.0',
        model_version: '1.634.4',
        data_version: '1.77.0',
      },
    };

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="reproduce"
        report={reportWithBundleOutput}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
      />
    );

    // Then
    expect(
      screen.getByText(/hf:\/\/policyengine\/policyengine-us-data\/enhanced_cps_2024\.h5@1\.77\.0/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolved with policyengine\.py 3\.4\.0/)).toBeInTheDocument();
  });

  test('given reproduce subpage with resolved live result then prefers live bundle over stored output', () => {
    mockUseCalculationStatus.mockReturnValue({
      ...MOCK_CALC_STATUS_COMPLETE,
      result: {
        ...MOCK_CALC_STATUS_COMPLETE.result,
        dataset: 'hf://policyengine/policyengine-us-data/states/CA.h5@1.77.0',
        policyengine_version: '3.5.0',
      },
    });
    const reportWithoutBundleOutput = {
      ...MOCK_REPORT,
      output: null,
    };

    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="reproduce"
        report={reportWithoutBundleOutput}
        simulations={[MOCK_SIMULATION_BASELINE]}
        policies={[MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM]}
      />
    );

    expect(
      screen.getByText(/hf:\/\/policyengine\/policyengine-us-data\/states\/CA\.h5@1\.77\.0/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolved with policyengine\.py 3\.5\.0/)).toBeInTheDocument();
  });

  test('given invalid subpage then shows not found page', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_COMPLETE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        subpage="invalid"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  test('given report with year then year is included in calculation config', () => {
    // Given
    mockUseCalculationStatus.mockReturnValue(MOCK_CALC_STATUS_IDLE);

    // When
    render(
      <SocietyWideReportOutput
        reportId="test-report-123"
        report={MOCK_REPORT}
        simulations={[MOCK_SIMULATION_BASELINE]}
      />
    );

    // Then
    expect(mockUseStartCalculationOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        configs: expect.arrayContaining([
          expect.objectContaining({
            calcId: 'test-report-123',
            targetType: 'report',
            countryId: 'us',
            year: '2024',
          }),
        ]),
      })
    );
  });
});
