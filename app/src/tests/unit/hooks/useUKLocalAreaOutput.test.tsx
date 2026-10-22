import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import { useUKLocalAreaOutput } from '@/hooks/useUKLocalAreaOutput';
import {
  BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY,
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  COMPLETE_RESPONSE,
  NORMALIZED_BREAKDOWN,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { V2_UK_LOCAL_AREA_REQUEST_PROPS } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

vi.mock('@/api/societyWideCalculation', () => ({
  fetchLocalAreaBreakdown: vi.fn(),
}));

vi.mock('@/hooks/useRegions', async () => {
  const { UK_METADATA_REGIONS } =
    await import('@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks');
  return { useRegions: () => ({ data: UK_METADATA_REGIONS }) };
});

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useUKLocalAreaOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a breakdown release result without area impacts and no breakdown then there are no areas to show', () => {
    // When
    const { result } = renderHook(
      () => useUKLocalAreaOutput(NATIONAL_OUTPUT_WITHOUT_AREAS, V2_UK_LOCAL_AREA_REQUEST_PROPS),
      { wrapper }
    );

    // Then
    expect(result.current.breakdown.status).toBe('idle');
    expect(result.current.canCompute).toBe(true);
    expect(result.current.areaOutput).toBeNull();
    expect(result.current.withheld).toBeUndefined();
  });

  test('given saved constituencies and a completed breakdown then keeps them, takes the local authorities and counts only those', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const savedConstituenciesOnly = BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY as any;
    const { result } = renderHook(
      () => useUKLocalAreaOutput(savedConstituenciesOnly, V2_UK_LOCAL_AREA_REQUEST_PROPS),
      { wrapper }
    );

    // When
    act(() => result.current.breakdown.start());

    // Then
    await waitFor(() => expect(result.current.breakdown.status).toBe('complete'));
    const areaOutput = result.current.areaOutput as any;
    expect(areaOutput.constituency_impact).toBe(savedConstituenciesOnly.constituency_impact);
    expect(areaOutput.local_authority_impact).toBe(NORMALIZED_BREAKDOWN.local_authority_impact);
    expect(result.current.withheld).toEqual({ local_authority: null });
  });

  test('given an older release result then it offers no compute and start sends nothing', () => {
    // Given
    const { result } = renderHook(
      () =>
        useUKLocalAreaOutput(
          OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
          V2_UK_LOCAL_AREA_REQUEST_PROPS
        ),
      { wrapper }
    );

    // When
    act(() => result.current.breakdown.start());

    // Then
    expect(result.current.canCompute).toBe(false);
    expect(result.current.breakdown.status).toBe('idle');
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });
});
