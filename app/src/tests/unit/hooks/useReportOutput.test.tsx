import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@test-utils';
import { useReportOutput } from '@/hooks/useReportOutput';
import * as useUserReportsModule from '@/hooks/useUserReports';
import {
  MOCK_REPORT_ID,
  mockEconomyCalculationComplete,
  mockEconomyCalculationPending,
  mockEconomyCalculationError,
  mockHouseholdCalculationData,
  mockHouseholdCalculationError,
  mockReportOutput,
  mockReportOutputLarge,
  createMockReport,
  createMockUserReportByIdReturn,
  createQueryClientWrapper,
  mockUseQueryReturn,
} from '@/tests/fixtures/hooks/useReportOutputMocks';

// Mock dependencies
vi.mock('@/hooks/useUserReports');
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: () => new (actual as any).QueryClient(),
  };
});

// Import after mocking to get the mocked version
import { useQuery } from '@tanstack/react-query';

describe('useReportOutput', () => {
  const mockReportId = MOCK_REPORT_ID;
  const { createWrapper } = createQueryClientWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useUserReportById
    vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
      createMockUserReportByIdReturn()
    );
  });

  describe('Three-tier data fetching', () => {
    test('given cached economy calculation data then returns complete status', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: mockEconomyCalculationComplete,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(mockEconomyCalculationComplete.result);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('given cached household calculation data then returns complete status', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: mockHouseholdCalculationData,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(mockHouseholdCalculationData);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('given household calculation with error then returns error status', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: mockHouseholdCalculationError,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(mockHouseholdCalculationError.error);
    });

    test('given pending economy calculation then returns pending status', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: mockEconomyCalculationPending,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('given error economy calculation then returns error status', () => {
      // Given
      (useQuery as any).mockReturnValue({
        data: mockEconomyCalculationError,
        error: null,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(mockEconomyCalculationError.error);
    });

    test('given query error then returns error status', () => {
      // Given
      const mockError = new Error('Network error');

      (useQuery as any).mockReturnValue({
        data: null,
        error: mockError,
        isLoading: false,
      });

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    test('given loading state then returns pending status', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.loading);

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fallback to report data', () => {
    test('given no cached data and complete report then returns complete status', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(
          createMockReport({ status: 'complete', output: mockReportOutput })
        )
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(mockReportOutput);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('given no cached data and pending report then returns pending status', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(
          createMockReport({ status: 'pending', output: null })
        )
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('pending');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('given no cached data and error report then returns error status', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(
          createMockReport({ status: 'error', output: null })
        )
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe('Report calculation failed');
    });

    test('given no cached data and no report then returns error status', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(undefined, new Error('Report not found'))
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.data).toBeNull();
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toEqual(new Error('Report not found'));
    });

    test('given report without status field then returns error', () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      const reportWithoutStatus = createMockReport({});
      delete (reportWithoutStatus as any).status;

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(reportWithoutStatus)
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Invalid report: missing status');
      expect(consoleSpy).toHaveBeenCalledWith(`[useReportOutput] Report ${mockReportId} has no status field`);

      consoleSpy.mockRestore();
    });

    test('given report with unknown status then returns error', () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(
          createMockReport({ status: 'unknown' as any, output: null })
        )
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Unknown status: unknown');
      expect(consoleSpy).toHaveBeenCalledWith('[useReportOutput] Unknown report status: unknown');

      consoleSpy.mockRestore();
    });

    test('given report with object output then parses correctly', () => {
      // Given
      (useQuery as any).mockReturnValue(mockUseQueryReturn.success(null));

      vi.spyOn(useUserReportsModule, 'useUserReportById').mockReturnValue(
        createMockUserReportByIdReturn(
          createMockReport({ status: 'complete', output: mockReportOutputLarge })
        )
      );

      // When
      const { result } = renderHook(() => useReportOutput({ reportId: mockReportId }), {
        wrapper: createWrapper(),
      });

      // Then
      expect(result.current.status).toBe('complete');
      expect(result.current.data).toEqual(mockReportOutputLarge);
    });
  });

  describe('Report ID handling', () => {
    test('given numeric reportId then converts to string', () => {
      // Given
      const numericReportId = 456;

      (useQuery as any).mockReturnValue(
        mockUseQueryReturn.success({ status: 'ok', result: {} })
      );

      // When
      const { result } = renderHook(
        () => useReportOutput({ reportId: numericReportId as any }),
        {
          wrapper: createWrapper(),
        }
      );

      // Then
      expect(result.current.status).toBe('complete');
      // Verify useQuery was called with string reportId
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calculation', '456'],
        })
      );
    });
  });

  describe('Standard return values', () => {
    test('given different states then uses consistent return structure', () => {
      // Test pending
      (useQuery as any).mockReturnValue(mockUseQueryReturn.loading);

      const { result: pendingResult } = renderHook(
        () => useReportOutput({ reportId: mockReportId }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(pendingResult.current).toEqual({
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
      });

      // Test error
      (useQuery as any).mockReturnValue(mockUseQueryReturn.error('Test error'));

      const { result: errorResult } = renderHook(
        () => useReportOutput({ reportId: mockReportId }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(errorResult.current).toEqual({
        status: 'error',
        data: null,
        isPending: false,
        error: 'Test error',
      });

      // Test complete
      const mockData = { test: 'data' };
      (useQuery as any).mockReturnValue(
        mockUseQueryReturn.success({ status: 'ok', result: mockData })
      );

      const { result: completeResult } = renderHook(
        () => useReportOutput({ reportId: mockReportId }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(completeResult.current).toEqual({
        status: 'complete',
        data: mockData,
        isPending: false,
        error: null,
      });
    });
  });
});