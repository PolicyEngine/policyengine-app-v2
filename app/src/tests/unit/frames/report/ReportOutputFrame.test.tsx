import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import ReportOutputFrame from '@/frames/report/ReportOutputFrame';
import * as useReportOutputModule from '@/hooks/useReportOutput';
import {
  MOCK_REPORT_ID,
  mockEconomyReportData,
  mockHouseholdReportData,
  mockPendingReportOutput,
  mockPendingWithQueuePosition,
  mockPendingWithProgress,
  mockPendingPartialProgress,
  mockCompleteEconomyReportOutput,
  mockCompleteHouseholdReportOutput,
  mockErrorReportOutput,
  mockErrorObjectReportOutput,
} from '@/tests/fixtures/frames/reportOutputFrameMocks';

// Mock React Router
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock the useReportOutput hook
vi.mock('@/hooks/useReportOutput');

describe('ReportOutputFrame', () => {
  const mockReportId = MOCK_REPORT_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to having a reportId
    mockUseParams.mockReturnValue({ reportId: mockReportId });
  });

  describe('Component rendering', () => {
    test('given no reportId then displays error message', () => {
      // Given
      mockUseParams.mockReturnValue({});

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Missing Report ID')).toBeInTheDocument();
      expect(screen.getByText('No report ID was provided. Please go back and create a report first.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    test('given no reportId when clicking go back then navigates back', async () => {
      // Given
      mockUseParams.mockReturnValue({});
      const user = userEvent.setup();
      render(<ReportOutputFrame />);

      // When
      await user.click(screen.getByRole('button', { name: /go back/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('given reportId then renders ReportOutputView', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingReportOutput
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Report Results')).toBeInTheDocument();
      expect(screen.getByText(`Report #${mockReportId}`)).toBeInTheDocument();
    });
  });

  describe('Status states', () => {
    test('given pending status then shows loading display', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingReportOutput
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Please wait while we process your report...')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Processing calculation...')).toBeInTheDocument();
      expect(screen.getByText(/Your calculation is being processed/)).toBeInTheDocument();
    });

    test('given complete status with data then shows results', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockCompleteEconomyReportOutput
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      // Check the badge shows Complete
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Society-Wide Impact Results')).toBeInTheDocument();
      expect(screen.getByText('Budget Impact')).toBeInTheDocument();
      expect(screen.getByText('$1.00B')).toBeInTheDocument();
      expect(screen.getByText('Cost to government')).toBeInTheDocument();
      expect(screen.getByText('Poverty Impact')).toBeInTheDocument();
      expect(screen.getByText('-5.00% change in poverty rate')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to report view/i })).toBeInTheDocument();
    });

    test('given complete status when clicking continue then navigates to report', async () => {
      // Given
      const user = userEvent.setup();
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'complete',
        data: { budget: { budgetary_impact: 0 } },
        isPending: false,
        error: null,
      });

      render(<ReportOutputFrame />);

      // When
      await user.click(screen.getByRole('button', { name: /continue to report view/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(`/reports/${mockReportId}`);
    });

    test('given error status then shows error display', () => {
      // Given
      const errorMessage = 'Calculation failed due to timeout';
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockErrorReportOutput(errorMessage)
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Calculation encountered an error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Calculation Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    test('given error status when clicking go back then navigates back', async () => {
      // Given
      const user = userEvent.setup();
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Some error',
      });

      render(<ReportOutputFrame />);

      // When
      await user.click(screen.getByRole('button', { name: /go back/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('given error object then displays error message', () => {
      // Given
      const errorObject = { message: 'Network timeout error' };
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockErrorObjectReportOutput(errorObject)
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Network timeout error')).toBeInTheDocument();
    });

    test('given household result then shows household results', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockCompleteHouseholdReportOutput
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Household Impact Results')).toBeInTheDocument();
      expect(screen.queryByText('Society-Wide Impact Results')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced loading display', () => {
    test('given pending with queue position then shows queue information', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingWithQueuePosition
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      // The message "Waiting in queue..." is displayed instead of "Queue position: 3"
      // because the message field takes precedence in the component
      expect(screen.getByText('Waiting in queue...')).toBeInTheDocument();
      expect(screen.getByText(/Your calculation is queued/)).toBeInTheDocument();
      expect(screen.getByText(/position 3 in the queue/)).toBeInTheDocument();
      expect(screen.getByText('Estimated time remaining: 45 seconds')).toBeInTheDocument();
    });

    test('given pending with progress then shows progress information', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingWithProgress
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Processing household calculation...')).toBeInTheDocument();
      expect(screen.getByText('Estimated time remaining: 5 seconds')).toBeInTheDocument();
      // Check that queue position is NOT shown
      expect(screen.queryByText(/Queue position/)).not.toBeInTheDocument();
    });

    test('given pending with partial progress then handles gracefully', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingPartialProgress
      );

      // When
      render(<ReportOutputFrame />);

      // Then
      // Should show default message when no custom message
      expect(screen.getByText('Processing calculation...')).toBeInTheDocument();
      // Should not show estimated time if not provided
      expect(screen.queryByText(/Estimated time remaining/)).not.toBeInTheDocument();
    });

    test('given long estimated time then formats as minutes', () => {
      // Given
      const mockLongWait = {
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        estimatedTimeRemaining: 180000, // 3 minutes
      } as any;
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(mockLongWait);

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Estimated time remaining: 3 minutes')).toBeInTheDocument();
    });

    test('given one minute wait then shows singular minute', () => {
      // Given
      const mockOneMinute = {
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        estimatedTimeRemaining: 60000, // 1 minute
      } as any;
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(mockOneMinute);

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Estimated time remaining: 1 minute')).toBeInTheDocument();
    });

    test('given queue position without message then shows queue position text', () => {
      // Given
      const mockQueueNoMessage = {
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        queuePosition: 5,
      } as any;
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(mockQueueNoMessage);

      // When
      render(<ReportOutputFrame />);

      // Then
      expect(screen.getByText('Queue position: 5')).toBeInTheDocument();
      expect(screen.getByText(/position 5 in the queue/)).toBeInTheDocument();
    });
  });

  describe('Badge colors', () => {
    test('given pending status then shows blue badge', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
      });

      // When
      render(<ReportOutputFrame />);

      // Then
      const badge = screen.getByText('Processing');
      expect(badge.closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'light');
    });

    test('given complete status then shows green badge', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'complete',
        data: {},
        isPending: false,
        error: null,
      });

      // When
      render(<ReportOutputFrame />);

      // Then
      const badge = screen.getByText('Complete');
      expect(badge.closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'light');
    });

    test('given error status then shows red badge', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Error',
      });

      // When
      render(<ReportOutputFrame />);

      // Then
      const badge = screen.getByText('Error', { selector: '.mantine-Badge-label' });
      expect(badge.closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'light');
    });
  });
});