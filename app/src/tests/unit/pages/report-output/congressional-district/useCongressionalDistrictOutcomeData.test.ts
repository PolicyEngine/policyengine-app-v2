import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  extractDistrictOutcomeShares,
  getDistrictOutcomeValue,
  mergeOutcomeMapData,
  useCongressionalDistrictOutcomeData,
} from '@/pages/report-output/congressional-district/useCongressionalDistrictOutcomeData';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const {
  mockFetchSocietyWideCalculation,
  mockUseCongressionalDistrictData,
  mockUseSelector,
  mockGetUSCongressionalDistricts,
} = vi.hoisted(() => ({
  mockFetchSocietyWideCalculation: vi.fn(),
  mockUseCongressionalDistrictData: vi.fn(),
  mockUseSelector: vi.fn(),
  mockGetUSCongressionalDistricts: vi.fn(),
}));

vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: mockFetchSocietyWideCalculation,
}));

vi.mock('@/contexts/congressional-district', () => ({
  MAX_POLL_ATTEMPTS: 3,
  POLL_INTERVAL_MS: 0,
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('react-redux', () => ({
  useSelector: mockUseSelector,
}));

vi.mock('@/utils/regionStrategies', () => ({
  getUSCongressionalDistricts: mockGetUSCongressionalDistricts,
}));

describe('useCongressionalDistrictOutcomeData helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        metadata: {
          economyOptions: {
            region: [],
          },
        },
      })
    );

    mockGetUSCongressionalDistricts.mockReturnValue([
      {
        value: 'congressional_district/AL-01',
        stateAbbreviation: 'AL',
        label: "Alabama's 1st congressional district",
      },
      {
        value: 'congressional_district/AL-02',
        stateAbbreviation: 'AL',
        label: "Alabama's 2nd congressional district",
      },
    ]);

    mockFetchSocietyWideCalculation.mockResolvedValue({
      status: 'ok',
      result: createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0.2,
            'Gain less than 5%': 0.3,
            'Lose more than 5%': 0.1,
            'Lose less than 5%': 0.15,
            'No change': 0.25,
          },
        },
      }),
    });
  });

  test('extractDistrictOutcomeShares sums winners and losers from intra-decile output', () => {
    const output = createMockSocietyWideOutput({
      intra_decile: {
        all: {
          'Gain more than 5%': 0.2,
          'Gain less than 5%': 0.15,
          'Lose more than 5%': 0.05,
          'Lose less than 5%': 0.1,
          'No change': 0.5,
        },
      },
    }) as any;

    const shares = extractDistrictOutcomeShares(output);

    expect(shares?.winnerPct).toBeCloseTo(0.35);
    expect(shares?.loserPct).toBeCloseTo(0.15);
    expect(shares?.noChangePct).toBeCloseTo(0.5);
  });

  test('extractDistrictOutcomeShares returns null when intra-decile data is unavailable', () => {
    const output = createMockSocietyWideOutput({
      intra_decile: undefined,
    }) as any;

    expect(extractDistrictOutcomeShares(output)).toBeNull();
  });

  test('getDistrictOutcomeValue returns the requested outcome metric', () => {
    const shares = {
      winnerPct: 0.42,
      loserPct: 0.09,
      noChangePct: 0.49,
    };

    expect(getDistrictOutcomeValue(shares, 'winner')).toBe(0.42);
    expect(getDistrictOutcomeValue(shares, 'loser')).toBe(0.09);
  });

  test('mergeOutcomeMapData preserves payload values and fills missing districts from fallback', () => {
    const merged = mergeOutcomeMapData(
      [{ geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 0.6 }],
      [
        { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 0.5 },
        { geoId: 'AL-02', label: "Alabama's 2nd congressional district", value: 0.4 },
      ]
    );

    expect(merged).toEqual([
      { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 0.6 },
      { geoId: 'AL-02', label: "Alabama's 2nd congressional district", value: 0.4 },
    ]);
  });

  test('useCongressionalDistrictOutcomeData refetches when report identity changes', async () => {
    let contextValue = {
      reformPolicyId: 100,
      baselinePolicyId: 0,
      year: 2026,
      stateCode: undefined,
    };

    mockUseCongressionalDistrictData.mockImplementation(() => contextValue);

    const { result, rerender } = renderHook(() =>
      useCongressionalDistrictOutcomeData('winner', true)
    );

    await waitFor(() => expect(result.current.mapData).toHaveLength(2));
    await waitFor(() => expect(mockFetchSocietyWideCalculation).toHaveBeenCalledTimes(2));

    contextValue = {
      ...contextValue,
      reformPolicyId: 101,
    };
    rerender();

    await waitFor(() => expect(mockFetchSocietyWideCalculation).toHaveBeenCalledTimes(4));
    await waitFor(() => expect(result.current.mapData).toHaveLength(2));
  });

  test('useCongressionalDistrictOutcomeData starts every district before retrying computing ones', async () => {
    const expectedRegions = Array.from({ length: 13 }, (_, index) => {
      const district = String(index + 1).padStart(2, '0');
      return `congressional_district/AL-${district}`;
    });

    mockGetUSCongressionalDistricts.mockReturnValue(
      expectedRegions.map((region, index) => ({
        value: region,
        stateAbbreviation: 'AL',
        label: `District ${index + 1}`,
      }))
    );

    mockUseCongressionalDistrictData.mockReturnValue({
      reformPolicyId: 100,
      baselinePolicyId: 0,
      year: 2026,
      stateCode: undefined,
    });

    const requestOrder: string[] = [];
    const requestCounts = new Map<string, number>();

    mockFetchSocietyWideCalculation.mockImplementation(
      async (_countryId: string, _reformPolicyId: string, _baselinePolicyId: string, params) => {
        requestOrder.push(params.region);

        const currentCount = (requestCounts.get(params.region) ?? 0) + 1;
        requestCounts.set(params.region, currentCount);

        if (params.region === expectedRegions[12] || currentCount > 1) {
          return {
            status: 'ok',
            result: createMockSocietyWideOutput({
              intra_decile: {
                all: {
                  'Gain more than 5%': 0.2,
                  'Gain less than 5%': 0.3,
                  'Lose more than 5%': 0.1,
                  'Lose less than 5%': 0.15,
                  'No change': 0.25,
                },
              },
            }),
          };
        }

        return {
          status: 'computing',
          result: null,
        };
      }
    );

    const { result } = renderHook(() => useCongressionalDistrictOutcomeData('winner', true));

    await waitFor(() => expect(result.current.mapData).toHaveLength(13));

    expect(requestOrder.slice(0, 13)).toEqual(expectedRegions);
  });
});
