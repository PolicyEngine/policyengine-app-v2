import { useEffect } from 'react';
import { Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import {
  invitationAcceptPath,
  invitationCountry,
  takeInvitationTokenFromUrl,
} from '@/libs/invitations/pendingInvitation';

/**
 * What an invitation email's link opens (`/invitations/accept#token=…`),
 * outside the country routes: it keeps the token and removes it from the
 * address bar, then continues to the accept page in a country's workspace
 * (see invitationCountry), where sign-in and acceptance happen.
 */
export default function InvitationLinkPage({
  onContinue,
}: {
  /** Replaces this page with `path`. */
  onContinue: (path: string) => void;
}) {
  useEffect(() => {
    takeInvitationTokenFromUrl();
    onContinue(invitationAcceptPath(invitationCountry()));
  }, [onContinue]);

  return (
    <Stack
      role="status"
      aria-live="polite"
      align="center"
      gap="md"
      style={{ padding: spacing['3xl'] }}
    >
      <Spinner size="sm" />
      <Text style={{ margin: 0, color: colors.text.secondary }}>Opening your invitation…</Text>
    </Stack>
  );
}
