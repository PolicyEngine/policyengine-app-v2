import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiFlagshipReportStore, LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { ApiReformStore, LocalStorageReformStore } from '@/api/reformStore';
import { CountryProvider } from '@/contexts/CountryContext';
import {
  useFlagshipReportStore,
  useReformStore,
  useReportRecord,
  useV3SavedWork,
} from '@/hooks/useFlagshipStores';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { store } from '@/store';
import {
  ASSOCIATION_IDS,
  okResponse,
  pageResponse,
  PE_USER_ID,
  policyItem,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
  TEST_AUTH0_SUBJECT,
} from '@/tests/fixtures/libs/auth/authMocks';

const REFORM_POLICY_ID = 95762;
const REFORM_ROW = policyItem({
  id: ASSOCIATION_IDS.REFORM,
  legacy_policy_id: REFORM_POLICY_ID,
  name: 'CTC to $3,600',
  baseline: 'current-law',
  provenance: { source: 'chat', ref: null, confidence: null },
});

const fetchMock = vi.fn();

/** Answers the account's reform list and the reform's v1 policy. */
function respond(url: string): Response {
  if (new URL(url).pathname === `/us/policy/${REFORM_POLICY_ID}`) {
    return okResponse({
      policy_json: { 'gov.irs.credits.ctc.amount.base[0]': { '2026-01-01.2100-12-31': 3600 } },
    });
  }
  return pageResponse([REFORM_ROW]);
}

function v1PolicyRequests(): number {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes('/us/policy/')).length;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => respond(url));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapperFor(auth: AuthContextValue, countryId: 'us' | 'uk' | 'ca' = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value={countryId}>
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('v3 store choice', () => {
  test('given a signed-in session then reforms and reports go to the account, scoped by subject', () => {
    // Given
    const wrapper = wrapperFor(signedInAuthValue());

    // When
    const reforms = renderHook(() => useReformStore(), { wrapper }).result.current;
    const reports = renderHook(() => useFlagshipReportStore(), { wrapper }).result.current;
    const savedWork = renderHook(() => useV3SavedWork(), { wrapper }).result.current;

    // Then
    expect(reforms).toBeInstanceOf(ApiReformStore);
    expect(reports.store).toBeInstanceOf(ApiFlagshipReportStore);
    expect(reports.isAccount).toBe(true);
    expect(savedWork.scope).toBe(`account:${TEST_AUTH0_SUBJECT}`);
  });

  test.each([
    ['signed out', makeAuthValue(), 'us'],
    ['sign-in disabled', makeAuthValue({ status: 'disabled' }), 'uk'],
    ['signed in outside the US and UK', signedInAuthValue(), 'ca'],
  ] as const)('given %s then reforms and reports stay in this browser', (_, auth, countryId) => {
    // Given
    const wrapper = wrapperFor(auth, countryId);

    // When
    const reforms = renderHook(() => useReformStore(), { wrapper }).result.current;
    const reports = renderHook(() => useFlagshipReportStore(), { wrapper }).result.current;

    // Then
    expect(reforms).toBeInstanceOf(LocalStorageReformStore);
    expect(reports.store).toBeInstanceOf(LocalStorageFlagshipReportStore);
    expect(reports.scope).toBe('browser');
  });
});

describe('useReformStore', () => {
  test('given the reform list is loaded again then each v1 policy is fetched only once', async () => {
    // Given
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <CountryProvider value="us">
            <AuthTestProvider value={signedInAuthValue()}>{children}</AuthTestProvider>
          </CountryProvider>
        </QueryClientProvider>
      </ReduxProvider>
    );
    const reformStore = renderHook(() => useReformStore(), { wrapper }).result.current;

    // When
    const first = await reformStore.findByUser(PE_USER_ID, 'us');
    const second = await reformStore.findByUser(PE_USER_ID, 'us');

    // Then
    expect(first[0].parameters).toHaveLength(1);
    expect(second[0].parameters).toEqual(first[0].parameters);
    expect(v1PolicyRequests()).toBe(1);
  });
});

describe('useReportRecord', () => {
  test('given a signed-out run on this browser then its record names the reform it was run from', async () => {
    // Given
    localStorage.clear();
    await new LocalStorageFlagshipReportStore().create({
      userId: 'anonymous',
      countryId: 'us',
      apiReportId: '615',
      title: 'CTC expansion',
      sourceNote: null,
      provisions: [],
      year: '2026',
      reformId: 'rf-ran',
    });

    // When
    const { result } = renderHook(() => useReportRecord('615'), {
      wrapper: wrapperFor(makeAuthValue()),
    });

    // Then
    await waitFor(() => expect(result.current?.reformId).toBe('rf-ran'));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
