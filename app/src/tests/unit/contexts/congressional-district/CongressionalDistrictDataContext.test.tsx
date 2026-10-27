/**
 * Tests for CongressionalDistrictDataContext
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from '@/contexts/congressional-district/CongressionalDistrictDataContext';
import { useRegions } from '@/hooks/useRegions';
import {
  TEST_POLICY_IDS,
  TEST_REGION_FORMATS,
  TEST_YEAR,
} from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import { mockUSRegionRecords } from '@/tests/fixtures/utils/regionStrategiesMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

/** The provider around a hook, for a report on `region`. */
function wrapperFor(region?: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CongressionalDistrictDataProvider
        reformPolicyId={TEST_POLICY_IDS.REFORM}
        baselinePolicyId={TEST_POLICY_IDS.BASELINE}
        year={TEST_YEAR}
        region={region}
      >
        {children}
      </CongressionalDistrictDataProvider>
    );
  };
}

describe('CongressionalDistrictDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegions).mockReturnValue({
      data: mockUSRegionRecords,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRegions>);
  });

  test('given the hook used outside the provider then it throws', () => {
    // Given
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When / Then
    expect(() => renderHook(() => useCongressionalDistrictData())).toThrow(
      'useCongressionalDistrictData must be used within a CongressionalDistrictDataProvider'
    );
    consoleSpy.mockRestore();
  });

  test('given the provider then it gives only the labels, state code, policies, year and scope', () => {
    // When
    const { result } = renderHook(() => useCongressionalDistrictData(), {
      wrapper: wrapperFor(TEST_REGION_FORMATS.NATIONAL),
    });

    // Then
    expect(Object.keys(result.current).sort()).toEqual([
      'baselinePolicyId',
      'labelLookup',
      'reformPolicyId',
      'scope',
      'stateCode',
      'year',
    ]);
    expect(result.current).toMatchObject({
      reformPolicyId: TEST_POLICY_IDS.REFORM,
      baselinePolicyId: TEST_POLICY_IDS.BASELINE,
      year: TEST_YEAR,
    });
  });

  test('given district regions then the labels are keyed by district', () => {
    // When
    const { result } = renderHook(() => useCongressionalDistrictData(), {
      wrapper: wrapperFor(TEST_REGION_FORMATS.NATIONAL),
    });

    // Then
    expect(result.current.labelLookup.get('CA-01')).toBe("California's 1st congressional district");
  });

  test.each([
    ['a nationwide report', 'nationwide', TEST_REGION_FORMATS.NATIONAL],
    ['a report with no region', 'nationwide', undefined],
    ['a state report', 'state', TEST_REGION_FORMATS.STATE_CA],
    ['a district report', null, TEST_REGION_FORMATS.CONGRESSIONAL_DISTRICT],
  ])('given %s then the scope is %s', (_label, expected, region) => {
    // When
    const { result } = renderHook(() => useCongressionalDistrictData(), {
      wrapper: wrapperFor(region),
    });

    // Then
    expect(result.current.scope).toBe(expected);
  });

  test('given a nationwide report then there is no state code', () => {
    // When
    const { result } = renderHook(() => useCongressionalDistrictData(), {
      wrapper: wrapperFor(TEST_REGION_FORMATS.NATIONAL),
    });

    // Then
    expect(result.current.stateCode).toBeNull();
  });

  test('given a state report then the state code is its abbreviation', () => {
    // When
    const { result } = renderHook(() => useCongressionalDistrictData(), {
      wrapper: wrapperFor(TEST_REGION_FORMATS.STATE_CA),
    });

    // Then
    expect(result.current.stateCode).toBe('ca');
  });
});
