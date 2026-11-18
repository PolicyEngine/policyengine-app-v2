import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { focusManager } from '@tanstack/react-query';
import {
  invitationRefusalCode,
  isEmailNotVerified,
  type InvitationAcceptance,
} from '@/api/v2Invitations';
import { USER_TYPE_LABELS } from '@/components/admin/adminUserFormat';
import { AppLink } from '@/components/AppLink';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { isFinalRefusal, useAcceptInvitation } from '@/hooks/useInvitationAcceptance';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import {
  invitationAcceptPath,
  readPendingInvitationToken,
  takeInvitationTokenFromUrl,
} from '@/libs/invitations/pendingInvitation';
import type { AssociationCountryId, UserType } from '@/types/v2User';

/** The page fills the workspace's content area, which sets its own padding. */
function PageShell({ children }: { children: ReactNode }) {
  return (
    <Stack gap="md" align="start">
      {children}
    </Stack>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <Title order={1} style={{ margin: 0 }}>
      {children}
    </Title>
  );
}

function Explanation({ children }: { children: ReactNode }) {
  return <Text style={{ margin: 0, color: colors.text.secondary }}>{children}</Text>;
}

function Working({ label }: { label: string }) {
  return (
    <PageShell>
      <Stack role="status" aria-live="polite" align="center" gap="md" style={{ width: '100%' }}>
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>{label}</Text>
      </Stack>
    </PageShell>
  );
}

function userTypeLabel(userType: UserType): string {
  return userType === 'unauthenticated' ? 'Unauthenticated' : USER_TYPE_LABELS[userType];
}

/** "an author", "an admin" or "a standard user". */
function userTypeWithArticle(userType: UserType): string {
  if (userType === 'standard' || userType === 'unauthenticated') {
    return 'a standard user';
  }
  return `an ${userTypeLabel(userType).toLowerCase()}`;
}

function AccountLink() {
  const countryId = useCurrentCountry();
  return <AppLink to={`/${countryId}/account`}>Go to your account</AppLink>;
}

function Accepted({ acceptance }: { acceptance: InvitationAcceptance }) {
  return (
    <PageShell>
      <Stack role="status" gap="md">
        <Heading>
          {acceptance.type_changed
            ? `You are now ${userTypeWithArticle(acceptance.user_type)}`
            : 'Invitation accepted'}
        </Heading>
        <Explanation>
          {acceptance.type_changed
            ? `Your PolicyEngine account's type changed from ${userTypeLabel(acceptance.previous_user_type)} to ${userTypeLabel(acceptance.user_type)}.`
            : `You are already ${userTypeWithArticle(acceptance.user_type)}, which includes everything this invitation gives, so nothing changed.`}
        </Explanation>
      </Stack>
      <AccountLink />
    </PageShell>
  );
}

const ASK_AGAIN = 'Ask the admin who invited you to send it again.';

/** What the page says about a refusal that no new attempt can change. */
function finalRefusalWording(error: Error): { heading: string; explanation: string } {
  switch (invitationRefusalCode(error)) {
    case 'invitation_accepted':
      return {
        heading: 'This invitation was already accepted',
        explanation:
          'An invitation can be accepted once. Your account page shows the type your account has.',
      };
    case 'invitation_expired':
      return { heading: 'This invitation has expired', explanation: ASK_AGAIN };
    case 'inviter_not_admin':
      return {
        heading: 'This invitation is no longer valid',
        explanation:
          'The admin who sent it is no longer an admin. Ask another admin to invite you again.',
      };
    default:
      // invitation_not_found, invitation_revoked, or a token that is not one (422).
      return {
        heading: 'This invitation link no longer works',
        explanation:
          'It was withdrawn, or replaced by a newer invitation email. Open the link in the latest invitation email, or ask the admin who invited you to send it again.',
      };
  }
}

/** Why the acceptance failed, and what the invitee can do. */
function Refused({
  error,
  onTryAgain,
  onSignOut,
}: {
  error: Error;
  onTryAgain: () => void;
  onSignOut: () => void;
}) {
  const { profile } = useAuthStatus();
  if (isEmailNotVerified(error)) {
    return (
      <PageShell>
        <Heading>Verify your email address</Heading>
        <Explanation>
          {profile?.email
            ? `Auth0 sent an email to ${profile.email} with a link to verify it.`
            : 'Auth0 sent you an email with a link to verify your address.'}{' '}
          Click that link, then come back to this page: the invitation is accepted as soon as your
          address is verified.
        </Explanation>
        <Button variant="outline" onClick={onTryAgain}>
          I have verified it
        </Button>
      </PageShell>
    );
  }
  if (invitationRefusalCode(error) === 'email_mismatch') {
    return (
      <PageShell>
        <Heading>This invitation is for another email address</Heading>
        <Explanation>
          {profile?.email ? `You are signed in as ${profile.email}. ` : ''}Sign out, then open the
          link in the invitation email again and sign in with the address it was sent to.
        </Explanation>
        <Button onClick={onSignOut}>Sign out</Button>
      </PageShell>
    );
  }
  if (isFinalRefusal(error)) {
    const { heading, explanation } = finalRefusalWording(error);
    return (
      <PageShell>
        <Heading>{heading}</Heading>
        <Explanation>{explanation}</Explanation>
        {invitationRefusalCode(error) === 'invitation_accepted' && <AccountLink />}
      </PageShell>
    );
  }
  return (
    <PageShell>
      <Heading>Accept your invitation</Heading>
      <Text role="alert" style={{ margin: 0, color: colors.error }}>
        We could not accept your invitation: {error.message}
      </Text>
      <Button onClick={onTryAgain}>Try again</Button>
    </PageShell>
  );
}

/**
 * Signed in: posts the token once, which also creates the account of a
 * user who has none. While the email is not verified it tries again each
 * time the invitee comes back: the window regains focus, or the tab is
 * shown again.
 */
function Acceptance({ token, countryId }: { token: string; countryId: AssociationCountryId }) {
  const auth = useAuthStatus();
  const acceptance = useAcceptInvitation(countryId);
  const { mutate: accept } = acceptance;
  // Set while a post is under way, so a focus and a visibility change
  // arriving together post once.
  const posting = useRef(false);

  const tryAccepting = useCallback(() => {
    if (posting.current) {
      return;
    }
    posting.current = true;
    accept(token, {
      onSettled: () => {
        posting.current = false;
      },
    });
  }, [accept, token]);

  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      tryAccepting();
    }
  }, [tryAccepting]);

  const waitingForVerification = acceptance.isError && isEmailNotVerified(acceptance.error);
  useEffect(() => {
    if (!waitingForVerification) {
      return undefined;
    }
    // Back from the verification email: react-query's focusManager reports
    // the tab being shown again; a window that stayed visible regains focus.
    const stopWatchingVisibility = focusManager.subscribe((focused) => {
      if (focused) {
        tryAccepting();
      }
    });
    window.addEventListener('focus', tryAccepting);
    return () => {
      stopWatchingVisibility();
      window.removeEventListener('focus', tryAccepting);
    };
  }, [waitingForVerification, tryAccepting]);

  if (acceptance.isSuccess) {
    return <Accepted acceptance={acceptance.data} />;
  }
  if (acceptance.isError) {
    return (
      <Refused
        error={acceptance.error}
        onTryAgain={tryAccepting}
        onSignOut={() => void auth.signOut()}
      />
    );
  }
  return <Working label="Accepting your invitation…" />;
}

/**
 * The accept page (`/{countryId}/invitations/accept`), where an invitation
 * email's link leads. It keeps the link's token (see pendingInvitation),
 * has a signed-out invitee sign in or create an account and come back,
 * and then accepts the invitation with no further step.
 */
export default function InvitationAcceptPage() {
  // The US or the UK, the countries with accounts.
  const countryId = useCurrentCountry();
  const auth = useAuthStatus();
  // Undefined until the page has read the link and storage, after mount.
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // The link just opened wins over a token saved earlier, which a resend
    // may have replaced; it is also the only copy when storage is blocked.
    setToken(takeInvitationTokenFromUrl() ?? readPendingInvitationToken());
  }, []);

  if (token === undefined) {
    return <Working label="Loading…" />;
  }
  if (token === null) {
    return (
      <PageShell>
        <Heading>No invitation to accept</Heading>
        <Explanation>
          Open the link in your invitation email again. If it no longer works, ask the admin who
          invited you to send it again.
        </Explanation>
      </PageShell>
    );
  }
  if (auth.status === 'disabled') {
    return (
      <PageShell>
        <Heading>Accept your invitation</Heading>
        <Explanation>Signing in is not available here yet, so it cannot be accepted.</Explanation>
      </PageShell>
    );
  }
  if (auth.status === 'signed_out') {
    const acceptPath = invitationAcceptPath(countryId);
    return (
      <PageShell>
        <Heading>Accept your invitation</Heading>
        <Explanation>
          Sign in, or create an account, with the email address the invitation was sent to. You will
          come back here, and the invitation will be accepted.
        </Explanation>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button onClick={() => void auth.signIn(acceptPath)}>Sign in</Button>
          <Button variant="outline" onClick={() => void auth.signIn(acceptPath, { signUp: true })}>
            Create an account
          </Button>
        </div>
      </PageShell>
    );
  }
  return <Acceptance token={token} countryId={countryId} />;
}
