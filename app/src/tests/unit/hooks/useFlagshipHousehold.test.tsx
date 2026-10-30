import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useSaveCalculatedHousehold } from '@/hooks/useFlagshipHousehold';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  errorResponse,
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

const HOUSEHOLD_SUMMARY = 'Single · no children · $50,000 earnings · California';
const CALCULATED_HOUSEHOLD = {
  countryId: 'us',
  householdId: String(LEGACY_IDS.HOUSEHOLD),
  name: HOUSEHOLD_SUMMARY,
};

const fetchMock = vi.fn();

/** The account has no saved households, and saving one answers with its row. */
function respondAsAnEmptyAccount(_url: string, init?: RequestInit): Response {
  return init?.method === 'POST' ? itemResponse(householdItem(), 201) : pageResponse([]);
}

const householdCreations = () =>
  fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST');

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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={pageCountryId}>
        <AuthTestProvider value={auth}>{children}</AuthTestProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
}

/** Lets the hook's effect and its requests run. */
const settle = () => act(async () => {});

describe('useSaveCalculatedHousehold', () => {
  test('given the same calculated household twice on a page then it is saved once', async () => {
    // Given
    const wrapper = wrapperFor(signedInAuthValue());
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await waitFor(() => expect(householdCreations()).toHaveLength(1));

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await settle();

    // Then
    const [, init] = householdCreations()[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      country_id: 'us',
      legacy_household_id: LEGACY_IDS.HOUSEHOLD,
      name: HOUSEHOLD_SUMMARY,
    });
    expect(householdCreations()).toHaveLength(1);
  });

  test('given saved work kept in this browser then the household is not saved', async () => {
    // Given
    const wrapper = wrapperFor(makeAuthValue({ status: 'disabled' }));

    // When
    renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), { wrapper });
    await settle();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a household in another country than the account then it is not saved', async () => {
    // Given
    const wrapper = wrapperFor(signedInAuthValue(), 'us');

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
    const wrapper = wrapperFor(signedInAuthValue());

    // When
    renderHook(
      () => useSaveCalculatedHousehold({ ...CALCULATED_HOUSEHOLD, householdId: undefined }),
      { wrapper }
    );
    await settle();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the save fails then the failure goes no further', async () => {
    // Given
    fetchMock.mockImplementation(async () => errorResponse(503, 'Service unavailable'));
    const wrapper = wrapperFor(signedInAuthValue());
    const { rerender } = renderHook(() => useSaveCalculatedHousehold(CALCULATED_HOUSEHOLD), {
      wrapper,
    });

    // When
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await settle();

    // Then: the rejected save is handled (an unhandled rejection fails the
    // run), and the hook renders on.
    expect(() => rerender()).not.toThrow();
  });
});
