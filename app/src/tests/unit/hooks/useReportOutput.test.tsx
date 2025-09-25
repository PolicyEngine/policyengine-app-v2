// Import after mocking to get the mocked version
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportOutput } from '@/hooks/useReportOutput';
import {
  MOCK_COMPUTING_RESPONSE,
  MOCK_ECONOMY_CALCULATION_RESPONSE,
  MOCK_ERROR_RESPONSE,
  MOCK_HOUSEHOLD_CALCULATION_RESPONSE,
} from '@/tests/fixtures/hooks/calculationManagerMocks';
import {
  createQueryClientWrapper,
  MOCK_REPORT_ID,
} from '@/tests/fixtures/hooks/useReportOutputMocks';

// Mock dependencies
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: () => new (actual as any).QueryClient(),
  };
});

// Mock the calculation queries
vi.mock('@/libs/queryOptions/calculations', () => ({
  calculationQueries: {
    forReport: vi.fn((reportId, _meta, _queryClient, _countryId) => ({
      queryKey: ['calculation', reportId],
      queryFn: vi.fn(),
      refetchInterval: vi.fn(),
      staleTime: Infinity,
    })),
  },
}));

describe('useReportOutput', () => {
  const mockReportId = MOCK_REPORT_ID;
  const { createWrapper } = createQueryClientWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unified status handling', () => {
    test('given calculation with computing status then returns pending result', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: MOCK_COMPUTING_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        progress: MOCK_COMPUTING_RESPONSE.progress,
        message: MOCK_COMPUTING_RESPONSE.message,
        queuePosition: MOCK_COMPUTING_RESPONSE.queuePosition,
        estimatedTimeRemaining: MOCK_COMPUTING_RESPONSE.estimatedTimeRemaining,
      });
    });

    test('given calculation with ok status then returns complete result', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: MOCK_HOUSEHOLD_CALCULATION_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'complete',
        data: MOCK_HOUSEHOLD_CALCULATION_RESPONSE.result,
        isPending: false,
        error: null,
      });
    });

    test('given calculation with error status then returns error result', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: MOCK_ERROR_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: MOCK_ERROR_RESPONSE.error,
      });
    });

    test('given query error then returns error result', () => {
      // Given
      const queryError = new Error('Network error');
      (useQuery as any).mockReturnValue({
        data: null,
        error: queryError,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: queryError,
      });
    });

    test('given loading state then returns pending result', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
      });
    });

    test('given no data and no loading then returns fallback error', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Unable to fetch calculation',
      });
    });
  });

  describe('economy calculation results', () => {
    test('given economy calculation with ok status then extracts result data', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: MOCK_ECONOMY_CALCULATION_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(MOCK_ECONOMY_CALCULATION_RESPONSE.result);
      expect(result.current.data.budget.budgetary_impact).toBe(1000000);
    });

    test('given economy calculation with computing status then includes progress info', () => {
      // Given
      const computingWithQueuePosition = {
        status: 'computing',
        progress: 0.25,
        message: 'Waiting in queue...',
        queuePosition: 3,
        estimatedTimeRemaining: 45000,
      };
      (useQuery as any).mockReturnValue({
        data: computingWithQueuePosition,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect((result.current as any).progress).toBe(0.25);
      expect((result.current as any).message).toBe('Waiting in queue...');
      expect((result.current as any).queuePosition).toBe(3);
      expect((result.current as any).estimatedTimeRemaining).toBe(45000);
    });
  });

  describe('household calculation results', () => {
    test('given household calculation with ok status then returns household data', () => {
      // Given
      const householdResult = {
        status: 'ok',
        result: {
          household_id: 'household-789',
          baseline_net_income: 60000,
          reform_net_income: 65000,
          net_income_change: 5000,
        },
      };
      (useQuery as any).mockReturnValue({
        data: householdResult,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(householdResult.result);
      expect(result.current.data.net_income_change).toBe(5000);
    });

    test('given household calculation with synthetic progress then shows progress', () => {
      // Given
      const householdComputing = {
        status: 'computing',
        progress: 0.75,
        message: 'Processing household calculation...',
        estimatedTimeRemaining: 5000,
      };
      (useQuery as any).mockReturnValue({
        data: householdComputing,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect((result.current as any).progress).toBe(0.75);
      expect((result.current as any).message).toBe('Processing household calculation...');
      expect((result.current as any).estimatedTimeRemaining).toBe(5000);
    });
  });

  describe('query configuration', () => {
    test('given different country in Redux then uses correct country ID', () => {
      // Given
      const { createWrapper: createUKWrapper } = createQueryClientWrapper('uk');
      (useQuery as any).mockReturnValue({
        data: MOCK_HOUSEHOLD_CALCULATION_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createUKWrapper(),
      });

      // Then
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calculation', mockReportId],
          enabled: true,
        })
      );
    });

    test('given report ID as number then converts to string', () => {
      // Given
      const numericReportId = '456';
      (useQuery as any).mockReturnValue({
        data: MOCK_HOUSEHOLD_CALCULATION_RESPONSE,
        error: null,
        isLoading: false,
      });

      // When
      renderHook(() => useReportOutput({ reportId: numericReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calculation', numericReportId],
        })
      );
    });
  });

  describe('edge cases', () => {
    test('given undefined data with no error or loading then returns fallback', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Unable to fetch calculation',
      });
    });

    test('given calculation with unknown status then falls through to error', () => {
      // Given
      const unknownStatus = {
        status: 'unknown',
        someData: 'test',
      };
      (useQuery as any).mockReturnValue({
        data: unknownStatus,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then - should fall through all conditions to fallback
      expect(result.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Unable to fetch calculation',
      });
    });

    test('given computing status with partial progress data then handles gracefully', () => {
      // Given
      const partialProgress = {
        status: 'computing',
        progress: 0.5,
        // Missing other fields
      };
      (useQuery as any).mockReturnValue({
        data: partialProgress,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect((result.current as any).progress).toBe(0.5);
      expect((result.current as any).message).toBeUndefined();
      expect((result.current as any).queuePosition).toBeUndefined();
      expect((result.current as any).estimatedTimeRemaining).toBeUndefined();
    });
  });
});
