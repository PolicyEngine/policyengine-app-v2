import { useMemo } from 'react';
import { createV2UserClient, type V2UserClient } from '@/api/v2UserClient';
import { useCountryContext } from '@/contexts/CountryContext';
import { isAssociationCountry } from '@/types/v2User';
import { useAuthStatus } from './AuthContext';
import { getBrowserUserId } from './browserUser';

/**
 * A PolicyEngine API client for this session: signed in, it sends the
 * session's access token; signed out in the US or UK, this browser's
 * unauthenticated user. With sign-in off, and outside the US and UK,
 * nothing is saved to the API, so no browser user is made and the client
 * sends no credential.
 */
export function useV2UserClient(): V2UserClient {
  const { status, getAccessToken } = useAuthStatus();
  const countryId = useCountryContext();
  const browserUserId =
    status === 'signed_out' && isAssociationCountry(countryId) ? getBrowserUserId() : null;
  return useMemo(
    () =>
      createV2UserClient({
        credentials:
          status === 'signed_in'
            ? { kind: 'session', getAccessToken }
            : browserUserId
              ? { kind: 'unauthenticated', userId: browserUserId }
              : { kind: 'none' },
      }),
    [status, browserUserId, getAccessToken]
  );
}
