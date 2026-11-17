import { useCallback } from 'react';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAdminUser } from '@/api/v2AdminUsers';
import { isV2ApiError } from '@/api/v2UserClient';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import { isRefusedOrMissing, useReadMeAgainOnRefusal, type UserSearchData } from './useAdminUsers';

/** The mutation key of the deletion of one user's account, per signed-in session. */
function adminUserDeletionKey(subject: string | null, userId: string) {
  return [...adminUserKeys.all(subject), 'deletion', userId] as const;
}

/**
 * Whether a failed deletion deleted the user anyway: the Public API's own
 * 502 says the account's data was deleted, but some of the Auth0 users the
 * user signed in with were not, and its message says how to find them. A
 * 502 that the calculator's route or a proxy wrote says nothing of the kind.
 */
export function isDeletedWithAuth0UsersLeft(error: unknown): boolean {
  return isV2ApiError(error, 502) && error.fromPublicApi;
}

/**
 * Takes a user who no longer exists out of every loaded list of users.
 * Each list keeps only its first page, without the user, and reads that
 * page again: the deletion moved every later user one place up, so the
 * offsets of later pages are out of date, as `useAdminUserSearch` explains.
 */
function useForgetDeletedUser() {
  const { subject } = useAuthStatus();
  const queryClient = useQueryClient();
  return useCallback(
    async (userId: string) => {
      const searchesKey = adminUserKeys.searches(subject);
      // A read that started before the deletion would otherwise land after
      // it and list the user again.
      await queryClient.cancelQueries({ queryKey: searchesKey });
      for (const query of queryClient.getQueryCache().findAll({ queryKey: searchesKey })) {
        // A refused list shows the refusal, not its users, and writing data
        // would clear it. A list whose last read failed for a while (a 5xx,
        // a network error) still shows its users, so it drops the user too.
        if (query.state.status === 'error' && isRefusedOrMissing(query.state.error)) {
          continue;
        }
        queryClient.setQueryData<UserSearchData>(
          query.queryKey,
          (data) =>
            data && {
              pages: data.pages.slice(0, 1).map((page) => ({
                ...page,
                items: page.items.filter((listedUser) => listedUser.id !== userId),
              })),
              pageParams: data.pageParams.slice(0, 1),
            }
        );
      }
      void queryClient.invalidateQueries({ queryKey: searchesKey });
    },
    [queryClient, subject]
  );
}

/**
 * Deletes the account of the user with `userId`: the user, their saved
 * items and the Auth0 users they sign in with. Render it only for admins.
 *
 * Once the user is gone, the lists of users drop them and read their first
 * page again; that includes the Public API's 502, after which the data is
 * gone though some Auth0 users remain, and a 404, which means someone else
 * deleted the user first. After a 404 the user is read again too, so their
 * details say they no longer exist. A 403 reads `/v2/me` again, as for the
 * other admin requests. The Public API's other refusals (409, 503) delete
 * nothing. After a 500, a network error or an error the calculator's route
 * wrote (502, 504), whether the user was deleted is not known: nothing
 * changes here, and trying again answers 404 if the user is gone.
 */
export function useDeleteAdminUser(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  const forgetDeletedUser = useForgetDeletedUser();
  return useMutation({
    mutationKey: adminUserDeletionKey(subject, userId),
    mutationFn: () => readMeAgainOnRefusal(deleteAdminUser(client, userId)),
    onSuccess: () => forgetDeletedUser(userId),
    onError: async (error) => {
      if (isDeletedWithAuth0UsersLeft(error)) {
        await forgetDeletedUser(userId);
      } else if (isV2ApiError(error, 404)) {
        await forgetDeletedUser(userId);
        void queryClient.invalidateQueries({ queryKey: adminUserKeys.user(subject, userId) });
      }
    },
  });
}

/**
 * Whether the deletion of the user's account is under way. Reads of the
 * user may already find them gone then, before the deletion answers.
 */
export function useAdminUserDeletionUnderWay(userId: string): boolean {
  const { subject } = useAuthStatus();
  return useIsMutating({ mutationKey: adminUserDeletionKey(subject, userId) }) > 0;
}
