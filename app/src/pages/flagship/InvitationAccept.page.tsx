import { useEffect, useRef, useState, type ReactNode } from 'react';
import { focusManager } from '@tanstack/react-query';
import { isEmailNotVerified, type InvitationAcceptResult } from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import { USER_TYPE_LABELS } from '@/components/admin/adminUserFormat';
import { AppLink } from '@/components/AppLink';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { isFinalRefusal, useAcceptInvitation } from '@/hooks/useInvitationAcceptance';
import { useMe } from '@/hooks/useMe';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import {
  invitationAcceptPath,
  readPendingInvitationToken,
  takeInvitationTokenFromUrl,
} from '@/libs/invitations/pendingInvitation';
import { isAssociationCountry, type UserType } from '@/types/v2User';

function PageShell({ children }: { children: ReactNode }) {
  return (
    <Stack
      gap="md"
      align="start"
      style={{ maxWidth: 560, margin: '0 auto', padding: spacing['3xl'], width: '100%' }}
    >
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

function Accepted({ result }: { result: InvitationAcceptResult }) {
  const countryId = useCurrentCountry();
  const userType = result.item.user_type;
  return (
    <PageShell>
      <Stack role="status" gap="md">
        <Heading>
          {result.outcome === 'changed'
            ? `You are now ${userTypeWithArticle(userType)}`
            : 'Invitation accepted'}
        </Heading>
        <Explanation>
          {result.outcome === 'changed'
            ? `Your PolicyEngine account's type is now ${userTypeLabel(userType)}.`
            : `You are already ${userTypeWithArticle(userType)}, which includes everything this invitation gives, so nothing changed.`}
        </Explanation>
      </Stack>
      <AppLink to={`/${countryId}/account`}>Go to your account</AppLink>
    </PageShell>
  );
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
  if (isV2ApiError(error, 403)) {
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
    const inviterNoLongerAdmin = isV2ApiError(error, 409);
    return (
      <PageShell>
        <Heading>
          {inviterNoLongerAdmin
            ? 'This invitation is no longer valid'
            : 'This invitation link no longer works'}
        </Heading>
        <Explanation>
          {inviterNoLongerAdmin
            ? 'The admin who sent it is no longer an admin. Ask another admin to invite you again.'
            : 'It may have expired, been used already or been withdrawn. Ask the admin who invited you to send it again.'}
        </Explanation>
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
 * Signed in: reads `/v2/me` first, which creates a new user's account,
 * then posts the token once. While the email is not verified it tries
 * again each time the invitee comes back to the page.
 */
function Acceptance({ token }: { token: string }) {
  const auth = useAuthStatus();
  const me = useMe();
  const acceptance = useAcceptInvitation();
  const { mutate: accept } = acceptance;
  const started = useRef(false);

  useEffect(() => {
    if (me.isSuccess && !started.current) {
      started.current = true;
      accept(token);
    }
  }, [me.isSuccess, accept, token]);

  const waitingForVerification = acceptance.isError && isEmailNotVerified(acceptance.error);
  useEffect(() => {
    if (!waitingForVerification) {
      return undefined;
    }
    // Back from the verification email, in this tab.
    return focusManager.subscribe((focused) => {
      if (focused) {
        accept(token);
      }
    });
  }, [waitingForVerification, accept, token]);

  if (me.isError) {
    return (
      <PageShell>
        <Heading>Accept your invitation</Heading>
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load your PolicyEngine account: {me.error.message}
        </Text>
        <Button onClick={() => me.refetch()}>Try again</Button>
      </PageShell>
    );
  }
  if (acceptance.isSuccess) {
    return <Accepted result={acceptance.data} />;
  }
  if (acceptance.isError) {
    return (
      <Refused
        error={acceptance.error}
        onTryAgain={() => accept(token)}
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
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const auth = useAuthStatus();
  // Undefined until the page has read the link and storage, after mount.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const acceptPath = invitationAcceptPath(countryId);

  useEffect(() => {
    takeInvitationTokenFromUrl();
    if (!isAssociationCountry(countryId)) {
      // Accounts exist in the US and UK workspaces only.
      nav.replace(invitationAcceptPath('us'));
      return;
    }
    setToken(readPendingInvitationToken());
  }, [countryId, nav]);

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
  return <Acceptance token={token} />;
}
