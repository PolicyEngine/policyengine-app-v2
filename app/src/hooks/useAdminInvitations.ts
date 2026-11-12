import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  type NewInvitation,
  type UserInvitationItem,
} from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { adminUserKeys } from '@/libs/queryKeys';
import { retryTemporaryFailures, useReadMeAgainOnRefusal } from './useAdminUsers';

/**
 * Hooks for the admin page's invitations. They call routes only admins may
 * use, so render them only for admins, as `useAdminUsers`' hooks.
 */

/** The pending invitations' cache key, beside the admin user routes' keys of the same session. */
export function pendingInvitationsKey(subject: string | null) {
  return [...adminUserKeys.all(subject), 'invitations'] as const;
}

/**
 * Writes `change` into the cached list once reads still under way are
 * cancelled (one answered before the change would overwrite it), then
 * reads the list again without waiting.
 */
async function updatePendingInvitations(
  queryClient: QueryClient,
  subject: string | null,
  change: (invitations: UserInvitationItem[]) => UserInvitationItem[]
) {
  const queryKey = pendingInvitationsKey(subject);
  await queryClient.cancelQueries({ queryKey, exact: true });
  queryClient.setQueryData<UserInvitationItem[]>(queryKey, (invitations) =>
    invitations ? change(invitations) : invitations
  );
  void queryClient.invalidateQueries({ queryKey, exact: true });
}

/**
 * The pending invitations, newest first. Another admin can change them at
 * any time, so each mount and each return to the window reads them again.
 */
export function usePendingInvitations() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useQuery({
    queryKey: pendingInvitationsKey(subject),
    queryFn: () => readMeAgainOnRefusal(listInvitations(client)),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: retryTemporaryFailures(queryClient),
  });
}

/**
 * Invites an address and lists the invitation first, in place of any
 * pending one to the same address (the API replaces it).
 */
export function useSendInvitation() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  return useMutation({
    mutationFn: (invitation: NewInvitation) =>
      readMeAgainOnRefusal(createInvitation(client, invitation)),
    onSuccess: (created) =>
      updatePendingInvitations(queryClient, subject, (invitations) => [
        created,
        ...invitations.filter(
          (invitation) =>
            invitation.id !== created.id &&
            invitation.email.toLowerCase() !== created.email.toLowerCase()
        ),
      ]),
  });
}

/**
 * Reads the list again when the API no longer has the invitation pending
 * (404: accepted, revoked or expired since the list was read).
 */
function useReadListAgainWhenGone() {
  const { subject } = useAuthStatus();
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (isV2ApiError(error, 404)) {
      void queryClient.invalidateQueries({
        queryKey: pendingInvitationsKey(subject),
        exact: true,
      });
    }
  };
}

/** Sends a pending invitation again, with a new link, and shows its new state in the list. */
export function useResendInvitation() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  const readListAgainWhenGone = useReadListAgainWhenGone();
  return useMutation({
    mutationFn: (invitation: UserInvitationItem) =>
      readMeAgainOnRefusal(resendInvitation(client, invitation.id)),
    onSuccess: (resent) =>
      updatePendingInvitations(queryClient, subject, (invitations) =>
        invitations.map((invitation) => (invitation.id === resent.id ? resent : invitation))
      ),
    onError: readListAgainWhenGone,
  });
}

/** Revokes a pending invitation and removes it from the list. */
export function useRevokeInvitation() {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgainOnRefusal = useReadMeAgainOnRefusal();
  const readListAgainWhenGone = useReadListAgainWhenGone();
  return useMutation({
    mutationFn: (invitation: UserInvitationItem) =>
      readMeAgainOnRefusal(revokeInvitation(client, invitation.id)),
    onSuccess: (_result, revoked) =>
      updatePendingInvitations(queryClient, subject, (invitations) =>
        invitations.filter((invitation) => invitation.id !== revoked.id)
      ),
    onError: readListAgainWhenGone,
  });
}
