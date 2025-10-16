import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import ReportOutputPage from '@/pages/ReportOutput.page';
import * as useReportDataModule from '@/hooks/useReportData';
import { NormalizedReportData } from '@/hooks/useReportData';
import { mockUSReportOutput } from '@/tests/fixtures/api/economyMocks';
import { mockBaselinePolicy, mockReformPolicy, mockCurrentLawPolicy } from '@/tests/fixtures/pages/report-output/PolicySubPage';
import { mockBaselineSimulation, mockReformSimulation } from '@/tests/fixtures/pages/report-output/PopulationSubPage';
import { mockHousehold, mockUserHousehold } from '@/tests/fixtures/pages/report-output/PopulationSubPage';

// Mock the sub-page components
vi.mock('@/pages/report-output/PolicySubPage', () => ({
  default: vi.fn(({ policies, userPolicies, reportType }) => (
    <div data-testid="policy-subpage">
      <div>Policy SubPage Mock</div>
      <div>Policies: {policies?.length || 0}</div>
      <div>User Policies: {userPolicies?.length || 0}</div>
      <div>Report Type: {reportType}</div>
    </div>
  )),
}));

vi.mock('@/pages/report-output/DynamicsSubPage', () => ({
  default: vi.fn(() => (
    <div data-testid="dynamics-subpage">
      <div>Dynamics SubPage Mock</div>
    </div>
  )),
}));

vi.mock('@/pages/report-output/PopulationSubPage', () => ({
  default: vi.fn(({ baselineSimulation, reformSimulation, households, geographies, userHouseholds }) => (
    <div data-testid="population-subpage">
      <div>Population SubPage Mock</div>
      <div>Baseline Simulation: {baselineSimulation?.id || 'none'}</div>
      <div>Reform Simulation: {reformSimulation?.id || 'none'}</div>
      <div>Households: {households?.length || 0}</div>
      <div>Geographies: {geographies?.length || 0}</div>
      <div>User Households: {userHouseholds?.length || 0}</div>
    </div>
  )),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ reportId: 'user-report-123', subpage: undefined }),
  };
});

// Mock normalized report with all ingredient data
const mockNormalizedReportWithIngredients: NormalizedReportData = {
  userReport: {
    id: 'user-report-123',
    userId: 'user-xyz-789',
    reportId: 'report-456',
    label: 'Test Report',
    createdAt: '2025-01-15T09:00:00Z',
  },
  report: {
    id: 'report-456',
    label: 'Test Report',
    countryId: 'us',
    apiVersion: '1.0',
    simulationIds: ['sim-baseline-abc', 'sim-reform-def'],
    status: 'complete',
    output: null,
  },
  simulations: [mockBaselineSimulation, mockReformSimulation],
  policies: [mockBaselinePolicy, mockReformPolicy, mockCurrentLawPolicy],
  households: [mockHousehold],
  geographies: [],
  userSimulations: [],
  userPolicies: [],
  userHouseholds: [mockUserHousehold],
  isLoading: false,
  error: null,
};

describe('ReportOutputPage - Ingredient Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given complete economy report then includes policy dynamics and population tabs', () => {
    // Given
    vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      status: 'complete',
      output: mockUSReportOutput,
      outputType: 'economy',
      error: null,
      userReport: { label: 'Test Report' },
      normalizedReport: mockNormalizedReportWithIngredients,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    } as any);

    // When
    render(<ReportOutputPage />);

    // Then
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Dynamics')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  test('given complete household report then includes dynamics policy and population tabs', () => {
    // Given
    vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      status: 'complete',
      output: { earnings: { '2025': 50000 } },
      outputType: 'household',
      error: null,
      userReport: { label: 'Test Report' },
      normalizedReport: mockNormalizedReportWithIngredients,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    } as any);

    // When
    render(<ReportOutputPage />);

    // Then
    expect(screen.getByText('Dynamics')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  test('given economy report then does not include simulation tab', () => {
    // Given
    vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      status: 'complete',
      output: mockUSReportOutput,
      outputType: 'economy',
      error: null,
      userReport: { label: 'Test Report' },
      normalizedReport: mockNormalizedReportWithIngredients,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    } as any);

    // When
    render(<ReportOutputPage />);

    // Then
    expect(screen.queryByText('Simulation')).not.toBeInTheDocument();
  });
});
