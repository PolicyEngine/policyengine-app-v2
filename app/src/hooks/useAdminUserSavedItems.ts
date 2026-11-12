import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminUserSavedItems } from '@/api/v2AdminUserSavedItems';
import { isV2ApiError } from '@/api/v2UserClient';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import { retryTemporaryFailures, useReadMeAgainOnRefusal } from './useAdminUsers';

/**
 * A signed-in user's saved policies, households, simulations and reports,
 * read-only. Like the other admin hooks, render it only for admins.
 *
 * The Public API records every read with the admin's and the user's IDs,
 * so this reads only when it mounts (render it once the admin asks), and
 * not again when the window regains focus or the browser reconnects. The
 * answer is dropped from the cache once nothing shows it, so each showing
 * waits for its own read, and so shows only what a recorded read
 * returned. A 403 reads `/v2/me` again, as the other admin reads do; a
 * 404 means the user is gone, so the user is read again too, and the
 * details then say so.
 */
export function useAdminUserSavedItems(userId: string) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useQuery({
    queryKey: adminUserKeys.savedItems(subject, userId),
    queryFn: () =>
      readMeAgainOnRefusal(fetchAdminUserSavedItems(client, userId)).catch((error: unknown) => {
        if (isV2ApiError(error, 404)) {
          void queryClient.invalidateQueries({ queryKey: adminUserKeys.user(subject, userId) });
        }
        throw error;
      }),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: retryTemporaryFailures(queryClient),
  });
}
