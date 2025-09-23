import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '@test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportCalculationFrame from '@/frames/report/ReportCalculationFrame';
import { useReportCalculation } from '@/hooks/useReportCalculation';
import { useUserEconomyCalculations } from '@/hooks/useUserEconomyCalculations';
import { useUserHouseholdCalculations } from '@/hooks/useUserHouseholdCalculations';
import {
  createMockCalculationProgress,
  createMockEconomyCalculations,
  createMockHouseholdCalculations,
  createMockFlowProps,
  TEST_COUNTRIES,
  ERROR_MESSAGES,
} from '@/tests/fixtures/frames/reportCalculationFrameMocks';

// Mock the hooks
vi.mock('@/hooks/useReportCalculation');
vi.mock('@/hooks/useUserEconomyCalculations');
vi.mock('@/hooks/useUserHouseholdCalculations');

const mockUseReportCalculation = vi.mocked(useReportCalculation);
const mockUseUserEconomyCalculations = vi.mocked(useUserEconomyCalculations);
const mockUseUserHouseholdCalculations = vi.mocked(useUserHouseholdCalculations);

describe('ReportCalculationFrame', () => {
  let queryClient: QueryClient;
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  describe('Dashboard Mode (no navigation params)', () => {
    beforeEach(() => {
      mockUseUserEconomyCalculations.mockReturnValue({
        calculations: [],
        pendingCount: 0,
        completedCount: 0,
        erroredCount: 0,
        pendingCalculations: [],
        completedCalculations: [],
        erroredCalculations: [],
        totalCount: 0,
        getCalculationByIds: vi.fn(),
        invalidateCalculation: vi.fn(),
        removeCalculation: vi.fn(),
      });

      mockUseUserHouseholdCalculations.mockReturnValue({
        calculations: [],
        pendingCount: 0,
        completedCount: 0,
        erroredCount: 0,
        pendingCalculations: [],
        completedCalculations: [],
        erroredCalculations: [],
        totalCount: 0,
        getCalculationByIds: vi.fn(),
        invalidateCalculation: vi.fn(),
        removeCalculation: vi.fn(),
      });
    });

    test('given no navigation params then displays dashboard view', () => {
      // Given
      const flowProps = createMockFlowProps();

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} />);

      // Then
      expect(screen.getByText('All Calculations')).toBeInTheDocument();
      expect(screen.getByText('View and manage all your ongoing and completed calculations')).toBeInTheDocument();
    });

    test('given dashboard view then displays summary cards', () => {
      // Given
      const flowProps = createMockFlowProps();

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} />);

      // Then
      expect(screen.getByText('Economy Calculations')).toBeInTheDocument();
      expect(screen.getByText('Household Calculations')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    test('given no calculations exist then shows empty state', () => {
      // Given
      const flowProps = createMockFlowProps();

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} />);

      // Then
      expect(screen.getByText('No Calculations Found')).toBeInTheDocument();
      expect(screen.getByText(/You don't have any calculations in your cache/)).toBeInTheDocument();
    });

    test('given economy calculations available then displays them', () => {
      // Given
      const mockCalculations = createMockEconomyCalculations();
      mockUseUserEconomyCalculations.mockReturnValue({
        calculations: mockCalculations,
        pendingCount: 1,
        completedCount: 1,
        erroredCount: 0,
        pendingCalculations: mockCalculations.filter(c => c.status === 'pending'),
        completedCalculations: mockCalculations.filter(c => c.status === 'completed'),
        erroredCalculations: [],
        totalCount: 2,
        getCalculationByIds: vi.fn(),
        invalidateCalculation: vi.fn(),
        removeCalculation: vi.fn(),
      });

      const flowProps = createMockFlowProps();

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} />);

      // Then
      expect(screen.getByText('Society-Wide Calculations')).toBeInTheDocument();
      expect(screen.getByText('US Economy Calculation')).toBeInTheDocument();
      expect(screen.getByText('UK Economy Calculation')).toBeInTheDocument();
    });

    test('given user clicks view button then navigates to specific calculation', async () => {
      // Given
      const user = userEvent.setup();
      const mockCalculations = createMockEconomyCalculations();
      mockUseUserEconomyCalculations.mockReturnValue({
        calculations: mockCalculations,
        pendingCount: 1,
        completedCount: 1,
        erroredCount: 0,
        pendingCalculations: mockCalculations.filter(c => c.status === 'pending'),
        completedCalculations: mockCalculations.filter(c => c.status === 'completed'),
        erroredCalculations: [],
        totalCount: 2,
        getCalculationByIds: vi.fn(),
        invalidateCalculation: vi.fn(),
        removeCalculation: vi.fn(),
      });

      const flowProps = createMockFlowProps({ onNavigate: mockOnNavigate });

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} />);

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('calculation', {
        countryId: 'us',
        baselinePolicyId: '1',
        reformPolicyId: '2',
        region: undefined
      });
    });
  });

  describe('Specific Calculation Mode (with navigation params)', () => {
    describe('Society-wide calculation', () => {
      const societyParams = {
        countryId: 'us',
        baselinePolicyId: '1',
        reformPolicyId: '2',
      };

      test('given society-wide params then displays society-wide UI', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('pending'),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params: societyParams };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Calculating Society-Wide Impact')).toBeInTheDocument();
        expect(screen.getByText('Economy-Wide Calculation')).toBeInTheDocument();
      });

      test('given pending economy calculation then shows queue position', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('running', { queuePosition: 3 }),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params: societyParams };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Queue Position: 3')).toBeInTheDocument();
      });
    });

    describe('Household calculation', () => {
      const householdParams = {
        countryId: 'us',
        baselinePolicyId: '1',
        reformPolicyId: '2',
        householdId: 'household-123',
      };

      test('given household params then displays household UI', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('pending'),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'household',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params: householdParams };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Calculating Household Impact')).toBeInTheDocument();
        expect(screen.getByText('Household Calculation')).toBeInTheDocument();
      });

      test('given household calculation then does not show queue position', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('running', { progress: 50 }),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'household',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params: householdParams };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.queryByText(/Queue Position/)).not.toBeInTheDocument();
        expect(screen.getByText('50% complete')).toBeInTheDocument();
      });
    });

    describe('Progress states', () => {
      const params = {
        countryId: 'us',
        baselinePolicyId: '1',
        reformPolicyId: '2',
      };

      test('given pending status then shows initializing state', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('pending'),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Initializing')).toBeInTheDocument();
        expect(screen.getByText('Please wait while we process your report...')).toBeInTheDocument();
      });

      test('given running status then shows progress', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('running', { progress: 75 }),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('75% complete')).toBeInTheDocument();
      });

      test('given error status then shows error with retry button', async () => {
        // Given
        const user = userEvent.setup();
        const mockRetry = vi.fn();
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('error', { error: ERROR_MESSAGES.ECONOMY_FAILED }),
          isLoading: false,
          isCompleted: false,
          isErrored: true,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: mockRetry,
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Calculation Failed')).toBeInTheDocument();
        expect(screen.getByText(ERROR_MESSAGES.ECONOMY_FAILED)).toBeInTheDocument();

        const retryButton = screen.getByRole('button', { name: /Retry Calculation/i });
        await user.click(retryButton);
        expect(mockRetry).toHaveBeenCalled();
      });

      test('given completed status then shows completion and navigates', async () => {
        // Given
        const mockResult = { totalBudgetImpact: 1000000 };
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('completed'),
          isLoading: false,
          isCompleted: true,
          isErrored: false,
          result: mockResult,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'society',
          isBaselineOnly: false,
        } as any);

        const flowProps = createMockFlowProps({ onNavigate: mockOnNavigate });
        const route = { params };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(screen.getByText('Calculation complete!')).toBeInTheDocument();
        expect(screen.getByText('Calculation complete! Redirecting...')).toBeInTheDocument();

        // Wait for navigation after 1.5 seconds
        await waitFor(
          () => {
            expect(mockOnNavigate).toHaveBeenCalledWith('complete');
          },
          { timeout: 2000 }
        );
      });
    });

    describe('Baseline-only calculations', () => {
      const params = {
        countryId: 'us',
        baselinePolicyId: '1',
        householdId: 'household-123',
      };

      test('given baseline-only calculation then shows indicator', () => {
        // Given
        mockUseReportCalculation.mockReturnValue({
          calculationProgress: createMockCalculationProgress('running'),
          isLoading: true,
          isCompleted: false,
          isErrored: false,
          result: null,
          economyCalculation: null,
          baselineHouseholdCalc: null,
          reformHouseholdCalc: null,
          retry: vi.fn(),
          reportType: 'household',
          isBaselineOnly: true,
        } as any);

        const flowProps = createMockFlowProps();
        const route = { params };

        // When
        renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

        // Then
        expect(screen.getByText(/Baseline Only/)).toBeInTheDocument();
      });
    });

    test('given user clicks cancel then navigates to cancel', async () => {
      // Given
      const user = userEvent.setup();
      mockUseReportCalculation.mockReturnValue({
        calculationProgress: createMockCalculationProgress('error', { error: ERROR_MESSAGES.ECONOMY_FAILED }),
        isLoading: false,
        isCompleted: false,
        isErrored: true,
        result: null,
        economyCalculation: null,
        baselineHouseholdCalc: null,
        reformHouseholdCalc: null,
        retry: vi.fn(),
        reportType: 'society',
        isBaselineOnly: false,
      } as any);

      const flowProps = createMockFlowProps({ onNavigate: mockOnNavigate });
      const route = { params: { countryId: 'us', baselinePolicyId: '1' } };

      // When
      renderWithProviders(<ReportCalculationFrame {...flowProps} route={route} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Then
      expect(mockOnNavigate).toHaveBeenCalledWith('cancel');
    });
  });
});