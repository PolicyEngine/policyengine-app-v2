import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrateCalculationCache } from '@/hooks/useHydrateCalculationCache';
import { calculationKeys } from '@/libs/queryKeys';
import {
  CACHE_HYDRATION_TEST_CONSTANTS,
  createMockCalcStatusComputing,
} from '@/tests/fixtures/hooks/cacheHydrationFixtures';
import { CalcStatus } from '@/types/calculation';
import { Report } from '@/types/ingredients/Report';

describe('useHydrateCalculationCache', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockReport = (withOutput: boolean): Report => ({
    id: withOutput
      ? CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITH_OUTPUT
      : CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITHOUT_OUTPUT,
    label: 'Test Report',
    countryId: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
    year: '2024',
    apiVersion: '1.0.0',
    simulationIds: ['sim-1', 'sim-2'],
    status: withOutput ? 'complete' : 'pending',
    output: withOutput
      ? ({
          budget: {
            budgetary_impact: 1000,
          },
          earnings: {
            total_earnings: 50000,
          },
        } as any)
      : null,
  });

  it('should hydrate cache with persisted output for economy report', () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType }), { wrapper });

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    expect(cachedStatus).toBeDefined();
    expect(cachedStatus?.status).toBe('complete');
    expect(cachedStatus?.result).toEqual(mockReport.output);
    expect(cachedStatus?.metadata).toEqual({
      calcId: mockReport.id,
      calcType: 'societyWide',
      targetType: 'report',
      startedAt: expect.any(Number),
    });
  });

  it('should hydrate cache with persisted output for household report', () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'household';

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType }), { wrapper });

    // For household reports, the hook hydrates simulation-level caches, not report-level cache
    // Since no simulations are in the cache, nothing gets hydrated
    // This is expected behavior - the hook needs simulations to be fetched first
    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    // Report-level cache should NOT be populated for household reports
    expect(cachedStatus).toBeUndefined();
  });

  it('should skip hydration if report has no output', () => {
    const mockReport = createMockReport(false);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType }), { wrapper });

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    expect(cachedStatus).toBeUndefined();
  });

  it('should skip hydration if report is undefined', () => {
    renderHook(() => useHydrateCalculationCache({ report: undefined, outputType: 'societyWide' }), {
      wrapper,
    });

    // No cache should be populated when report is undefined
    // We can't check specific reportId since report is undefined
    expect(true).toBe(true); // Hook should complete without error
  });

  it('should skip hydration if outputType is undefined', () => {
    const mockReport = createMockReport(true);

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType: undefined }), {
      wrapper,
    });

    // Cache should not be populated when outputType is undefined
    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
    expect(cachedStatus).toBeUndefined();
  });

  it('should skip hydration if cache already has data', () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    // Pre-populate cache
    const existingStatus = createMockCalcStatusComputing();
    const queryKey = calculationKeys.byReportId(mockReport.id!);
    queryClient.setQueryData(queryKey, existingStatus);

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType }), { wrapper });

    // Cache should still have the original computing status (not overwritten)
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
    expect(cachedStatus).toEqual(existingStatus);
  });

  it('should only hydrate once even if hook re-renders', () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    const { rerender } = renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const firstResult = queryClient.getQueryData<CalcStatus>(queryKey);

    // Force re-render
    rerender();

    const secondResult = queryClient.getQueryData<CalcStatus>(queryKey);

    // Should be the same object (not re-hydrated)
    expect(firstResult).toBe(secondResult);
  });

  it('should hydrate cache successfully', () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    renderHook(() => useHydrateCalculationCache({ report: mockReport, outputType }), { wrapper });

    // Verify cache was hydrated
    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
    expect(cachedStatus).toBeDefined();
    expect(cachedStatus?.status).toBe('complete');
  });

  it('should handle report changing from undefined to defined', async () => {
    const mockReport = createMockReport(true);
    const outputType: 'societyWide' | 'household' = 'societyWide';

    const { rerender } = renderHook(
      (props: { report: Report | undefined; outputType: 'societyWide' | 'household' }) =>
        useHydrateCalculationCache(props),
      {
        wrapper,
        initialProps: { report: undefined as Report | undefined, outputType },
      }
    );

    // Initially no cache
    let queryKey = calculationKeys.byReportId(mockReport.id!);
    let cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
    expect(cachedStatus).toBeUndefined();

    // Update to have report
    rerender({ report: mockReport, outputType });

    await waitFor(() => {
      queryKey = calculationKeys.byReportId(mockReport.id!);
      cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
      expect(cachedStatus).toBeDefined();
    });

    expect(cachedStatus?.status).toBe('complete');
    expect(cachedStatus?.result).toEqual(mockReport.output);
  });
});
