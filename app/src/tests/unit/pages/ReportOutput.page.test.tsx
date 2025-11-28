import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportOutputPage from '@/pages/ReportOutput.page';
import {
  MOCK_REPORT_WITH_YEAR,
  MOCK_SIMULATION_GEOGRAPHY,
  MOCK_SOCIETY_WIDE_OUTPUT,
  MOCK_USER_REPORT,
  MOCK_USER_REPORT_ID,
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
    expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Dynamics')).toBeInTheDocument();
  });
});
