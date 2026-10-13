import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useFlagshipReport } from '@/hooks/useFlagshipReport';
import { useHouseholdAssociationsByUser } from '@/hooks/useUserHousehold';
import { usePolicyAssociationsByUser } from '@/hooks/useUserPolicy';
import {
  useReportAssociationById,
  useReportAssociationsByUser,
} from '@/hooks/useUserReportAssociations';
import { useUserReportById } from '@/hooks/useUserReports';
import { useSimulationAssociationsByUser } from '@/hooks/useUserSimulationAssociations';
import { useSessionGatedQuery } from '@/hooks/utils/useSessionGatedQuery';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { useCurrentUserId } from '@/libs/auth/useAssociationBackend';
import { store } from '@/store';
import { AuthTestProvider, makeAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const LOCAL_REPORT_ID = 'sur-local1';

function setup(initialAuth: AuthContextValue) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let auth = initialAuth;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value="us">
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
  return {
    wrapper,
    setAuth: (next: AuthContextValue) => {
      auth = next;
    },
  };
}

const restoring = () => makeAuthValue({ status: 'loading' });
const signedOut = () => makeAuthValue({ status: 'anonymous' });

beforeEach(() => {
  localStorage.clear();
});

describe('useSessionGatedQuery', () => {
  test('given the session is being restored then the query waits and reports loading', () => {
    // Given
    const { wrapper } = setup(restoring());
    const queryFn = vi.fn().mockResolvedValue(['saved']);

    // When
    const { result } = renderHook(
      () => useSessionGatedQuery({ queryKey: ['gated'], queryFn }, false),
      { wrapper }
    );

    // Then
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(queryFn).not.toHaveBeenCalled();
  });

  test('given the caller disabled the query then waiting for the session is not reported as loading', () => {
    // Given
    const { wrapper } = setup(restoring());
    const queryFn = vi.fn();

    // When
    const { result } = renderHook(
      () => useSessionGatedQuery({ queryKey: ['gated-off'], queryFn, enabled: false }, false),
      { wrapper }
    );

    // Then
    expect(result.current.isLoading).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  test('given the session is ready then the query runs', async () => {
    // Given
    const { wrapper } = setup(signedOut());
    const queryFn = vi.fn().mockResolvedValue(['saved']);

    // When
    const { result } = renderHook(
      () => useSessionGatedQuery({ queryKey: ['gated-ready'], queryFn }, true),
      { wrapper }
    );

    // Then
    await waitFor(() => expect(result.current.data).toEqual(['saved']));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});

describe('saved-work hooks while the sign-in session is being restored', () => {
  const savedWorkLists: Array<[string, () => { isLoading: boolean; data: unknown }]> = [
    ['policies', () => usePolicyAssociationsByUser(useCurrentUserId())],
    ['households', () => useHouseholdAssociationsByUser(useCurrentUserId())],
    ['simulations', () => useSimulationAssociationsByUser(useCurrentUserId())],
    ['reports', () => useReportAssociationsByUser(useCurrentUserId())],
  ];

  test.each(savedWorkLists)(
    'given saved %s are requested then they load instead of reading as empty',
    (_, useList) => {
      // Given
      const { wrapper } = setup(restoring());

      // When
      const { result } = renderHook(useList, { wrapper });

      // Then
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    }
  );

  test('given the session settles signed out then the lists resolve from this browser', async () => {
    // Given
    const { wrapper, setAuth } = setup(restoring());
    const { result, rerender } = renderHook(() => useReportAssociationsByUser(useCurrentUserId()), {
      wrapper,
    });
    expect(result.current.isLoading).toBe(true);

    // When
    setAuth(signedOut());
    rerender();

    // Then
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(result.current.isLoading).toBe(false);
  });

  test('given a report link then the association loads instead of reading as not found', () => {
    // Given
    const { wrapper } = setup(restoring());

    // When
    const { result } = renderHook(() => useReportAssociationById(LOCAL_REPORT_ID), { wrapper });

    // Then
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  test('given a saved report then the report page data is loading, not missing', () => {
    // Given
    const { wrapper } = setup(restoring());

    // When
    const { result } = renderHook(() => useUserReportById(LOCAL_REPORT_ID), { wrapper });

    // Then
    expect(result.current.isLoading).toBe(true);
    expect(result.current.report).toBeUndefined();
  });

  test('given a flagship sur- link then it is loading, not unresolvable', () => {
    // Given
    const { wrapper } = setup(restoring());

    // When
    const { result } = renderHook(() => useFlagshipReport(LOCAL_REPORT_ID), { wrapper });

    // Then
    expect(result.current.isLoading).toBe(true);
    expect(result.current.report).toBeUndefined();
  });
});
