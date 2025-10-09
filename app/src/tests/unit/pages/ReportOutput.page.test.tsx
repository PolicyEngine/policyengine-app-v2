import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportData } from '@/hooks/useReportData';
import ReportOutputPage from '@/pages/ReportOutput.page';
import {
  mockEconomyOutput,
  mockHouseholdData,
  mockReportData,
  mockUserReport,
} from '@/tests/fixtures/pages/reportOutputMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { reportId: 'sur-test123', subpage: undefined };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock useReportData hook
vi.mock('@/hooks/useReportData', () => ({
  useReportData: vi.fn(),
}));

// Mock subpage components
vi.mock('@/pages/report-output/OverviewSubPage', () => ({
  default: vi.fn(() => <div data-testid="overview-subpage">Overview</div>),
}));

vi.mock('@/pages/report-output/LoadingPage', () => ({
  default: vi.fn(({ message }: { message?: string }) => (
    <div data-testid="loading-subpage">{message || 'Loading...'}</div>
  )),
}));

vi.mock('@/pages/report-output/ErrorPage', () => ({
  default: vi.fn(({ error }: { error?: Error }) => (
    <div data-testid="error-subpage">Error: {error?.message || 'Unknown error'}</div>
  )),
}));

vi.mock('@/pages/report-output/NotFoundSubPage', () => ({
  default: vi.fn(() => <div data-testid="not-found-subpage">Not Found</div>),
}));

describe('ReportOutputPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Set default mock implementation for useReportData
    (useReportData as any).mockReturnValue({
      status: 'complete',
      output: mockEconomyOutput,
      outputType: 'economy',
      error: null,
      normalizedReport: { report: mockReportData },
      userReport: mockUserReport,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  test('given valid user report ID when rendering then displays report output', async () => {
    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('Test Report')).toBeInTheDocument();
    });
  });

  test('given no user report ID when rendering then shows error', () => {
    // Given
    mockParams.reportId = undefined as any;

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    expect(screen.getByText('Error: Report ID is required')).toBeInTheDocument();

    // Reset
    mockParams.reportId = 'sur-test123';
  });

  test('given user report not found when rendering then shows error page', async () => {
    // Given
    (useReportData as any).mockReturnValue({
      status: 'error',
      output: null,
      outputType: undefined,
      error: new Error('Not found'),
      normalizedReport: { report: undefined },
      userReport: undefined,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('error-subpage')).toBeInTheDocument();
      expect(screen.getByText(/Error: Not found/)).toBeInTheDocument();
    });
  });

  test('given user report loading when rendering then shows loading page', async () => {
    // Given
    (useReportData as any).mockReturnValue({
      status: 'pending',
      output: null,
      outputType: undefined,
      error: undefined,
      normalizedReport: { report: undefined },
      userReport: undefined,
      progress: undefined,
      message: 'Loading report...',
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('loading-subpage')).toBeInTheDocument();
      expect(screen.getByText('Loading report...')).toBeInTheDocument();
    });
  });

  test('given report output pending when rendering then shows loading page', async () => {
    // Given
    (useReportData as any).mockReturnValue({
      status: 'pending',
      output: null,
      outputType: undefined,
      error: null,
      normalizedReport: { report: mockReportData },
      userReport: mockUserReport,
      progress: 50,
      message: 'Calculating...',
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('loading-subpage')).toBeInTheDocument();
    });
  });

  test('given report output error when rendering then shows error page', async () => {
    // Given
    (useReportData as any).mockReturnValue({
      status: 'error',
      output: null,
      outputType: undefined,
      error: new Error('Calculation failed'),
      normalizedReport: { report: undefined },
      userReport: undefined,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('error-subpage')).toBeInTheDocument();
      expect(screen.getByText(/Error: Calculation failed/)).toBeInTheDocument();
    });
  });

  test('given complete report when rendering then shows overview page', async () => {
    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('overview-subpage')).toBeInTheDocument();
    });
  });

  test('given user report ID then fetches report data', async () => {
    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(useReportData).toHaveBeenCalledWith('sur-test123');
    });
  });

  test('given user report with custom label then displays custom label', async () => {
    // Given
    const customUserReport = {
      ...mockUserReport,
      label: 'My Custom Report Name',
    };
    const customReportData = {
      ...mockReportData,
      label: 'My Custom Report Name',
    };
    (useReportData as any).mockReturnValue({
      status: 'complete',
      output: mockEconomyOutput,
      outputType: 'economy',
      error: null,
      normalizedReport: { report: customReportData },
      userReport: customUserReport,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('My Custom Report Name')).toBeInTheDocument();
    });
  });

  test('given user report without label then displays user report ID', async () => {
    // Given
    const userReportWithoutLabel = {
      ...mockUserReport,
      label: undefined,
    };
    (useReportData as any).mockReturnValue({
      status: 'complete',
      output: mockEconomyOutput,
      outputType: 'economy',
      error: null,
      normalizedReport: { report: mockReportData },
      userReport: userReportWithoutLabel,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('sur-test123')).toBeInTheDocument();
    });
  });

  test('given household output type then renders household data correctly', async () => {
    // Given
    (useReportData as any).mockReturnValue({
      status: 'complete',
      output: {
        id: 'base-report-456',
        countryId: 'us',
        householdData: mockHouseholdData,
      },
      outputType: 'household',
      error: null,
      normalizedReport: { report: mockReportData },
      userReport: mockUserReport,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    });

    queryClient.setQueryData(['calculation-meta', 'base-report-456'], {
      type: 'household',
      countryId: 'us',
    });

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('overview-subpage')).toBeInTheDocument();
    });
  });

  test('given navigation to different subpage then redirects to overview when complete', async () => {
    // Given
    mockParams.subpage = undefined;

    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('overview', { replace: true });
    });
  });
});
