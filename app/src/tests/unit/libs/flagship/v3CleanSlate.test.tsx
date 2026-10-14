import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { LocalStorageReformStore } from '@/api/reformStore';
import { MOCK_USER_ID } from '@/constants';
import { CountryProvider } from '@/contexts/CountryContext';
import { useFlagshipReport } from '@/hooks/useFlagshipReport';
import { runFlagshipReport } from '@/libs/flagship/runReport';
import { store } from '@/store';

/**
 * v3 is a clean slate: it never reads or writes the legacy calculator's
 * saved-work keys, signed in or out.
 */

vi.mock('@/api/policy', () => ({
  createPolicy: vi.fn().mockResolvedValue({ result: { policy_id: '77' } }),
  fetchPolicyById: vi.fn(),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: vi.fn().mockResolvedValue({ result: { simulation_id: '101' } }),
  fetchSimulationById: vi.fn(),
}));
vi.mock('@/api/report', () => ({
  createReport: vi.fn().mockResolvedValue({ id: 615 }),
  fetchReportById: vi.fn(),
}));

const LEGACY_KEYS = [
  'user-policy-associations',
  'user-population-households',
  'user-simulation-associations',
  'user-report-associations',
  'user-geographic-associations',
];

const touchedKeys = new Set<string>();

beforeEach(() => {
  localStorage.clear();
  touchedKeys.clear();
  for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
    const original = localStorage[method].bind(localStorage);
    vi.spyOn(localStorage, method).mockImplementation((key: string, ...rest: string[]) => {
      touchedKeys.add(key);
      return (original as (...args: string[]) => string | null)(key, ...rest);
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

function legacyKeysTouched(): string[] {
  return LEGACY_KEYS.filter((key) => touchedKeys.has(key));
}

describe('v3 and the legacy calculator storage', () => {
  test('given a signed-out run, reform save and record listing then no legacy key is touched', async () => {
    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Hand-built draft',
      provisions: [{ path: 'gov.x', breadcrumb: 'X', unit: null, baselineValue: 1, value: 2 }],
      currentLawId: 2,
    });
    await new LocalStorageReformStore().create({
      countryId: 'us',
      label: 'CTC expansion',
      parameters: [],
      baseline: 'current-law',
      provenance: { source: 'manual' },
    });
    await new LocalStorageFlagshipReportStore().findMine('us');

    // Then
    expect(touchedKeys.has('pe-flagship-reports')).toBe(true);
    expect(legacyKeysTouched()).toEqual([]);
  });

  test('given an old sur- report link then it resolves to nothing without reading legacy storage', () => {
    // Given
    localStorage.setItem(
      'user-report-associations',
      JSON.stringify([{ id: 'sur-old1', reportId: '615', userId: MOCK_USER_ID, countryId: 'us' }])
    );
    touchedKeys.clear();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReduxProvider store={store}>
        <QueryClientProvider client={new QueryClient()}>
          <CountryProvider value="us">{children}</CountryProvider>
        </QueryClientProvider>
      </ReduxProvider>
    );

    // When
    const { result } = renderHook(() => useFlagshipReport('sur-old1'), { wrapper });

    // Then
    expect(result.current).toMatchObject({ report: undefined, isLoading: false });
    expect(legacyKeysTouched()).toEqual([]);
  });
});
