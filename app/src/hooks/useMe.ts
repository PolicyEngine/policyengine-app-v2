import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/api/v2Me';
import { useCountryContext } from '@/contexts/CountryContext';
import { useCurrentPathname } from '@/contexts/LocationContext';
import { isCallbackPath } from '@/libs/auth/authConfig';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { queryConfig } from '@/libs/queryConfig';
import { isAssociationCountry, type AssociationCountryId } from '@/types/v2User';

/**
 * The cache key of `GET /v2/me`: one entry per Auth0 subject and country.
 * A signed-out visitor's entry (subject null) stays idle, since nothing is
 * requested for it.
 */
export function meQueryKey(subject: string | null, countryId: string | null) {
  return ['account', subject, countryId] as const;
}

/**
 * Whether this page is the sign-in callback (`/{country}/callback`), where
 * `GET /v2/me` is never requested. The callback page sends
 * `POST /v2/me/upgrade`, and on a first sign-in a `GET /v2/me` racing it
 * can create the account first; the upgrade then merges this browser's
 * unauthenticated user into that new account instead of converting it.
 */
export function useIsSignInCallback(): boolean {
  return isCallbackPath(useCurrentPathname());
}

/**
 * The country `useMe` requests `GET /v2/me` for: the current country while
 * signed in to the US or UK, the countries with accounts, except on the
 * sign-in callback. Null otherwise, when nothing is requested.
 */
export function useMeRequestCountry(): AssociationCountryId | null {
  const auth = useAuthStatus();
  const countryId = useCountryContext();
  const onSignInCallback = useIsSignInCallback();
  return auth.status === 'signed_in' && isAssociationCountry(countryId) && !onSignInCallback
    ? countryId
    : null;
}

/**
 * The signed-in PolicyEngine user, from `GET /v2/me`. The account page and
 * `useUserType` both read it, so they share one request per session and
 * country. It requests nothing unless signed in to the US or UK (see
 * `useMeRequestCountry`); until then the query stays pending.
 *
 * Its answer stays fresh for the Public API's usual five minutes, whatever
 * the query client's defaults, so a component that starts reading it later,
 * such as a `MinimumUserType` the account page shows once the user is known,
 * reads the same answer instead of requesting it again.
 */
export function useMe() {
  const auth = useAuthStatus();
  const client = useV2UserClient();
  const countryId = useCountryContext();
  const requestCountryId = useMeRequestCountry();
  return useQuery({
    queryKey: meQueryKey(auth.subject, countryId),
    queryFn: requestCountryId ? () => fetchMe(client, requestCountryId) : skipToken,
    staleTime: queryConfig.api.staleTime,
  });
}
