import { useMemo } from 'react';
import { createV2UserClient, type V2UserClient } from '@/api/v2UserClient';
import { useAuthStatus } from './AuthContext';
import { getBrowserUserId } from './browserUser';

/**
 * A PolicyEngine API client for this session: signed in, it sends the
 * session's access token; otherwise this browser's unauthenticated user.
 */
export function useV2UserClient(): V2UserClient {
  const { status, getAccessToken } = useAuthStatus();
  const browserUserId = status === 'signed_in' ? null : getBrowserUserId();
  return useMemo(
    () =>
      createV2UserClient({
        credentials: browserUserId
          ? { kind: 'unauthenticated', userId: browserUserId }
          : { kind: 'session', getAccessToken },
      }),
    [browserUserId, getAccessToken]
  );
}
