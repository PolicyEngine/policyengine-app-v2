import { useMemo } from 'react';
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
 * storage (US, UK). Everything else — signed out, sign-in disabled,
 * Canada, Nigeria, Israel — keeps the localStorage behaviour unchanged.
 */

export type AssociationBackendMode = 'api' | 'localStorage';

export function selectAssociationBackend({
  status,
  user,
  countryId,
}: {
  status: AuthStatus;
  user: MeItem | null;
  countryId: string | null | undefined;
}): AssociationBackendMode {
  return status === 'authenticated' && !!user && isAssociationCountry(countryId)
    ? 'api'
    : 'localStorage';
}

export interface ApiAssociationBackend {
  mode: 'api';
  ready: true;
  /** The PolicyEngine user ID; query keys carry it so caches split per user. */
  userId: string;
  countryId: AssociationCountryId;
  client: V2UserClient;
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

export type AssociationBackend = ApiAssociationBackend | LocalAssociationBackend;

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
  const userId = user?.id ?? null;

  return useMemo<AssociationBackend>(() => {
    if (
      userId &&
      isAssociationCountry(countryId) &&
      selectAssociationBackend({ status, user: { id: userId } as MeItem, countryId }) === 'api'
    ) {
      return { mode: 'api', ready: true, userId, countryId, client };
    }
    return {
      mode: 'localStorage',
      ready: status !== 'loading',
      userId: MOCK_USER_ID,
      countryId,
      client: null,
    };
  }, [status, userId, countryId, client]);
}

/** The user ID that saved work is filed under right now. */
export function useCurrentUserId(): string {
  return useAssociationBackend().userId;
}
