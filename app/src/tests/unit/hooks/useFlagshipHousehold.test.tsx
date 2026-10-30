import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UNAUTHENTICATED_USER_HEADER } from '@/api/v2UserClient';
import { CountryProvider } from '@/contexts/CountryContext';
import { useSaveCalculatedHousehold } from '@/hooks/useFlagshipHousehold';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { getBrowserUserId } from '@/libs/auth/browserUser';
import {
  errorResponse,
  HOUSEHOLD_SUMMARY,
  householdItem,
  itemResponse,
  LEGACY_IDS,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

const CALCULATED_HOUSEHOLD = {
  countryId: 'us',
  household: { id: String(LEGACY_IDS.HOUSEHOLD), name: HOUSEHOLD_SUMMARY },
} as const;

const fetchMock = vi.fn();

/** The account has no saved households, and saving one answers with its row. */
function respondAsAnEmptyAccount(_url: string, init?: RequestInit): Response {
  return init?.method === 'POST' ? itemResponse(householdItem(), 201) : pageResponse([]);
}

const requestsWithMethod = (method: string) =>
  fetchMock.mock.calls.filter(
    ([, init]) => ((init as RequestInit | undefined)?.method ?? 'GET') === method
  );

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
    respondAsAnEmptyAccount(url, init)
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapperFor(auth: AuthContextValue, pageCountryId: 'us' | 'uk' = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={pageCountryId}>
        <AuthTestProvider value={auth}>{children}</AuthTestProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

/** Lets the hook's effect and its requests run. */
const settle = () => act(async () => {});

describe('useSaveCalculatedHousehold', () => {
  test('given the same calculated household twice on a page then it is looked up and saved once', async () => {
    // Given
    const { wrapper } = wrapperFor(signedInAuthValue());
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await waitFor(() => expect(requestsWithMethod('POST')).toHaveLength(1));

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await settle();

    // Then
    const [, init] = requestsWithMethod('POST')[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      country_id: 'us',
      legacy_household_id: LEGACY_IDS.HOUSEHOLD,
      name: HOUSEHOLD_SUMMARY,
    });
    expect(requestsWithMethod('GET')).toHaveLength(1);
    expect(requestsWithMethod('POST')).toHaveLength(1);
  });

  test("given signed out then the household is saved as this browser's unauthenticated user", async () => {
    // Given
    localStorage.clear();
    const { wrapper } = wrapperFor(makeAuthValue());

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await waitFor(() => expect(requestsWithMethod('POST')).toHaveLength(1));

    // Then
    const [, init] = requestsWithMethod('POST')[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)[UNAUTHENTICATED_USER_HEADER]).toBe(
      getBrowserUserId()
    );
  });

  test('given saved work kept in this browser then the household is not saved', async () => {
    // Given
    const { wrapper } = wrapperFor(makeAuthValue({ status: 'disabled' }));

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await settle();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a household in another country than the account then it is not saved', async () => {
    // Given
    const { wrapper } = wrapperFor(signedInAuthValue(), 'us');

    // When
    renderHook(() => useSaveCalculatedHousehold({ ...CALCULATED_HOUSEHOLD, countryId: 'uk' }), {
      wrapper,
    });
    await settle();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given no calculated household yet then nothing is saved', async () => {
    // Given
    const { wrapper } = wrapperFor(signedInAuthValue());

    // When
    renderHook(() => useSaveCalculatedHousehold({ countryId: 'us', household: undefined }), {
      wrapper,
    });
    await settle();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the save fails then the failure is kept to the save', async () => {
    // Given
    fetchMock.mockImplementation(async () => errorResponse(503, 'Service unavailable'));
    const { wrapper, queryClient } = wrapperFor(signedInAuthValue());

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await settle();

    // Then: the save's query holds the failure, and nothing else does (an
    // unhandled rejection would also fail the run).
    const states = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.state.status);
    expect(states).toEqual(['error']);
  });
});
