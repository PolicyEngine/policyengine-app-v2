import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import ReportCalculationFrame from '@/frames/report/ReportCalculationFrame';
import {
  mockReportState,
  mockBaselineSimulation,
  mockReformSimulation,
  mockHouseholdSimulation,
  mockHouseholdReformSimulation,
  mockHouseholdResult,
  mockReformHouseholdResult,
  mockEconomyCompletedResponse,
  mockEconomyPendingResponse,
  mockEconomyProcessingResponse,
  mockEconomyErrorResponse,
  createMockFlowProps,
  createMockStore,
  TEST_COUNTRIES,
  ERROR_MESSAGES,
} from '@/tests/fixtures/frames/reportCalculationFrameMocks';

// Mock the hooks
vi.mock('@/hooks/useEconomyCalculation');
vi.mock('@/hooks/useHouseholdCalculation');
vi.mock('@/api/report');

// Import mocked modules
import { useEconomyCalculation } from '@/hooks/useEconomyCalculation';
import { useHouseholdCalculation } from '@/hooks/useHouseholdCalculation';
import { markReportCompleted, markReportError } from '@/api/report';

describe('ReportCalculationFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations
    vi.mocked(markReportCompleted).mockResolvedValue({} as any);
    vi.mocked(markReportError).mockResolvedValue({} as any);
  });

  describe('Economy Calculations', () => {
    test('given economy calculation in queue then displays queue position and progress', () => {
      // Given
      const mockEconomyHook = {
        data: mockEconomyPendingResponse,
        isLoading: true,
        isPending: true,
        isCompleted: false,
        isErrored: false,
        result: null,
        queuePosition: 3,
        calculationError: undefined,
        retry: vi.fn(),
      };
      vi.mocked(useEconomyCalculation).mockReturnValue(mockEconomyHook as any);
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText('Calculating Society-Wide Impact')).toBeInTheDocument();
      expect(screen.getByText('Queue Position: 3')).toBeInTheDocument();
      expect(screen.getByText('Economy-Wide Calculation')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('given economy calculation processing then displays processing message', () => {
      // Given
      const mockEconomyHook = {
        data: mockEconomyProcessingResponse,
        isLoading: true,
        isPending: true,
        isCompleted: false,
        isErrored: false,
        result: null,
        queuePosition: 0,
        calculationError: undefined,
        retry: vi.fn(),
      };
      vi.mocked(useEconomyCalculation).mockReturnValue(mockEconomyHook as any);
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText('Processing your calculation...')).toBeInTheDocument();
      expect(screen.queryByText(/Queue Position:/)).not.toBeInTheDocument();
    });

    test('given economy calculation completes then updates report and navigates', async () => {
      // Given
      const mockNavigate = vi.fn();
      const mockOnSuccess = vi.fn();

      vi.mocked(useEconomyCalculation).mockImplementation((options: any) => {
        // Call onSuccess callback immediately
        if (options.onSuccess && !mockOnSuccess.mock.calls.length) {
          mockOnSuccess.mockImplementation(options.onSuccess);
          setTimeout(() => options.onSuccess(mockEconomyCompletedResponse.result), 0);
        }
        return {
          data: mockEconomyCompletedResponse,
          isLoading: false,
          isPending: false,
          isCompleted: true,
          isErrored: false,
          result: mockEconomyCompletedResponse.result,
          queuePosition: undefined,
          calculationError: undefined,
          retry: vi.fn(),
        } as any;
      });
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps({ onNavigate: mockNavigate });

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockEconomyCompletedResponse.result);
      });

      await waitFor(() => {
        expect(markReportCompleted).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          mockReportState.reportId,
          expect.objectContaining({
            status: 'complete',
            output: mockEconomyCompletedResponse.result,
          })
        );
      });

      // Wait for navigation after 1.5s delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('complete');
      }, { timeout: 2000 });
    });

    test('given economy calculation fails then displays error and retry button', () => {
      // Given
      const mockRetry = vi.fn();
      const mockOnError = vi.fn();

      vi.mocked(useEconomyCalculation).mockImplementation((options: any) => {
        // Call onError callback immediately
        if (options.onError && !mockOnError.mock.calls.length) {
          mockOnError.mockImplementation(options.onError);
          setTimeout(() => options.onError(new Error(ERROR_MESSAGES.ECONOMY_FAILED)), 0);
        }
        return {
          data: mockEconomyErrorResponse,
          isLoading: false,
          isPending: false,
          isCompleted: false,
          isErrored: true,
          result: null,
          queuePosition: undefined,
          calculationError: ERROR_MESSAGES.ECONOMY_FAILED,
          retry: mockRetry,
        } as any;
      });
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText('Calculation Failed')).toBeInTheDocument();
      expect(screen.getByText(ERROR_MESSAGES.ECONOMY_FAILED)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry calculation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Household Calculations', () => {
    test('given household calculation running then displays household-specific UI', () => {
      // Given
      vi.mocked(useEconomyCalculation).mockReturnValue({ data: null, isLoading: false } as any);
      vi.mocked(useHouseholdCalculation).mockReturnValue({
        data: null,
        isLoading: true,
        household: null,
        retry: vi.fn(),
      } as any);

      const store = createMockStore(mockReportState, [mockHouseholdSimulation]);
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText('Calculating Household Impact')).toBeInTheDocument();
      expect(screen.getByText('Household Calculation')).toBeInTheDocument();
      expect(screen.queryByText(/Queue Position/)).not.toBeInTheDocument(); // No queue for household
    });

    test('given baseline-only household calculation then shows baseline only indicator', () => {
      // Given
      vi.mocked(useEconomyCalculation).mockReturnValue({ data: null, isLoading: false } as any);
      vi.mocked(useHouseholdCalculation).mockReturnValue({
        data: mockHouseholdResult,
        isLoading: false,
        household: mockHouseholdResult,
        retry: vi.fn(),
      } as any);

      // Only baseline simulation, no reform
      const store = createMockStore(mockReportState, [mockHouseholdSimulation]);
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText(/Baseline Only/)).toBeInTheDocument();
    });

    test('given household comparison calculation completes then updates report with both results', async () => {
      // Given
      const mockNavigate = vi.fn();

      // Mock baseline calculation
      const baselineHook = {
        data: mockHouseholdResult,
        isLoading: false,
        household: mockHouseholdResult,
        retry: vi.fn(),
      };

      // Mock reform calculation
      const reformHook = {
        data: mockReformHouseholdResult,
        isLoading: false,
        household: mockReformHouseholdResult,
        retry: vi.fn(),
      };

      // Return different values based on policyId
      vi.mocked(useHouseholdCalculation).mockImplementation((options: any) => {
        if (options.policyId === mockHouseholdSimulation.policyId) {
          return baselineHook as any;
        }
        return reformHook as any;
      });

      vi.mocked(useEconomyCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore(mockReportState, [mockHouseholdSimulation, mockHouseholdReformSimulation]);
      const flowProps = createMockFlowProps({ onNavigate: mockNavigate });

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      await waitFor(() => {
        expect(markReportCompleted).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          mockReportState.reportId,
          expect.objectContaining({
            status: 'complete',
            output: mockReformHouseholdResult, // Should use reform result when available
          })
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('complete');
      }, { timeout: 2000 });
    });

    test('given household calculation fails then allows retry', async () => {
      // Given
      const mockRetry = vi.fn();
      const error = new Error(ERROR_MESSAGES.HOUSEHOLD_FAILED);

      vi.mocked(useHouseholdCalculation).mockImplementation((options: any) => {
        if (options.onError) {
          setTimeout(() => options.onError(error), 0);
        }
        return {
          data: null,
          isLoading: false,
          error,
          household: null,
          retry: mockRetry,
        } as any;
      });
      vi.mocked(useEconomyCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore(mockReportState, [mockHouseholdSimulation]);
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.HOUSEHOLD_FAILED)).toBeInTheDocument();
      });

      // When - click retry
      const retryButton = screen.getByRole('button', { name: /retry calculation/i });
      retryButton.click();

      // Then
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Progress Calculations', () => {
    test('given queue position updates then progress bar updates accordingly', async () => {
      // Given
      const mockOnQueueUpdate = vi.fn();

      vi.mocked(useEconomyCalculation).mockImplementation((options: any) => {
        if (options.onQueueUpdate && !mockOnQueueUpdate.mock.calls.length) {
          mockOnQueueUpdate.mockImplementation(options.onQueueUpdate);
          // Simulate queue progression
          setTimeout(() => options.onQueueUpdate(5, 300), 0); // Far back in queue
          setTimeout(() => options.onQueueUpdate(2, 120), 100); // Getting closer
          setTimeout(() => options.onQueueUpdate(0, 240), 200); // Processing
        }
        return {
          data: mockEconomyPendingResponse,
          isLoading: true,
          isPending: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          queuePosition: 5,
          calculationError: undefined,
          retry: vi.fn(),
        } as any;
      });
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps();

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then - verify queue updates are processed correctly
      await waitFor(() => {
        expect(mockOnQueueUpdate).toHaveBeenCalledWith(5, 300);
      });

      await waitFor(() => {
        expect(mockOnQueueUpdate).toHaveBeenCalledWith(2, 120);
      });

      await waitFor(() => {
        expect(mockOnQueueUpdate).toHaveBeenCalledWith(0, 240);
      });
    });
  });

  describe('Navigation', () => {
    test('given user clicks cancel on error then navigates to cancel', () => {
      // Given
      const mockNavigate = vi.fn();
      vi.mocked(useEconomyCalculation).mockReturnValue({
        data: mockEconomyErrorResponse,
        isLoading: false,
        isPending: false,
        isCompleted: false,
        isErrored: true,
        result: null,
        queuePosition: undefined,
        calculationError: ERROR_MESSAGES.ECONOMY_FAILED,
        retry: vi.fn(),
      } as any);
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps({ onNavigate: mockNavigate });

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.click();

      // Then
      expect(mockNavigate).toHaveBeenCalledWith('cancel');
    });

    test('given calculation completes successfully then auto-navigates after delay', async () => {
      // Given
      const mockNavigate = vi.fn();
      vi.mocked(useEconomyCalculation).mockImplementation((options: any) => {
        if (options.onSuccess) {
          setTimeout(() => options.onSuccess(mockEconomyCompletedResponse.result), 0);
        }
        return {
          data: mockEconomyCompletedResponse,
          isLoading: false,
          isPending: false,
          isCompleted: true,
          isErrored: false,
          result: mockEconomyCompletedResponse.result,
          queuePosition: undefined,
          calculationError: undefined,
          retry: vi.fn(),
        } as any;
      });
      vi.mocked(useHouseholdCalculation).mockReturnValue({ data: null, isLoading: false } as any);

      const store = createMockStore();
      const flowProps = createMockFlowProps({ onNavigate: mockNavigate });

      // When
      render(
        <Provider store={store}>
          <ReportCalculationFrame {...flowProps} />
        </Provider>
      );

      // Then
      expect(screen.getByText('Calculation complete! Redirecting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('complete');
      }, { timeout: 2000 });
    });
  });
});