import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHydrateCalculationCache } from '@/hooks/useHydrateCalculationCache';
import { calculationKeys } from '@/libs/queryKeys';
import { CalcStatus } from '@/types/calculation';
import { Report } from '@/types/ingredients/Report';
import {
  createMockCalcStatusComputing,
  CACHE_HYDRATION_TEST_CONSTANTS,
} from '@/tests/fixtures/hooks/cacheHydrationFixtures';

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
    id: withOutput ? CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITH_OUTPUT : CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITHOUT_OUTPUT,
    label: 'Test Report',
    countryId: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
    apiVersion: '1.0.0',
    simulationIds: ['sim-1', 'sim-2'],
    status: withOutput ? 'complete' : 'pending',
    output: withOutput ? {
      budget: {
        budgetary_impact: 1000,
      },
      earnings: {
        total_earnings: 50000,
      },
    } as any : null,
  });

  it('should hydrate cache with persisted output for economy report', () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'economy';

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    expect(cachedStatus).toBeDefined();
    expect(cachedStatus?.status).toBe('complete');
    expect(cachedStatus?.result).toEqual(mockReport.output);
    expect(cachedStatus?.metadata).toEqual({
      calcId: mockReport.id,
      calcType: 'economy',
      targetType: 'report',
      startedAt: expect.any(Number),
    });
  });

  it('should hydrate cache with persisted output for household report', () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'household';

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    expect(cachedStatus).toBeDefined();
    expect(cachedStatus?.status).toBe('complete');
    expect(cachedStatus?.result).toEqual(mockReport.output);
    expect(cachedStatus?.metadata).toEqual({
      calcId: mockReport.id,
      calcType: 'household',
      targetType: 'report',
      startedAt: expect.any(Number),
    });
  });

  it('should skip hydration if report has no output', () => {
    const mockReport = createMockReport(false);
    const outputType: 'economy' | 'household' = 'economy';

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    const queryKey = calculationKeys.byReportId(mockReport.id!);
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);

    expect(cachedStatus).toBeUndefined();
  });

  it('should skip hydration if report is undefined', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(
      () => useHydrateCalculationCache({ report: undefined, outputType: 'economy' }),
      { wrapper }
    );

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[useHydrateCalculationCache]')
    );
  });

  it('should skip hydration if outputType is undefined', () => {
    const mockReport = createMockReport(true);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType: undefined }),
      { wrapper }
    );

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[useHydrateCalculationCache]')
    );
  });

  it('should skip hydration if cache already has data', () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'economy';

    // Pre-populate cache
    const existingStatus = createMockCalcStatusComputing();
    const queryKey = calculationKeys.byReportId(mockReport.id!);
    queryClient.setQueryData(queryKey, existingStatus);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    // Should log that cache is already populated
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[useHydrateCalculationCache] Cache already populated, skipping hydration'
    );

    // Cache should still have the original computing status
    const cachedStatus = queryClient.getQueryData<CalcStatus>(queryKey);
    expect(cachedStatus).toEqual(existingStatus);
  });

  it('should only hydrate once even if hook re-renders', () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'economy';

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

  it('should log hydration action', () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'economy';

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(
      () => useHydrateCalculationCache({ report: mockReport, outputType }),
      { wrapper }
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[useHydrateCalculationCache] Hydrating cache with persisted result'
    );
  });

  it('should handle report changing from undefined to defined', async () => {
    const mockReport = createMockReport(true);
    const outputType: 'economy' | 'household' = 'economy';

    const { rerender } = renderHook(
      (props: { report: Report | undefined, outputType: 'economy' | 'household' }) =>
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
