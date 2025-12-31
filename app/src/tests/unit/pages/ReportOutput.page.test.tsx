import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useUserReportById } from '@/hooks/useUserReports';
import ReportOutputPage from '@/pages/ReportOutput.page';
import {
  MOCK_GEOGRAPHY_UK_CONSTITUENCY,
  MOCK_GEOGRAPHY_UK_COUNTRY,
  MOCK_GEOGRAPHY_UK_LOCAL_AUTHORITY,
  MOCK_GEOGRAPHY_UK_NATIONAL,
  MOCK_REPORT_UK_NATIONAL,
  MOCK_REPORT_UK_SUBNATIONAL,
  MOCK_REPORT_WITH_YEAR,
  MOCK_SIMULATION_GEOGRAPHY,
  MOCK_SIMULATION_GEOGRAPHY_UK,
  MOCK_SOCIETY_WIDE_OUTPUT,
  MOCK_USER_REPORT,
  MOCK_USER_REPORT_ID,
  MOCK_USER_REPORT_UK,
} from '@/tests/fixtures/pages/ReportOutputPageMocks';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({
      reportId: MOCK_USER_REPORT_ID,
      subpage: 'overview',
      view: undefined,
    }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/hooks/useUserReports', () => ({
  useUserReportById: vi.fn(() => ({
    userReport: MOCK_USER_REPORT,
    report: MOCK_REPORT_WITH_YEAR,
    simulations: [MOCK_SIMULATION_GEOGRAPHY],
    userSimulations: [],
    userPolicies: [],
    policies: [],
    households: [],
    userHouseholds: [],
    geographies: [],
    userGeographies: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useUserReportAssociations', () => ({
  useUpdateReportAssociation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useCreateReportAssociation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useSharedReportData', () => ({
  useSharedReportData: vi.fn(() => ({
    report: undefined,
    simulations: [],
    policies: [],
    households: [],
    geographies: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock calculation hooks
vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: vi.fn(() => ({
    status: 'complete',
    isInitializing: false,
    isPending: false,
    isComplete: true,
    isError: false,
    result: MOCK_SOCIETY_WIDE_OUTPUT,
    error: null,
  })),
}));

vi.mock('@/hooks/useReportProgressDisplay', () => ({
  useReportProgressDisplay: vi.fn(() => ({
    displayProgress: 100,
    hasCalcStatus: true,
    message: 'Complete',
  })),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: vi.fn(),
}));

describe('ReportOutputPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given report with year then year is passed to layout', () => {
    // Given - MOCK_REPORT has year '2024'
    render(<ReportOutputPage />);

    // Then - Year should be displayed in the layout
    expect(screen.getByText(/Year: 2024/)).toBeInTheDocument();
  });

  test('given report label then label is displayed', () => {
    // Given
    render(<ReportOutputPage />);

    // Then
    expect(screen.getByRole('heading', { name: 'Test Report' })).toBeInTheDocument();
  });

  test('given society-wide report then overview tabs are shown', () => {
    // Given
    render(<ReportOutputPage />);

    // Then
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Comparative analysis')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Dynamics')).toBeInTheDocument();
  });

  test('given UK national report then constituency and local authority tabs are shown', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
      userReport: MOCK_USER_REPORT_UK,
      report: MOCK_REPORT_UK_NATIONAL,
      simulations: [MOCK_SIMULATION_GEOGRAPHY_UK],
      userSimulations: [],
      userPolicies: [],
      policies: [],
      households: [],
      userHouseholds: [],
      geographies: [MOCK_GEOGRAPHY_UK_NATIONAL],
      userGeographies: [],
      isLoading: false,
      error: null,
    });

    // When
    render(<ReportOutputPage />);

    // Then
    expect(screen.getByText('Constituencies')).toBeInTheDocument();
    expect(screen.getByText('Local authorities')).toBeInTheDocument();
  });

  test('given UK country-level report (e.g., England) then constituency and local authority tabs are shown', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
      userReport: MOCK_USER_REPORT_UK,
      report: MOCK_REPORT_UK_SUBNATIONAL,
      simulations: [MOCK_SIMULATION_GEOGRAPHY_UK],
      userSimulations: [],
      userPolicies: [],
      policies: [],
      households: [],
      userHouseholds: [],
      geographies: [MOCK_GEOGRAPHY_UK_COUNTRY],
      userGeographies: [],
      isLoading: false,
      error: null,
    });

    // When
    render(<ReportOutputPage />);

    // Then - Country-level reports should still show the maps
    expect(screen.getByText('Constituencies')).toBeInTheDocument();
    expect(screen.getByText('Local authorities')).toBeInTheDocument();
  });

  test('given UK subnational constituency report then constituency and local authority tabs are hidden', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
      userReport: MOCK_USER_REPORT_UK,
      report: MOCK_REPORT_UK_SUBNATIONAL,
      simulations: [MOCK_SIMULATION_GEOGRAPHY_UK],
      userSimulations: [],
      userPolicies: [],
      policies: [],
      households: [],
      userHouseholds: [],
      geographies: [MOCK_GEOGRAPHY_UK_CONSTITUENCY],
      userGeographies: [],
      isLoading: false,
      error: null,
    });

    // When
    render(<ReportOutputPage />);

    // Then - Standard tabs should still be visible
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Comparative analysis')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Dynamics')).toBeInTheDocument();

    // But constituency and local authority tabs should not be shown
    expect(screen.queryByText('Constituencies')).not.toBeInTheDocument();
    expect(screen.queryByText('Local authorities')).not.toBeInTheDocument();
  });

  test('given UK subnational local authority report then constituency and local authority tabs are hidden', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
      userReport: MOCK_USER_REPORT_UK,
      report: MOCK_REPORT_UK_SUBNATIONAL,
      simulations: [MOCK_SIMULATION_GEOGRAPHY_UK],
      userSimulations: [],
      userPolicies: [],
      policies: [],
      households: [],
      userHouseholds: [],
      geographies: [MOCK_GEOGRAPHY_UK_LOCAL_AUTHORITY],
      userGeographies: [],
      isLoading: false,
      error: null,
    });

    // When
    render(<ReportOutputPage />);

    // Then - Constituency and local authority tabs should not be shown
    expect(screen.queryByText('Constituencies')).not.toBeInTheDocument();
    expect(screen.queryByText('Local authorities')).not.toBeInTheDocument();
  });
});
