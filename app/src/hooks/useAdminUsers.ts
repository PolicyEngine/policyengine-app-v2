import { useCallback, useEffect } from 'react';
import {
  focusManager,
  onlineManager,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import {
  changeAdminUserType,
  fetchAdminUser,
  fetchUserTypeChanges,
  searchAdminUsers,
  type AdminUserItem,
  type AdminUserPageResult,
  type SignedInUserType,
} from '@/api/v2AdminUsers';
import { isV2ApiError } from '@/api/v2UserClient';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import type { MeItem } from '@/types/v2User';
import { meQueryKey } from './useMe';

/**
 * Hooks for the admin users page. They call routes only admins may use, so
 * render them only for admins (inside `<MinimumUserType minimum="admin">`).
 */

/** How many users one page of the list or a search reads. */
export const ADMIN_USER_PAGE_SIZE = 50;

/** react-query's own number of retries, when the query client sets none. */
const REACT_QUERY_DEFAULT_RETRIES = 3;

type UserSearchData = InfiniteData<AdminUserPageResult, number>;

/**
 * Whether an admin route refused (403: the signed-in user is no longer an
 * admin) or found no such user (404). Reading again answers the same, so
 * these are not retried and earlier data is not shown in their place.
 */
export function isRefusedOrMissing(error: unknown): boolean {
  return isV2ApiError(error, 403) || isV2ApiError(error, 404);
}

/** Retries temporary failures only (network errors, 5xx), as often as the client's default would. */
function retryTemporaryFailures(queryClient: QueryClient) {
  const defaultRetry = queryClient.getDefaultOptions().queries?.retry;
  return (failureCount: number, error: Error): boolean => {
    if (isRefusedOrMissing(error)) {
      return false;
    }
    if (typeof defaultRetry === 'function') {
      return defaultRetry(failureCount, error);
    }
    if (typeof defaultRetry === 'number') {
      return failureCount < defaultRetry;
    }
    if (typeof defaultRetry === 'boolean') {
      return defaultRetry;
    }
    return failureCount < REACT_QUERY_DEFAULT_RETRIES;
  };
}

/**
 * Wraps an admin request so that a 403 reads `/v2/me` again: the signed-in
 * user may have been demoted, and once `/v2/me` says so the page shows
 * "Page not found".
 */
function useReadMeAgainOnRefusal() {
  const { subject } = useAuthStatus();
  const countryId = useCountryContext();
  const queryClient = useQueryClient();
  return useCallback(
    <Result>(request: Promise<Result>): Promise<Result> =>
      request.catch((error: unknown) => {
        if (isV2ApiError(error, 403)) {
          // Several refusals at once share one /v2/me read.
          void queryClient.invalidateQueries(
            { queryKey: meQueryKey(subject, countryId) },
            { cancelRefetch: false }
          );
        }
        throw error;
      }),
    [queryClient, subject, countryId]
  );
}

/**
 * Signed-in users whose email contains `email` (every user when empty),
 * newest first, a page at a time.
 *
 * It is read again when the page shows it again, when the window regains
 * focus and when the browser reconnects, but only its first page: what was
 * loaded after it is dropped, and "Load more" continues from the first
 * page. react-query's own re-read would read every loaded page again, one
 * after another.
 */
export function useAdminUserSearch(email: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  const search = useInfiniteQuery({
    queryKey: adminUserKeys.search(subject, email),
    queryFn: ({ pageParam }) =>
      readMeAgainOnRefusal(
        searchAdminUsers(client, { email, offset: pageParam, limit: ADMIN_USER_PAGE_SIZE })
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.offset + lastPage.items.length : undefined,
    staleTime: 0,
    // The effect below reads the first page again instead.
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: retryTemporaryFailures(queryClient),
  });

  useEffect(() => {
    const queryKey = adminUserKeys.search(subject, email);
    const readFirstPageAgain = () => {
      const searchState = queryClient.getQueryState<UserSearchData>(queryKey);
      if (searchState?.data === undefined) {
        return;
      }
      // Writing the shorter data would also clear an error, and show the
      // earlier users again in place of a refusal.
      if (searchState.status !== 'error') {
        queryClient.setQueryData<UserSearchData>(
          queryKey,
          (data) =>
            data && { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
        );
      }
      void queryClient.invalidateQueries({ queryKey, exact: true });
    };
    // A search read before, shown again.
    readFirstPageAgain();
    const stopWatchingFocus = focusManager.subscribe((focused) => {
      if (focused) {
        readFirstPageAgain();
      }
    });
    const stopWatchingConnection = onlineManager.subscribe((online) => {
      if (online) {
        readFirstPageAgain();
      }
    });
    return () => {
      stopWatchingFocus();
      stopWatchingConnection();
    };
  }, [queryClient, subject, email]);

  return search;
}

/**
 * Starts a search for `email` from its first page, discarding what an
 * earlier search for the same text read, so submitting it again reads the
 * users again.
 */
export function useStartAdminUserSearch() {
  const { subject } = useAuthStatus();
  const queryClient = useQueryClient();
  return useCallback(
    (email: string) =>
      queryClient.resetQueries({ queryKey: adminUserKeys.search(subject, email), exact: true }),
    [queryClient, subject]
  );
}

/**
 * One user. Admin data is never kept fresh: another admin, or the type
 * script, can change it at any time, so each mount and each return to the
 * window reads it again, whatever the calculator's defaults.
 */
export function useAdminUser(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useQuery({
    queryKey: adminUserKeys.user(subject, userId),
    queryFn: () => readMeAgainOnRefusal(fetchAdminUser(client, userId)),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: retryTemporaryFailures(queryClient),
  });
}

/** Reads the user from the API now, whatever is cached, and stores the answer in the cache. */
export function useReadAdminUserNow() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useCallback(
    (userId: string): Promise<AdminUserItem> =>
      queryClient.fetchQuery({
        queryKey: adminUserKeys.user(subject, userId),
        queryFn: () => readMeAgainOnRefusal(fetchAdminUser(client, userId)),
        staleTime: 0,
      }),
    [client, queryClient, subject, readMeAgainOnRefusal]
  );
}

/** The user's type changes, read again like `useAdminUser`. */
export function useUserTypeChanges(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useQuery({
    queryKey: adminUserKeys.typeChanges(subject, userId),
    queryFn: () => readMeAgainOnRefusal(fetchUserTypeChanges(client, userId)),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: retryTemporaryFailures(queryClient),
  });
}

/**
 * Changes a user's type. It resolves as soon as the PATCH answers: reads
 * of the user and the lists still under way are cancelled, the answer is
 * written into the user's cache entry and into the user's row in every
 * loaded list, and the user's type changes are read again without
 * waiting. `/v2/me` is read again only when the changed user is the
 * signed-in admin. After a 404 the user is read again, to show it is gone.
 */
export function useChangeUserType() {
  const { subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useMutation({
    mutationFn: ({ userId, userType }: { userId: string; userType: SignedInUserType }) =>
      readMeAgainOnRefusal(changeAdminUserType(client, userId, userType)),
    onSuccess: async (changedUser) => {
      // A read that started before the PATCH would otherwise land after it
      // and overwrite its answer.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: adminUserKeys.user(subject, changedUser.id) }),
        queryClient.cancelQueries({ queryKey: adminUserKeys.searches(subject) }),
      ]);
      queryClient.setQueryData(adminUserKeys.user(subject, changedUser.id), changedUser);
      queryClient.setQueriesData<UserSearchData>(
        { queryKey: adminUserKeys.searches(subject) },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((listedUser) =>
                listedUser.id === changedUser.id ? changedUser : listedUser
              ),
            })),
          }
      );
      void queryClient.invalidateQueries({
        queryKey: adminUserKeys.typeChanges(subject, changedUser.id),
      });
      const signedInUser = queryClient.getQueryData<MeItem>(meQueryKey(subject, countryId));
      if (signedInUser?.id === changedUser.id) {
        void queryClient.invalidateQueries({ queryKey: meQueryKey(subject, countryId) });
      }
    },
    onError: (error, { userId }) => {
      if (isV2ApiError(error, 404)) {
        void queryClient.invalidateQueries({ queryKey: adminUserKeys.user(subject, userId) });
      }
    },
  });
}
