import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

export type SessionGatedQueryOptions<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>, 'enabled'> & {
  enabled?: boolean;
};

/**
 * useQuery for saved work (associations, reforms, report records).
 *
 * Until the sign-in session is restored, nobody knows whether saved work
 * lives in the account or in this browser, so the query waits. A waiting
 * query has no data and is not fetching, which pages would read as
 * "nothing saved" or "not found"; it reports itself as loading instead.
 */
export function useSessionGatedQuery<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SessionGatedQueryOptions<TQueryFnData, TData, TQueryKey>,
  sessionReady: boolean
): UseQueryResult<TData, Error> {
  const wanted = options.enabled ?? true;
  const query = useQuery({ ...options, enabled: sessionReady && wanted });
  if (!sessionReady && wanted && query.status === 'pending') {
    return { ...query, isLoading: true };
  }
  return query;
}
