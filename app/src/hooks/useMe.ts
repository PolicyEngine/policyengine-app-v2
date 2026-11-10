import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/api/v2Me';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { isAssociationCountry } from '@/types/v2User';

/** The cache key of `GET /v2/me`: one entry per signed-in session and country. */
export function meQueryKey(subject: string | null, countryId: string | null) {
  return ['account', subject, countryId] as const;
}

/**
 * The signed-in PolicyEngine user, from `GET /v2/me`. The account page and
 * `useUserType` both read it, so they share one request per session and
 * country. It requests nothing unless signed in to the US or UK, the
 * countries with accounts; until then the query stays pending.
 */
export function useMe() {
  const auth = useAuthStatus();
  const client = useV2UserClient();
  const countryId = useCountryContext();
  const accountCountryId =
    auth.status === 'signed_in' && isAssociationCountry(countryId) ? countryId : null;
  return useQuery({
    queryKey: meQueryKey(auth.subject, countryId),
    queryFn: accountCountryId ? () => fetchMe(client, accountCountryId) : skipToken,
  });
}
