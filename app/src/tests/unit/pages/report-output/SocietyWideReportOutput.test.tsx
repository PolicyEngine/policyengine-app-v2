import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { useUserReportById } from '@/hooks/useUserReports';
import { SocietyWideReportOutput } from '@/pages/report-output/SocietyWideReportOutput';
import {
  mockSocietyWideReport,
  mockSocietyWideSimulation,
} from '@/tests/fixtures/pages/reportOutputMocks';

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ reportId: 'test-report-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock hooks
vi.mock('@/hooks/useUserReports');
vi.mock('@/hooks/useCalculationStatus');
vi.mock('@/hooks/useStartCalculationOnLoad');

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

const mockUseUserReportById = useUserReportById as ReturnType<typeof vi.fn>;
const mockUseCalculationStatus = useCalculationStatus as ReturnType<typeof vi.fn>;
const mockUseStartCalculationOnLoad = useStartCalculationOnLoad as ReturnType<typeof vi.fn>;

describe('SocietyWideReportOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStartCalculationOnLoad.mockReturnValue(undefined);
  });

  test('given loading state then shows loading message', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: undefined,
      simulations: undefined,
      isLoading: true,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'initializing',
      isInitializing: true,
      isPending: false,
      isComplete: false,
      isError: false,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Loading report...')).toBeInTheDocument();
  });

  test('given error loading report then shows error message', () => {
    // Given
    const error = new Error('Failed to load report');
    mockUseUserReportById.mockReturnValue({
      report: null,
      simulations: null,
      isLoading: false,
      error,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'idle',
      isInitializing: false,
      isPending: false,
      isComplete: false,
      isError: false,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Failed to load report')).toBeInTheDocument();
  });

  test('given calculation initializing then shows loading status message', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'initializing',
      isInitializing: true,
      isPending: false,
      isComplete: false,
      isError: false,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Loading calculation status...')).toBeInTheDocument();
  });

  test('given calculation pending then shows computing message with progress', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'pending',
      isInitializing: false,
      isPending: true,
      isComplete: false,
      isError: false,
      progress: 50,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Computing society-wide impacts...')).toBeInTheDocument();
  });

  test('given calculation error then shows error message', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'error',
      isInitializing: false,
      isPending: false,
      isComplete: false,
      isError: true,
      error: { message: 'Calculation failed', code: 'CALC_ERROR', retryable: true },
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Calculation failed')).toBeInTheDocument();
  });

  test('given calculation complete then shows overview with output', async () => {
    // Given
    const mockOutput = {
      budget: { budgetary_impact: 1000000 },
      poverty: { poverty: { all: { baseline: 0.1, reform: 0.09 } } },
      intra_decile: {
        all: {
          'Gain more than 5%': 0.2,
          'Gain less than 5%': 0.1,
          'Lose more than 5%': 0.05,
          'Lose less than 5%': 0.05,
        },
      },
    };

    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'complete',
      isInitializing: false,
      isPending: false,
      isComplete: true,
      isError: false,
      result: mockOutput,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    await waitFor(() => {
      // Overview component should render with the output data
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });
  });

  test('given no output yet then shows not found message', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'idle',
      isInitializing: false,
      isPending: false,
      isComplete: false,
      isError: false,
      result: null,
    });

    // When
    render(<SocietyWideReportOutput />);

    // Then
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  test('given report loaded then starts calculation on load', () => {
    // Given
    mockUseUserReportById.mockReturnValue({
      report: mockSocietyWideReport,
      simulations: [mockSocietyWideSimulation],
      isLoading: false,
      error: null,
    });
    mockUseCalculationStatus.mockReturnValue({
      status: 'idle',
      isInitializing: false,
      isPending: false,
      isComplete: false,
      isError: false,
    });

    // When
    render(<SocietyWideReportOutput />);

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
});
