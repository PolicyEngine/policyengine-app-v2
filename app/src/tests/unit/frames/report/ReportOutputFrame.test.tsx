import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import ReportOutputFrame from '@/frames/report/ReportOutputFrame';
import * as useReportOutputModule from '@/hooks/useReportOutput';
import {
  MOCK_REPORT_ID,
  mockEconomyReportData,
  mockHouseholdReportData,
  mockPendingReportOutput,
  mockCompleteEconomyReportOutput,
  mockCompleteHouseholdReportOutput,
  mockErrorReportOutput,
  mockErrorObjectReportOutput,
  createDefaultFrameProps,
} from '@/tests/fixtures/frames/reportOutputFrameMocks';

// Mock the useReportOutput hook
vi.mock('@/hooks/useReportOutput');

describe('ReportOutputFrame', () => {
  const mockOnNavigate = vi.fn();
  const mockOnReturn = vi.fn();
  const mockReportId = MOCK_REPORT_ID;

  // Helper to create props with custom route
  const createProps = (route?: any) => {
    const props = createDefaultFrameProps(route);
    props.onNavigate = mockOnNavigate;
    props.onReturn = mockOnReturn;
    return props;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component rendering', () => {
    test('given no reportId then displays error message', () => {
      // Given
      const props = createProps({
        params: {},
      });

      // When
      render(<ReportOutputFrame {...props} />);

      // Then
      expect(screen.getByText('Missing Report ID')).toBeInTheDocument();
      expect(screen.getByText('No report ID was provided. Please go back and create a report first.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    test('given no reportId when clicking go back then navigates back', () => {
      // Given
      const props = createProps({
        params: {},
      });
      render(<ReportOutputFrame {...props} />);

      // When
      const backButton = screen.getByRole('button', { name: /go back/i });
      backButton.click();

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('back');
    });

    test('given reportId then renders ReportOutputView', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockPendingReportOutput
      );

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

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

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

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

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

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

    test('given complete status when clicking continue then navigates next', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'complete',
        data: { budget: { budgetary_impact: 0 } },
        isPending: false,
        error: null,
      });

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      render(<ReportOutputFrame {...props} />);

      // When
      const continueButton = screen.getByRole('button', { name: /continue to report view/i });
      continueButton.click();

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('next');
    });

    test('given error status then shows error display', () => {
      // Given
      const errorMessage = 'Calculation failed due to timeout';
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockErrorReportOutput(errorMessage)
      );

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

      // Then
      expect(screen.getByText('Calculation encountered an error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Calculation Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    test('given error status when clicking go back then navigates back', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Some error',
      });

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      render(<ReportOutputFrame {...props} />);

      // When
      const backButton = screen.getByRole('button', { name: /go back/i });
      backButton.click();

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('back');
    });

    test('given error object then displays error message', () => {
      // Given
      const errorObject = { message: 'Network timeout error' };
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockErrorObjectReportOutput(errorObject)
      );

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

      // Then
      expect(screen.getByText('Network timeout error')).toBeInTheDocument();
    });

    test('given household result then shows household results', () => {
      // Given
      vi.spyOn(useReportOutputModule, 'useReportOutput').mockReturnValue(
        mockCompleteHouseholdReportOutput
      );

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

      // Then
      expect(screen.getByText('Household Impact Results')).toBeInTheDocument();
      expect(screen.queryByText('Society-Wide Impact Results')).not.toBeInTheDocument();
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

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

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

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

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

      const props = createProps({
        params: {
          reportId: mockReportId,
        },
      });

      // When
      render(<ReportOutputFrame {...props} />);

      // Then
      const badge = screen.getByText('Error', { selector: '.mantine-Badge-label' });
      expect(badge.closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'light');
    });
  });
});