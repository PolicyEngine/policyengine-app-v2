import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApiHouseholdStore, LocalStorageHouseholdStore } from '@/api/householdAssociation';
import { ApiPolicyStore, LocalStoragePolicyStore } from '@/api/policyAssociation';
import { ApiReportStore, LocalStorageReportStore } from '@/api/reportAssociation';
import { ApiSimulationStore, LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import { CountryProvider } from '@/contexts/CountryContext';
import { useHouseholdAssociationStoreForMode } from '@/hooks/useUserHousehold';
import { usePolicyAssociationStoreForMode } from '@/hooks/useUserPolicy';
import { useReportAssociationStoreForMode } from '@/hooks/useUserReportAssociations';
import { useSimulationAssociationStoreForMode } from '@/hooks/useUserSimulationAssociations';
import type { AuthContextValue, AuthStatus } from '@/libs/auth/AuthContext';
import {
  ACCOUNT_UNAVAILABLE_MESSAGE,
  AccountUnavailableError,
  selectAssociationBackend,
  UNAVAILABLE_ACCOUNT_USER_ID,
  useAssociationBackend,
  useCurrentUserId,
  type AssociationBackendMode,
} from '@/libs/auth/useAssociationBackend';
import type { CountryId } from '@/libs/countries';
import { mockMeItem, PE_USER_ID } from '@/tests/fixtures/api/v2UserMocks';
import {
  accountErrorAuthValue,
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

function wrapperFor(auth: AuthContextValue, countryId: CountryId) {
  return ({ children }: { children: React.ReactNode }) => (
    <CountryProvider value={countryId}>
      <AuthTestProvider value={auth}>{children}</AuthTestProvider>
    </CountryProvider>
  );
}

describe('selectAssociationBackend', () => {
  const statuses: AuthStatus[] = [
    'disabled',
    'loading',
    'anonymous',
    'authenticated',
    'account_error',
  ];
  const countries: CountryId[] = ['us', 'uk', 'ca', 'ng', 'il'];
  const expectedMode: Record<AuthStatus, AssociationBackendMode> = {
    disabled: 'localStorage',
    loading: 'localStorage',
    anonymous: 'localStorage',
    authenticated: 'api',
    account_error: 'unavailable',
  };

  test.each(statuses.flatMap((status) => countries.map((country) => [status, country] as const)))(
    'given status %s in %s then account storage is used only when signed in to US or UK',
    (status, countryId) => {
      const user = status === 'authenticated' ? mockMeItem : null;
      const expected =
        countryId === 'us' || countryId === 'uk' ? expectedMode[status] : 'localStorage';
      expect(selectAssociationBackend({ status, user, countryId })).toBe(expected);
    }
  );

  test('given a US session whose PolicyEngine user is missing then saved work is unavailable, not local', () => {
    expect(selectAssociationBackend({ status: 'authenticated', user: null, countryId: 'us' })).toBe(
      'unavailable'
    );
  });
});

describe('useAssociationBackend', () => {
  test('given a signed-in US session then saved work is filed under the PolicyEngine user', () => {
    const { result } = renderHook(() => useAssociationBackend(), {
      wrapper: wrapperFor(signedInAuthValue(), 'us'),
    });

    expect(result.current.mode).toBe('api');
    expect(result.current.userId).toBe(PE_USER_ID);
    expect(result.current.ready).toBe(true);
  });

  test('given a signed-in Canada session then saved work stays local under the local user', () => {
    const { result } = renderHook(() => useCurrentUserId(), {
      wrapper: wrapperFor(signedInAuthValue(), 'ca'),
    });

    expect(result.current).toBe(MOCK_USER_ID);
  });

  test('given the session is still loading then queries are told to wait', () => {
    const { result } = renderHook(() => useAssociationBackend(), {
      wrapper: wrapperFor(makeAuthValue({ status: 'loading' }), 'us'),
    });

    expect(result.current.mode).toBe('localStorage');
    expect(result.current.ready).toBe(false);
  });

  test('given the account could not be loaded then saved work neither loads nor saves', async () => {
    // Given
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = wrapperFor(accountErrorAuthValue(), 'us');

    // When
    const backend = renderHook(() => useAssociationBackend(), { wrapper }).result.current;
    const policyStore = renderHook(() => usePolicyAssociationStoreForMode(), { wrapper }).result
      .current.store;

    // Then
    expect(backend.mode).toBe('unavailable');
    expect(backend.ready).toBe(true);
    expect(backend.userId).toBe(UNAVAILABLE_ACCOUNT_USER_ID);
    expect(policyStore).toBeInstanceOf(ApiPolicyStore);
    await expect(policyStore.findByUser(backend.userId, 'us')).rejects.toBeInstanceOf(
      AccountUnavailableError
    );
    await expect(
      policyStore.create({ userId: backend.userId, policyId: '95762', countryId: 'us' })
    ).rejects.toThrow(ACCOUNT_UNAVAILABLE_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('given no auth provider then sign-in is disabled and storage is local', () => {
    const { result } = renderHook(() => useAssociationBackend('us'));

    expect(result.current.mode).toBe('localStorage');
    expect(result.current.userId).toBe(MOCK_USER_ID);
    expect(result.current.ready).toBe(true);
  });
});

describe('association store selection', () => {
  test('given a signed-in UK session then every association hook uses the account stores', () => {
    const wrapper = wrapperFor(signedInAuthValue(), 'uk');

    expect(
      renderHook(() => usePolicyAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(ApiPolicyStore);
    expect(
      renderHook(() => useHouseholdAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(ApiHouseholdStore);
    expect(
      renderHook(() => useSimulationAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(ApiSimulationStore);
    expect(
      renderHook(() => useReportAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(ApiReportStore);
  });

  test.each([
    ['signed out in the US', makeAuthValue({ status: 'anonymous' }), 'us'],
    ['sign-in disabled', makeAuthValue({ status: 'disabled' }), 'uk'],
    ['signed in in Nigeria', signedInAuthValue(), 'ng'],
  ] as const)('given %s then every association hook uses localStorage', (_, auth, countryId) => {
    const wrapper = wrapperFor(auth, countryId);

    expect(
      renderHook(() => usePolicyAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(LocalStoragePolicyStore);
    expect(
      renderHook(() => useHouseholdAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(LocalStorageHouseholdStore);
    expect(
      renderHook(() => useSimulationAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(LocalStorageSimulationStore);
    expect(
      renderHook(() => useReportAssociationStoreForMode(), { wrapper }).result.current.store
    ).toBeInstanceOf(LocalStorageReportStore);
  });
});
