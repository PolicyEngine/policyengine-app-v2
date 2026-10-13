import { useMemo } from 'react';
import type { ApiStoreContext } from '@/api/v2Associations';
import { createV2UserClient, type V2UserClient } from '@/api/v2UserClient';
import { MOCK_USER_ID } from '@/constants';
import { useCountryContext } from '@/contexts/CountryContext';
import { isAssociationCountry, type AssociationCountryId, type MeItem } from '@/types/v2User';
import { useAuthStatus, type AuthStatus } from './AuthContext';

/**
 * The single switch between account storage and localStorage.
 *
 * Saved work goes to the PolicyEngine API only when the user is signed in
 * (and their PolicyEngine user has loaded) and the country has account
 * storage (US, UK). Signed out, sign-in disabled, Canada, Nigeria and
 * Israel keep the localStorage behaviour unchanged. A signed-in US or UK
 * session whose PolicyEngine user could not be loaded is 'unavailable':
 * its saved work neither loads nor saves, rather than quietly going to
 * this browser while the user appears signed in.
 */

export type AssociationBackendMode = 'api' | 'unavailable' | 'localStorage';

export function selectAssociationBackend({
  status,
  user,
  countryId,
}: {
  status: AuthStatus;
  user: Pick<MeItem, 'id'> | null;
  countryId: string | null | undefined;
}): AssociationBackendMode {
  if (!isAssociationCountry(countryId)) {
    return 'localStorage';
  }
  if (status === 'authenticated' || status === 'account_error') {
    return user ? 'api' : 'unavailable';
  }
  return 'localStorage';
}

export const ACCOUNT_UNAVAILABLE_MESSAGE =
  'Your PolicyEngine account could not be loaded. Try again from the account menu, or sign out to keep working on this device.';

/** What every account-store call fails with while the account cannot be loaded. */
export class AccountUnavailableError extends Error {
  constructor() {
    super(ACCOUNT_UNAVAILABLE_MESSAGE);
    this.name = 'AccountUnavailableError';
  }
}

/** A client that answers every request with `error` and sends nothing. */
export function createUnavailableClient(error: Error): V2UserClient {
  const fail = () => Promise.reject(error);
  return { request: fail, listAll: fail };
}

/**
 * Stands in for the PolicyEngine user ID while none is known; query keys
 * carry it, so nothing cached for it is reused once the account loads.
 */
export const UNAVAILABLE_ACCOUNT_USER_ID = 'account-unavailable';

export interface ApiAssociationBackend {
  mode: 'api';
  ready: true;
  /** The PolicyEngine user ID; query keys carry it so caches split per user. */
  userId: string;
  countryId: AssociationCountryId;
  client: V2UserClient;
}

export interface UnavailableAssociationBackend {
  mode: 'unavailable';
  /** Queries run, and fail with `error` straight away. */
  ready: true;
  userId: typeof UNAVAILABLE_ACCOUNT_USER_ID;
  countryId: AssociationCountryId;
  /** Rejects every request with `error`. */
  client: V2UserClient;
  error: AccountUnavailableError;
}

export interface LocalAssociationBackend {
  mode: 'localStorage';
  /** False while the session is still being restored; queries wait for it. */
  ready: boolean;
  /** MOCK_USER_ID: localStorage records are filed under it. Never sent to the API. */
  userId: string;
  countryId: string | null;
  client: null;
}

export type AssociationBackend =
  | ApiAssociationBackend
  | UnavailableAssociationBackend
  | LocalAssociationBackend;

/**
 * What the account stores are built from: the account when signed in, or
 * the unavailable account (whose every call fails), never localStorage.
 */
export function accountStoreContext(backend: AssociationBackend): ApiStoreContext | null {
  return backend.mode === 'localStorage' ? null : backend;
}

/** A PolicyEngine API client bound to the current session's access token. */
export function useV2UserClient(): V2UserClient {
  const { getAccessToken } = useAuthStatus();
  return useMemo(() => createV2UserClient({ getAccessToken }), [getAccessToken]);
}

export function useAssociationBackend(countryIdOverride?: string | null): AssociationBackend {
  const contextCountry = useCountryContext();
  const countryId = countryIdOverride ?? contextCountry ?? null;
  const { status, user } = useAuthStatus();
  const client = useV2UserClient();
  const mode = selectAssociationBackend({ status, user, countryId });
  const userId = user?.id ?? null;

  return useMemo<AssociationBackend>(() => {
    if (mode === 'api' && userId && isAssociationCountry(countryId)) {
      return { mode, ready: true, userId, countryId, client };
    }
    if (mode === 'unavailable' && isAssociationCountry(countryId)) {
      const error = new AccountUnavailableError();
      return {
        mode,
        ready: true,
        userId: UNAVAILABLE_ACCOUNT_USER_ID,
        countryId,
        client: createUnavailableClient(error),
        error,
      };
    }
    return {
      mode: 'localStorage',
      ready: status !== 'loading',
      userId: MOCK_USER_ID,
      countryId,
      client: null,
    };
  }, [mode, status, userId, countryId, client]);
}

/** The user ID that saved work is filed under right now. */
export function useCurrentUserId(): string {
  return useAssociationBackend().userId;
}
