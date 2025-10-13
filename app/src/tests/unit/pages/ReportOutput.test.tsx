import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import ReportOutputPage from '@/pages/ReportOutput.page';
import * as useReportDataModule from '@/hooks/useReportData';
import { NormalizedReportData } from '@/hooks/useReportData';
import { mockUSReportOutput } from '@/tests/fixtures/api/economyMocks';
import { mockBaselinePolicy, mockReformPolicy, mockCurrentLawPolicy } from '@/tests/fixtures/pages/report-output/PolicySubPage';
import { mockBaselineSimulation, mockReformSimulation, mockHousehold, mockUserBaselineSimulation, mockUserReformSimulation } from '@/tests/fixtures/pages/report-output/SimulationSubPage';
import { mockUserHousehold } from '@/tests/fixtures/pages/PopulationSubPageMocks';

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

vi.mock('@/pages/report-output/SimulationSubPage', () => ({
  default: vi.fn(({ simulations, policies, households, geographies, userSimulations }) => (
    <div data-testid="simulation-subpage">
      <div>Simulation SubPage Mock</div>
      <div>Simulations: {simulations?.length || 0}</div>
      <div>Policies: {policies?.length || 0}</div>
      <div>Households: {households?.length || 0}</div>
      <div>Geographies: {geographies?.length || 0}</div>
      <div>User Simulations: {userSimulations?.length || 0}</div>
    </div>
  )),
}));

vi.mock('@/pages/report-output/PopulationSubPage', () => ({
  default: vi.fn(({ households, geographies, userHouseholds, populationType }) => (
    <div data-testid="population-subpage">
      <div>Population SubPage Mock</div>
      <div>Households: {households?.length || 0}</div>
      <div>Geographies: {geographies?.length || 0}</div>
      <div>User Households: {userHouseholds?.length || 0}</div>
      <div>Population Type: {populationType}</div>
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
  userSimulations: [mockUserBaselineSimulation, mockUserReformSimulation],
  userPolicies: [],
  userHouseholds: [mockUserHousehold],
  isLoading: false,
  error: null,
};

describe('ReportOutputPage - Ingredient Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given complete economy report then includes policy simulation and population tabs', () => {
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
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  test('given complete household report then includes policy simulation and population tabs', () => {
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
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  test('given economy report then does not include old parameters tab', () => {
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
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
  });
});
