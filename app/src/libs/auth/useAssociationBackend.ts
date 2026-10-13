import { useCallback, useMemo, useRef } from 'react';
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

/**
 * A PolicyEngine API client bound to the session's access token. It asks
 * for the token at request time, so a request that waited for the
 * session to be restored carries the signed-in user's token.
 */
export function useV2UserClient(): V2UserClient {
  const { getAccessToken } = useAuthStatus();
  const latestGetAccessToken = useRef(getAccessToken);
  latestGetAccessToken.current = getAccessToken;
  return useMemo(
    () => createV2UserClient({ getAccessToken: () => latestGetAccessToken.current() }),
    []
  );
}

/** The backend for a session state in a country (see selectAssociationBackend). */
export function associationBackendFor({
  status,
  user,
  countryId,
  client,
}: {
  status: AuthStatus;
  user: Pick<MeItem, 'id'> | null;
  countryId: string | null;
  client: V2UserClient;
}): AssociationBackend {
  const mode = selectAssociationBackend({ status, user, countryId });
  if (mode === 'api' && user && isAssociationCountry(countryId)) {
    return { mode, ready: true, userId: user.id, countryId, client };
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
}

function useBackendCountry(countryIdOverride?: string | null): string | null {
  const contextCountry = useCountryContext();
  return countryIdOverride ?? contextCountry ?? null;
}

/** The backend for the session as it stands (not ready while it is being restored). */
export function useAssociationBackend(countryIdOverride?: string | null): AssociationBackend {
  const countryId = useBackendCountry(countryIdOverride);
  const { status, user } = useAuthStatus();
  const client = useV2UserClient();
  const userId = user?.id ?? null;

  return useMemo(
    () =>
      associationBackendFor({ status, user: userId ? { id: userId } : null, countryId, client }),
    [status, userId, countryId, client]
  );
}

/**
 * The backend saved-work writes should use: it waits until the session
 * is restored, then answers for how it settled. A signed-in user's write
 * issued while the session is restoring therefore goes to the account,
 * never to this browser; a signed-out visitor's waits only for the
 * restore and then goes to localStorage.
 */
export function useAssociationBackendResolver(
  countryIdOverride?: string | null
): () => Promise<AssociationBackend> {
  const countryId = useBackendCountry(countryIdOverride);
  const { settledSession } = useAuthStatus();
  const client = useV2UserClient();

  return useCallback(async () => {
    const { status, user } = await settledSession();
    return associationBackendFor({ status, user, countryId, client });
  }, [settledSession, countryId, client]);
}

/** The user ID that saved work is filed under right now. */
export function useCurrentUserId(): string {
  return useAssociationBackend().userId;
}
