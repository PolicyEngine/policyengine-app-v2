import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { CountryProvider } from '@/contexts/CountryContext';
import { useUserReportById } from '@/hooks/useUserReports';
import {
  householdAssociationKeys,
  policyAssociationKeys,
  simulationAssociationKeys,
} from '@/libs/queryKeys';
import { store } from '@/store';
import {
  ASSOCIATION_IDS,
  itemResponse,
  pageResponse,
  PE_USER_ID,
  reportItem,
} from '@/tests/fixtures/api/v2UserMocks';
import { AuthTestProvider, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

/**
 * The report page lists the session's saved simulations, policies and
 * households to label the report's ingredients. Those lists belong to the
 * signed-in user and wait for the report's own association.
 */

const ASSOCIATION_LIST_PATHS = ['/v2/user-simulations', '/v2/user-policies', '/v2/user-households'];

const fetchMock = vi.fn();
let releaseReportRow: () => void = () => {};

function pathOf(url: string): string {
  return new URL(url).pathname;
}

function associationListRequests(): string[] {
  return fetchMock.mock.calls
    .map(([url]) => pathOf(String(url)))
    .filter((path) => ASSOCIATION_LIST_PATHS.includes(path));
}

beforeEach(() => {
  fetchMock.mockReset();
  const reportRowReleased = new Promise<void>((resolve) => {
    releaseReportRow = resolve;
  });
  fetchMock.mockImplementation(async (url: string) => {
    const path = pathOf(url);
    if (path === `/v2/user-reports/${ASSOCIATION_IDS.REPORT}`) {
      await reportRowReleased;
      return itemResponse(reportItem());
    }
    if (ASSOCIATION_LIST_PATHS.includes(path)) {
      return pageResponse([]);
    }
    return new Response('', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useUserReportById ingredient labels', () => {
  test('given a signed-in report link then the saved-work lists wait for the report and use the session user', async () => {
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

    // When
    const { result } = renderHook(() => useUserReportById(ASSOCIATION_IDS.REPORT), { wrapper });
    await waitFor(() =>
      expect(fetchMock.mock.calls.map(([url]) => pathOf(String(url)))).toContain(
        `/v2/user-reports/${ASSOCIATION_IDS.REPORT}`
      )
    );

    // Then: nothing is listed under an empty user before the report loads
    expect(associationListRequests()).toEqual([]);

    // When
    releaseReportRow();
    await waitFor(() => expect(result.current.userReport?.id).toBe(ASSOCIATION_IDS.REPORT));
    await waitFor(() => expect(associationListRequests()).toHaveLength(3));

    // Then: the lists are cached for the signed-in user, not '' or the local user
    for (const keys of [
      simulationAssociationKeys,
      policyAssociationKeys,
      householdAssociationKeys,
    ]) {
      expect(queryClient.getQueryData(keys.byUser(PE_USER_ID, 'us'))).toEqual([]);
      expect(queryClient.getQueryData(keys.byUser('', 'us'))).toBeUndefined();
      expect(queryClient.getQueryData(keys.byUser(MOCK_USER_ID, 'us'))).toBeUndefined();
    }
  });
});
