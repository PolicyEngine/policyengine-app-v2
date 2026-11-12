import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInvitation, isEmailNotVerified } from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { clearPendingInvitationToken } from '@/libs/invitations/pendingInvitation';
import { meQueryKey } from './useMe';

/** How often a temporary failure (no network, a 5xx such as Auth0 being unreachable) is retried. */
const TEMPORARY_FAILURE_RETRIES = 3;

function isTemporaryFailure(error: unknown): boolean {
  return isV2ApiError(error) && (error.status === 0 || error.status >= 500);
}

/**
 * Whether the acceptance was refused for good: the token names no pending
 * invitation (410), is not a token at all (422), or the inviting admin is
 * no longer an admin (a 409 other than `email_not_verified`).
 */
export function isFinalRefusal(error: unknown): boolean {
  return (
    isV2ApiError(error, 410) ||
    isV2ApiError(error, 422) ||
    (isV2ApiError(error, 409) && !isEmailNotVerified(error))
  );
}

/**
 * Accepts an invitation for the signed-in user. Temporary failures are
 * retried, with the query client's delay. Once accepted, or refused for
 * good, the saved token is forgotten; an unverified email or another
 * account's address (403) keeps it, to try again. An accepted invitation
 * writes the user it returns into `/v2/me`'s cache, so the new type, and
 * its type change, show at once.
 */
export function useAcceptInvitation() {
  const { subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(client, token),
    retry: (failureCount, error) =>
      isTemporaryFailure(error) && failureCount < TEMPORARY_FAILURE_RETRIES,
    onSuccess: (result, token) => {
      clearPendingInvitationToken(token);
      queryClient.setQueryData(meQueryKey(subject, countryId), result.item);
    },
    onError: (error, token) => {
      if (isFinalRefusal(error)) {
        clearPendingInvitationToken(token);
      }
    },
  });
}
