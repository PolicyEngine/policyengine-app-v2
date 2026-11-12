import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInvitation, invitationRefusalCode } from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { clearPendingInvitationToken } from '@/libs/invitations/pendingInvitation';
import type { AssociationCountryId } from '@/types/v2User';
import { meQueryKey } from './useMe';

/** How often a temporary failure (no network, a 5xx such as Auth0 being unreachable) is retried. */
const TEMPORARY_FAILURE_RETRIES = 3;

function isTemporaryFailure(error: unknown): boolean {
  return isV2ApiError(error) && (error.status === 0 || error.status >= 500);
}

/**
 * Whether the acceptance was refused for good, so the token can never
 * work: it names no open, unexpired invitation (410), is not a token at
 * all (422), or the inviting admin is no longer an admin (409
 * `inviter_not_admin`).
 */
export function isFinalRefusal(error: unknown): boolean {
  return (
    isV2ApiError(error, 410) ||
    isV2ApiError(error, 422) ||
    invitationRefusalCode(error) === 'inviter_not_admin'
  );
}

/**
 * Accepts an invitation for the signed-in user, in `countryId`. Temporary
 * failures are retried, with the query client's delay. Once accepted, or
 * refused for good, the saved token is forgotten; an unverified email or
 * another account's address keeps it, to try again. An accepted
 * invitation, or one accepted already, reads `/v2/me` again, so the new
 * type and its type change show.
 */
export function useAcceptInvitation(countryId: AssociationCountryId) {
  const { subject } = useAuthStatus();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  const readMeAgain = () =>
    void queryClient.invalidateQueries({ queryKey: meQueryKey(subject, countryId) });
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(client, countryId, token),
    retry: (failureCount, error) =>
      isTemporaryFailure(error) && failureCount < TEMPORARY_FAILURE_RETRIES,
    onSuccess: (_acceptance, token) => {
      clearPendingInvitationToken(token);
      readMeAgain();
    },
    onError: (error, token) => {
      if (isFinalRefusal(error)) {
        clearPendingInvitationToken(token);
      }
      if (invitationRefusalCode(error) === 'invitation_accepted') {
        readMeAgain();
      }
    },
  });
}
