import { useAuthStatus } from '@/libs/auth/AuthContext';
import { isUserType, type UserType } from '@/types/v2User';
import { useMe } from './useMe';

/**
 * The current user's type: the signed-in user's stored type from
 * `GET /v2/me`. Until that is known the type is `unauthenticated`, below
 * every signed-in type: while signed out or with sign-in off, outside the
 * countries with accounts, while the request is pending, when it fails, and
 * when the API sends a type this app does not know.
 */
export function useUserType(): UserType {
  const auth = useAuthStatus();
  const me = useMe();
  if (auth.status !== 'signed_in' || !me.isSuccess) {
    return 'unauthenticated';
  }
  return isUserType(me.data.user_type) ? me.data.user_type : 'unauthenticated';
}
