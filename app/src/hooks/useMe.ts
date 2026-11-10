import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/api/v2Me';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { isAssociationCountry, type AssociationCountryId } from '@/types/v2User';

/** The cache key of `GET /v2/me`: one entry per signed-in session and country. */
export function meQueryKey(subject: string | null, countryId: string | null) {
  return ['account', subject, countryId] as const;
}

/**
 * The country `useMe` requests `GET /v2/me` for: the current country while
 * signed in to the US or UK, the countries with accounts. Null otherwise,
 * when nothing is requested.
 */
export function useMeRequestCountry(): AssociationCountryId | null {
  const auth = useAuthStatus();
  const countryId = useCountryContext();
  return auth.status === 'signed_in' && isAssociationCountry(countryId) ? countryId : null;
}

/**
 * The signed-in PolicyEngine user, from `GET /v2/me`. The account page and
 * `useUserType` both read it, so they share one request per session and
 * country. It requests nothing unless signed in to the US or UK (see
 * `useMeRequestCountry`); until then the query stays pending.
 */
export function useMe() {
  const auth = useAuthStatus();
  const client = useV2UserClient();
  const countryId = useCountryContext();
  const requestCountryId = useMeRequestCountry();
  return useQuery({
    queryKey: meQueryKey(auth.subject, countryId),
    queryFn: requestCountryId ? () => fetchMe(client, requestCountryId) : skipToken,
  });
}
