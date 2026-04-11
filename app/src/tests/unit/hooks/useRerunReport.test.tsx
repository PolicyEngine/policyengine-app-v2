import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { rerunReport } from '@/api/report';
import { CountryProvider } from '@/contexts/CountryContext';
import { useRerunReport } from '@/hooks/useRerunReport';
import type { CountryId } from '@/libs/countries';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';

vi.mock('@/api/report', () => ({
  rerunReport: vi.fn(),
}));

describe('useRerunReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(rerunReport).mockResolvedValue({
      report_id: 123,
      report_type: 'household',
      simulation_ids: [456, 789],
      economy_cache_rows_deleted: 0,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={'us' as CountryId}>{children}</CountryProvider>
    </QueryClientProvider>
  );

  test('given report ID when rerunReport is called then calls legacy rerun API', async () => {
    const { result } = renderHook(() => useRerunReport(), { wrapper });

    await result.current.rerunReport({
      reportId: 'report-123',
      simulationIds: ['sim-1', 'sim-2'],
    });

    expect(rerunReport).toHaveBeenCalledWith('us', 'report-123');
  });

  test('given cached report and simulation state when rerun succeeds then clears calculation cache and invalidates metadata queries', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    queryClient.setQueryData(reportKeys.byId('report-123'), { status: 'complete' });
    queryClient.setQueryData(simulationKeys.byId('sim-1'), { status: 'complete' });
    queryClient.setQueryData(simulationKeys.byId('sim-2'), { status: 'complete' });
    queryClient.setQueryData(calculationKeys.byReportId('report-123'), { status: 'complete' });
    queryClient.setQueryData(calculationKeys.bySimulationId('sim-1'), { status: 'complete' });
    queryClient.setQueryData(calculationKeys.bySimulationId('sim-2'), { status: 'complete' });

    const { result } = renderHook(() => useRerunReport(), { wrapper });

    await result.current.rerunReport({
      reportId: 'report-123',
      simulationIds: ['sim-1', 'sim-2', 'sim-1'],
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(calculationKeys.byReportId('report-123'))).toBeUndefined();
      expect(queryClient.getQueryData(calculationKeys.bySimulationId('sim-1'))).toBeUndefined();
      expect(queryClient.getQueryData(calculationKeys.bySimulationId('sim-2'))).toBeUndefined();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: reportKeys.byId('report-123'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: simulationKeys.byId('sim-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: simulationKeys.byId('sim-2'),
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  test('given API error when rerunReport is called then exposes the error', async () => {
    const error = new Error('rerun failed');
    vi.mocked(rerunReport).mockRejectedValue(error);

    const { result } = renderHook(() => useRerunReport(), { wrapper });

    await expect(
      result.current.rerunReport({
        reportId: 'report-123',
        simulationIds: ['sim-1'],
      })
    ).rejects.toThrow('rerun failed');

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
  });
});
