import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAdminUser } from '@/api/v2AdminUsers';
import { isV2ApiError } from '@/api/v2UserClient';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import { useReadMeAgainOnRefusal, type UserSearchData } from './useAdminUsers';

/**
 * Whether a failed deletion deleted the user anyway: the Public API's 502
 * says the account's data was deleted, but some of the Auth0 users the
 * user signed in with were not, and its message says how to find them.
 */
export function isDeletedWithAuth0UsersLeft(error: unknown): boolean {
  return isV2ApiError(error, 502);
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
        // Writing data would also clear an error, and show earlier users in
        // place of a refusal; the read below replaces them anyway.
        if (query.state.status === 'error') {
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
 * Deletes a user's account: the user, their saved items and the Auth0 users
 * they sign in with. Render it only for admins.
 *
 * Once the user is gone, the lists of users drop them and read their first
 * page again; that includes a 502, after which the data is gone though some
 * Auth0 users remain, and a 404, which means someone else deleted the user
 * first. After a 404 the user is read again too, so their details say they
 * no longer exist. A 403 reads `/v2/me` again, as for the other admin
 * requests. Other refusals (409, 503) delete nothing and change nothing.
 */
export function useDeleteAdminUser() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  const forgetDeletedUser = useForgetDeletedUser();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      readMeAgainOnRefusal(deleteAdminUser(client, userId)),
    onSuccess: (_answer, { userId }) => forgetDeletedUser(userId),
    onError: async (error, { userId }) => {
      if (isDeletedWithAuth0UsersLeft(error)) {
        await forgetDeletedUser(userId);
      } else if (isV2ApiError(error, 404)) {
        await forgetDeletedUser(userId);
        void queryClient.invalidateQueries({ queryKey: adminUserKeys.user(subject, userId) });
      }
    },
  });
}
