import { useEffect, useState } from 'react';
import { Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import {
  invitationAcceptPath,
  invitationCountry,
  readPendingInvitationToken,
  takeInvitationTokenFromUrl,
} from '@/libs/invitations/pendingInvitation';

/**
 * What an invitation email's link opens (`/invitations/accept#token=…`),
 * outside the country routes: it keeps the token and removes it from the
 * address bar, then continues to the accept page in a country's workspace
 * (see invitationCountry), where sign-in and acceptance happen. When the
 * browser cannot keep the token (storage blocked), it says so and stays:
 * the token never travels on in an address.
 */
export default function InvitationLinkPage({
  onContinue,
}: {
  /** Replaces this page with `path`. */
  onContinue: (path: string) => void;
}) {
  const [storageBlocked, setStorageBlocked] = useState(false);

  useEffect(() => {
    const token = takeInvitationTokenFromUrl();
    if (token !== null && readPendingInvitationToken() !== token) {
      setStorageBlocked(true);
      return;
    }
    onContinue(invitationAcceptPath(invitationCountry()));
  }, [onContinue]);

  if (storageBlocked) {
    return (
      <Stack gap="md" align="start" style={{ padding: spacing['3xl'] }}>
        <Title order={1} style={{ margin: 0 }}>
          This browser is not keeping site data
        </Title>
        <Text style={{ margin: 0, color: colors.text.secondary }}>
          Your invitation has to be kept while you sign in. Allow this site to store data in your
          browser&apos;s settings, then open the link in the invitation email again.
        </Text>
      </Stack>
    );
  }
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
