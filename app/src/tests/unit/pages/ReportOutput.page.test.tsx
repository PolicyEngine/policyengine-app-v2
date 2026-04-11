import { render, screen, userEvent } from '@test-utils';
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

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
let mockLocation = {
  pathname: `/us/report-output/${MOCK_USER_REPORT_ID}/overview`,
  search: '',
};

// Mock dependencies
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/contexts/NavigationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/NavigationContext')>(
    '@/contexts/NavigationContext'
  );
  return {
    ...actual,
    useAppNavigate: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
  };
});

vi.mock('@/contexts/LocationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LocationContext')>(
    '@/contexts/LocationContext'
  );
  return {
    ...actual,
    useAppLocation: () => mockLocation,
  };
});

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

vi.mock('@/hooks/household', () => ({
  useSimulationProgressDisplay: vi.fn(() => ({
    displayProgress: 100,
    hasCalcStatus: true,
    message: 'Complete',
  })),
  useHouseholdReportOrchestrator: vi.fn(() => ({
    startReport: vi.fn(),
    isCalculating: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: vi.fn(),
}));

vi.mock('@/hooks/useSaveSharedReport', () => ({
  useSaveSharedReport: vi.fn(() => ({
    saveSharedReport: vi.fn(),
    saveResult: null,
    setSaveResult: vi.fn(),
    isPending: false,
  })),
}));

describe('ReportOutputPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = {
      pathname: `/us/report-output/${MOCK_USER_REPORT_ID}/overview`,
      search: '',
    };
  });

  test('given report with year then year is passed to layout', () => {
    // Given - MOCK_REPORT has year '2024'
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - Year should be displayed in the layout
    expect(screen.getByText(/Year: 2024/)).toBeInTheDocument();
  });

  test('given report label then label is displayed', () => {
    // Given
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then
    expect(screen.getByRole('heading', { name: 'Test Report' })).toBeInTheDocument();
  });

  test('given society-wide report with complete calculation then renders without error', () => {
    // Given
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - page renders layout and delegates to society-wide output
    expect(screen.queryByText('Loading report...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading report/)).not.toBeInTheDocument();
  });

  test('given UK national report then renders without error', () => {
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
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - page renders layout and delegates to society-wide output
    expect(screen.queryByText('Loading report...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading report/)).not.toBeInTheDocument();
  });

  test('given UK country-level report (e.g., England) then renders without error', () => {
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
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - page renders layout and delegates to society-wide output
    expect(screen.queryByText('Loading report...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error loading report/)).not.toBeInTheDocument();
  });

  test('given UK subnational constituency report then constituency and local authority content is not shown', () => {
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
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - constituency and local authority content should not be shown
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
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // Then - Constituency and local authority tabs should not be shown
    expect(screen.queryByText('Constituencies')).not.toBeInTheDocument();
    expect(screen.queryByText('Local authorities')).not.toBeInTheDocument();
  });

  test('given cached report data while loading on reproduce then renders without the blocking loading page', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
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
      isLoading: true,
      error: null,
    });

    // When
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="reproduce" />);

    // Then
    expect(screen.getByText(/reproduce these results/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Loading report\.\.\.$/i)).not.toBeInTheDocument();
  });

  test('given cached household report data while loading on reproduce then renders household reproducibility immediately', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue({
      userReport: MOCK_USER_REPORT,
      report: {
        ...MOCK_REPORT_WITH_YEAR,
        label: 'Test Household Report',
        simulationIds: ['sim-household'],
      },
      simulations: [
        {
          id: 'sim-household',
          countryId: 'us' as const,
          populationType: 'household' as const,
          populationId: 'household-1',
          policyId: 'policy-1',
          status: 'complete' as const,
          output: null,
          label: null,
          isCreated: true,
        },
      ],
      userSimulations: [],
      userPolicies: [],
      policies: [],
      households: [
        {
          id: 'household-1',
          countryId: 'us',
          householdData: {},
        },
      ],
      userHouseholds: [],
      geographies: [],
      userGeographies: [],
      isLoading: true,
      error: null,
    });

    // When
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="reproduce" />);

    // Then
    expect(screen.getByText(/reproduce these results/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Loading report\.\.\.$/i)).not.toBeInTheDocument();
  });

  test('given reproduce page then breadcrumb says back to report output', () => {
    // Given
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="reproduce" />);

    // Then
    expect(screen.getByText('Back to report output')).toBeInTheDocument();
  });

  test('given view action then it uses the canonical owned report setup URL', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // When
    await user.click(screen.getByRole('button', { name: /view/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith(`/${'us'}/reports/create/${MOCK_USER_REPORT_ID}`);
  });

  test('given reproduce action then it uses the canonical reproduce URL', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportOutputPage reportId={MOCK_USER_REPORT_ID} subpage="overview" />);

    // When
    await user.click(screen.getByRole('button', { name: /reproduce in python/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith(`/${'us'}/report-output/${MOCK_USER_REPORT_ID}/reproduce`);
  });
});
