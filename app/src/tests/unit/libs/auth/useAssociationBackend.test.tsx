import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { CountryProvider } from '@/contexts/CountryContext';
import type { AuthContextValue, AuthStatus } from '@/libs/auth/AuthContext';
import {
  selectAssociationBackend,
  useAssociationBackend,
  useCurrentUserId,
  type AssociationBackendMode,
} from '@/libs/auth/useAssociationBackend';
import type { CountryId } from '@/libs/countries';
import { mockMeItem, PE_USER_ID } from '@/tests/fixtures/api/v2UserMocks';
import {
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

  test('given no auth provider then sign-in is disabled and storage is local', () => {
    const { result } = renderHook(() => useAssociationBackend('us'));

    expect(result.current.mode).toBe('localStorage');
    expect(result.current.userId).toBe(MOCK_USER_ID);
    expect(result.current.ready).toBe(true);
  });
});
