import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { useReportOutput } from '@/hooks/useReportOutput';
import { useUserReportByUserReportId } from '@/hooks/useUserReportAssociations';
import { useUserReportById } from '@/hooks/useUserReports';
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

// Mock hooks
vi.mock('@/hooks/useUserReportAssociations', () => ({
  useUserReportByUserReportId: vi.fn(),
}));

vi.mock('@/hooks/useReportOutput', () => ({
  useReportOutput: vi.fn(),
}));

vi.mock('@/hooks/useUserReports', () => ({
  useUserReportById: vi.fn(),
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

    // Set default mock implementations
    (useUserReportByUserReportId as any).mockReturnValue({
      data: mockUserReport,
      isLoading: false,
      error: null,
    });

    (useReportOutput as any).mockReturnValue({
      status: 'complete',
      data: mockEconomyOutput,
      error: null,
    });

    (useUserReportById as any).mockReturnValue({
      report: mockReportData,
    });

    // Mock queryClient.getQueryData for metadata
    queryClient.setQueryData(['calculation-meta', 'base-report-456'], {
      type: 'economy',
      countryId: 'us',
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
    (useUserReportByUserReportId as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
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
    (useUserReportByUserReportId as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
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
    (useReportOutput as any).mockReturnValue({
      status: 'pending',
      data: null,
      error: null,
      progress: 50,
      message: 'Calculating...',
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
    (useReportOutput as any).mockReturnValue({
      status: 'error',
      data: null,
      error: new Error('Calculation failed'),
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

  test('given user report ID then fetches UserReport first then base report', async () => {
    // When
    renderWithClient(<ReportOutputPage />);

    // Then
    await waitFor(() => {
      expect(useUserReportByUserReportId).toHaveBeenCalledWith('sur-test123');
    });

    expect(useReportOutput).toHaveBeenCalledWith({ reportId: 'base-report-456' });
    expect(useUserReportById).toHaveBeenCalledWith(MOCK_USER_ID.toString(), 'base-report-456');
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
    (useUserReportByUserReportId as any).mockReturnValue({
      data: customUserReport,
      isLoading: false,
      error: null,
    });
    (useUserReportById as any).mockReturnValue({
      report: customReportData,
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
    (useUserReportByUserReportId as any).mockReturnValue({
      data: userReportWithoutLabel,
      isLoading: false,
      error: null,
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
    (useReportOutput as any).mockReturnValue({
      status: 'complete',
      data: mockHouseholdData,
      error: null,
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
