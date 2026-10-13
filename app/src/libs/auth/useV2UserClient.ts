import { useMemo } from 'react';
import { createV2UserClient, type V2UserClient } from '@/api/v2UserClient';
import { useAuthStatus } from './AuthContext';

/** A PolicyEngine API client that sends the session's access token. */
export function useV2UserClient(): V2UserClient {
  const { getAccessToken } = useAuthStatus();
  return useMemo(() => createV2UserClient({ getAccessToken }), [getAccessToken]);
}
