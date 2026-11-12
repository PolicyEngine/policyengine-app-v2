import { useId, useState, type FormEvent } from 'react';
import type { InvitableUserType, UserInvitationItem } from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  ShadcnTable,
  Spinner,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import {
  usePendingInvitations,
  useResendInvitation,
  useRevokeInvitation,
  useSendInvitation,
} from '@/hooks/useAdminInvitations';
import { isRefusedOrMissing } from '@/hooks/useAdminUsers';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { formatAdminDate, USER_TYPE_LABELS } from './adminUserFormat';

/** The types an invitation can give, from fewest permissions to most. */
const INVITABLE_USER_TYPES: readonly InvitableUserType[] = ['author', 'admin'];

/** The longest address the API's invitation route accepts. */
const INVITATION_EMAIL_MAX_LENGTH = 320;

/** The outcome of the last send, resend or revocation: `alert` when it failed. */
interface InvitationOutcome {
  text: string;
  role: 'alert' | 'status';
}

function OutcomeText({ outcome }: { outcome: InvitationOutcome | null }) {
  if (!outcome) {
    return null;
  }
  return (
    <Text
      role={outcome.role}
      size="sm"
      style={{
        margin: 0,
        color: outcome.role === 'alert' ? colors.error : colors.text.secondary,
      }}
    >
      {outcome.text}
    </Text>
  );
}

function sentOutcome(invitation: UserInvitationItem, sentAgain: boolean): InvitationOutcome {
  if (invitation.last_send_failed) {
    return {
      role: 'alert',
      text: `The invitation to ${invitation.email} was saved, but its email could not be sent. Resend it from the list.`,
    };
  }
  return {
    role: 'status',
    text: sentAgain
      ? `Invitation sent again to ${invitation.email}.`
      : `Invitation sent to ${invitation.email}.`,
  };
}

/** Why a resend or revocation failed: gone (404), or the API's message. */
function rowFailure(
  action: string,
  invitation: UserInvitationItem,
  error: Error
): InvitationOutcome {
  if (isV2ApiError(error, 404)) {
    return {
      role: 'alert',
      text: `The invitation to ${invitation.email} is no longer pending: it may have been accepted, revoked or expired.`,
    };
  }
  return {
    role: 'alert',
    text: `We could not ${action} the invitation to ${invitation.email}: ${error.message}`,
  };
}

function InviteByEmailForm({ onOutcome }: { onOutcome: (outcome: InvitationOutcome) => void }) {
  const idPrefix = useId();
  const emailInputId = `${idPrefix}-email`;
  const typeGroupLabelId = `${idPrefix}-type-label`;
  const typeOptionId = (userType: InvitableUserType) => `${idPrefix}-type-${userType}`;
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<InvitableUserType>('author');
  const sendInvitation = useSendInvitation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address || sendInvitation.isPending) {
      return;
    }
    sendInvitation.mutate(
      { email: address, userType },
      {
        onSuccess: (invitation) => {
          setEmail('');
          onOutcome(sentOutcome(invitation, false));
        },
        onError: (error) =>
          onOutcome({ role: 'alert', text: `We could not send the invitation: ${error.message}` }),
      }
    );
  };

  return (
    <form
      aria-label="Invite by email"
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        alignItems: 'flex-start',
      }}
    >
      <Stack gap="xs" style={{ width: '100%', maxWidth: 420 }}>
        <Label htmlFor={emailInputId}>Email address</Label>
        <Input
          id={emailInputId}
          type="email"
          required
          autoComplete="off"
          value={email}
          maxLength={INVITATION_EMAIL_MAX_LENGTH}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.org"
        />
      </Stack>
      <Stack gap="sm">
        <Text id={typeGroupLabelId} size="sm" style={{ margin: 0 }}>
          Type
        </Text>
        <RadioGroup
          aria-labelledby={typeGroupLabelId}
          value={userType}
          onValueChange={(value) => setUserType(value as InvitableUserType)}
          style={{ display: 'flex', gap: spacing.lg }}
        >
          {INVITABLE_USER_TYPES.map((invitableType) => (
            <div
              key={invitableType}
              style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}
            >
              <RadioGroupItem value={invitableType} id={typeOptionId(invitableType)} />
              <Label htmlFor={typeOptionId(invitableType)}>{USER_TYPE_LABELS[invitableType]}</Label>
            </div>
          ))}
        </RadioGroup>
      </Stack>
      <Button type="submit" disabled={sendInvitation.isPending}>
        {sendInvitation.isPending && <Spinner size="sm" />}
        Send invitation
      </Button>
    </form>
  );
}

function PendingInvitations({ onOutcome }: { onOutcome: (outcome: InvitationOutcome) => void }) {
  const countryId = useCurrentCountry();
  const pending = usePendingInvitations();
  const resendInvitation = useResendInvitation();
  const revokeInvitation = useRevokeInvitation();
  const busyInvitationId =
    (resendInvitation.isPending && resendInvitation.variables?.id) ||
    (revokeInvitation.isPending && revokeInvitation.variables?.id) ||
    null;

  const resend = (invitation: UserInvitationItem) =>
    resendInvitation.mutate(invitation, {
      onSuccess: (resent) => onOutcome(sentOutcome(resent, true)),
      onError: (error) => onOutcome(rowFailure('resend', invitation, error)),
    });
  const revoke = (invitation: UserInvitationItem) =>
    revokeInvitation.mutate(invitation, {
      onSuccess: () =>
        onOutcome({ role: 'status', text: `The invitation to ${invitation.email} was revoked.` }),
      onError: (error) => onOutcome(rowFailure('revoke', invitation, error)),
    });

  // Invitations already read stay on the screen when a later read fails
  // for a while (a network error, a 5xx), but not after a 403 or 404.
  if (pending.isError && (pending.data === undefined || isRefusedOrMissing(pending.error))) {
    return (
      <Stack gap="sm" align="start">
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load the invitations: {pending.error.message}
        </Text>
        <Button variant="outline" onClick={() => pending.refetch()}>
          Try again
        </Button>
      </Stack>
    );
  }
  if (pending.data === undefined) {
    return (
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading invitations…</Text>
      </Stack>
    );
  }
  if (pending.data.length === 0) {
    return <Text style={{ margin: 0, color: colors.text.secondary }}>No pending invitations.</Text>;
  }
  return (
    <ShadcnTable aria-label="Pending invitations">
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Invited by</TableHead>
          <TableHead>Last sent</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>
            <span className="tw:sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pending.data.map((invitation) => {
          const busy = busyInvitationId === invitation.id;
          return (
            <TableRow key={invitation.id}>
              <TableCell>
                <Stack gap="xs">
                  <span>{invitation.email}</span>
                  {invitation.last_send_failed && (
                    <Text size="sm" style={{ margin: 0, color: colors.error }}>
                      The last email could not be sent.
                    </Text>
                  )}
                </Stack>
              </TableCell>
              <TableCell>{USER_TYPE_LABELS[invitation.user_type]}</TableCell>
              <TableCell>{invitation.invited_by_email ?? '—'}</TableCell>
              <TableCell>
                {invitation.last_sent_at
                  ? formatAdminDate(invitation.last_sent_at, countryId)
                  : 'Not sent'}
              </TableCell>
              <TableCell>{formatAdminDate(invitation.expires_at, countryId)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => resend(invitation)}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => revoke(invitation)}
                  >
                    Revoke
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </ShadcnTable>
  );
}

/**
 * The admin page's invitations: an admin invites an email address to
 * become an author or admin, and resends or revokes pending invitations.
 * The invitee accepts on the accept page, through the email's link.
 */
export default function AdminInvitations() {
  const [outcome, setOutcome] = useState<InvitationOutcome | null>(null);
  return (
    <Stack gap="xl">
      <Stack gap="md">
        <Stack gap="xs">
          <Title order={2} style={{ margin: 0 }}>
            Invite by email
          </Title>
          <Text style={{ margin: 0, color: colors.text.secondary }}>
            The invitee gets an email with a link. Once they sign in or create an account with that
            address, they get the type you choose. An invitation never lowers anyone&apos;s type.
          </Text>
        </Stack>
        <InviteByEmailForm onOutcome={setOutcome} />
      </Stack>
      <OutcomeText outcome={outcome} />
      <Stack gap="md">
        <Title order={2} style={{ margin: 0 }}>
          Pending invitations
        </Title>
        <PendingInvitations onOutcome={setOutcome} />
      </Stack>
    </Stack>
  );
}
