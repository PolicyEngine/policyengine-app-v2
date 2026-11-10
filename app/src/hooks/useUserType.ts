import { isUserType, type UserType } from '@/types/v2User';
import { useMe, useMeRequestCountry } from './useMe';

/**
 * The current user's type, or null while it is not known yet.
 *
 * - Signed out, with sign-in off, or outside the countries with accounts:
 *   `unauthenticated`, with no request.
 * - Signed in: the type `GET /v2/me` last returned for this session and
 *   country. A refetch that fails keeps it, as react-query keeps the data.
 *   A type this app does not know reads as `unauthenticated`.
 * - Signed in, before /v2/me has answered (while it is pending, or after it
 *   failed without an answer): null.
 */
export function useUserType(): UserType | null {
  const requestCountryId = useMeRequestCountry();
  const me = useMe();
  if (requestCountryId === null) {
    return 'unauthenticated';
  }
  if (me.data === undefined) {
    return null;
  }
  return isUserType(me.data.user_type) ? me.data.user_type : 'unauthenticated';
}
