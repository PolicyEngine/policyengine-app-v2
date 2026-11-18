import { useCallback, useId, useRef, useState, type FormEvent } from 'react';
import type { InvitableUserType, UserInvitationItem } from '@/api/v2Invitations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  Stack,
  TableBody,
  TableRow,
  Text,
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
import AdminCard from './AdminCard';
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader } from './AdminTable';
import { formatAdminDate, USER_TYPE_LABELS } from './adminUserFormat';

/** The types an invitation can give, from fewest permissions to most. */
const INVITABLE_USER_TYPES: readonly InvitableUserType[] = ['author', 'admin'];

/** The longest address the API's invitation route accepts. */
const INVITATION_EMAIL_MAX_LENGTH = 320;

/** How many outcomes of recent sends, resends and revocations stay on the screen. */
const OUTCOMES_SHOWN = 3;

/** The outcome of a send, resend or revocation: `alert` when it failed. */
interface InvitationOutcome {
  text: string;
  role: 'alert' | 'status';
}

type ReportOutcome = (outcome: InvitationOutcome) => void;

/**
 * Why the Public API could not send an invitation's email, from its
 * `last_send_error` identifier, in words.
 */
function sendErrorReason(sendError: string): string {
  switch (sendError) {
    case 'not_configured':
      return 'sending email is not set up yet';
    case 'timeout':
      return 'Postmark did not answer in time';
    case 'connection_error':
      return 'Postmark could not be reached';
    case 'secret_unavailable':
      return 'the Public API could not read its Postmark token';
    case 'postmark_406':
      return 'Postmark does not send to this address, because earlier email to it bounced or was marked as spam';
  }
  const httpStatus = /^http_(\d+)$/.exec(sendError);
  if (httpStatus) {
    return `Postmark answered with HTTP status ${httpStatus[1]}`;
  }
  const postmarkError = /^postmark_(\d+)$/.exec(sendError);
  if (postmarkError) {
    return `Postmark refused it with error code ${postmarkError[1]}`;
  }
  return sendError;
}

function sentOutcome(invitation: UserInvitationItem, sentAgain: boolean): InvitationOutcome {
  if (invitation.last_send_error) {
    return {
      role: 'alert',
      text: `The invitation to ${invitation.email} was saved, but its email could not be sent: ${sendErrorReason(invitation.last_send_error)}. Resend it from the list.`,
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
  action: 'resend' | 'revoke',
  invitation: UserInvitationItem,
  error: unknown
): InvitationOutcome {
  if (isV2ApiError(error, 404)) {
    return {
      role: 'alert',
      text: `The invitation to ${invitation.email} is no longer open: it may have been accepted or revoked.`,
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    role: 'alert',
    text: `We could not ${action} the invitation to ${invitation.email}: ${message}`,
  };
}

function InviteByEmailForm({ onOutcome }: { onOutcome: ReportOutcome }) {
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
    // One invitation at a time: the button is disabled until this one answers.
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
      <Stack gap="xs" style={{ width: '100%' }}>
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

/**
 * The open invitations, each with resend and revoke. Each row's request
 * runs on its own, so several rows can be resent or revoked at once; a
 * row's buttons are disabled while its own request runs.
 */
function PendingInvitations({ onOutcome }: { onOutcome: ReportOutcome }) {
  const countryId = useCurrentCountry();
  const pending = usePendingInvitations();
  const resendInvitation = useResendInvitation();
  const revokeInvitation = useRevokeInvitation();
  const [busyInvitationIds, setBusyInvitationIds] = useState<ReadonlySet<string>>(new Set());

  const setBusy = (invitationId: string, busy: boolean) =>
    setBusyInvitationIds((previous) => {
      const next = new Set(previous);
      if (busy) {
        next.add(invitationId);
      } else {
        next.delete(invitationId);
      }
      return next;
    });

  // Each call's own promise gives its outcome: callbacks passed to
  // mutate() would be replaced by the next row's call.
  const runRowAction = async (action: 'resend' | 'revoke', invitation: UserInvitationItem) => {
    setBusy(invitation.id, true);
    try {
      if (action === 'resend') {
        onOutcome(sentOutcome(await resendInvitation.mutateAsync(invitation), true));
      } else {
        await revokeInvitation.mutateAsync(invitation);
        onOutcome({ role: 'status', text: `The invitation to ${invitation.email} was revoked.` });
      }
    } catch (error) {
      onOutcome(rowFailure(action, invitation, error));
    } finally {
      setBusy(invitation.id, false);
    }
  };

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
    <AdminTable aria-label="Pending invitations">
      <AdminTableHeader>
        <TableRow>
          <AdminTableHead>Email</AdminTableHead>
          <AdminTableHead>Type</AdminTableHead>
          <AdminTableHead>Last sent</AdminTableHead>
          <AdminTableHead>Expires</AdminTableHead>
          <AdminTableHead>
            <span className="tw:sr-only">Actions</span>
          </AdminTableHead>
        </TableRow>
      </AdminTableHeader>
      <TableBody>
        {pending.data.map((invitation) => {
          const busy = busyInvitationIds.has(invitation.id);
          return (
            <TableRow key={invitation.id}>
              <AdminTableCell>
                <Stack gap="xs">
                  <span>{invitation.email}</span>
                  {invitation.last_send_error && (
                    <Text size="sm" style={{ margin: 0, color: colors.error }}>
                      The last email could not be sent:{' '}
                      {sendErrorReason(invitation.last_send_error)}.
                    </Text>
                  )}
                  {invitation.expired && (
                    <Text size="sm" style={{ margin: 0, color: colors.text.warning }}>
                      Expired: resend it to send a new link.
                    </Text>
                  )}
                </Stack>
              </AdminTableCell>
              <AdminTableCell>{USER_TYPE_LABELS[invitation.user_type]}</AdminTableCell>
              <AdminTableCell>
                {invitation.last_sent_at
                  ? formatAdminDate(invitation.last_sent_at, countryId)
                  : 'Not sent'}
              </AdminTableCell>
              <AdminTableCell>{formatAdminDate(invitation.expires_at, countryId)}</AdminTableCell>
              <AdminTableCell>
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void runRowAction('resend', invitation)}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void runRowAction('revoke', invitation)}
                  >
                    Revoke
                  </Button>
                </div>
              </AdminTableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </AdminTable>
  );
}

/**
 * The admin invitations page's cards: an admin invites an email address to
 * become an author or admin, and resends or revokes open invitations.
 * The invitee accepts on the accept page, through the email's link.
 */
export default function AdminInvitations() {
  const [outcomes, setOutcomes] = useState<ReadonlyArray<InvitationOutcome & { key: number }>>([]);
  const nextOutcomeKey = useRef(0);
  const reportOutcome = useCallback((outcome: InvitationOutcome) => {
    nextOutcomeKey.current += 1;
    const key = nextOutcomeKey.current;
    setOutcomes((previous) => [{ ...outcome, key }, ...previous].slice(0, OUTCOMES_SHOWN));
  }, []);

  return (
    <>
      <AdminCard
        title="Invite by email"
        description="The invitee gets an email with a link. Once they sign in or create an account with that address, they get the type you choose. An invitation never lowers anyone's type."
      >
        <InviteByEmailForm onOutcome={reportOutcome} />
      </AdminCard>
      {outcomes.length > 0 && (
        <Stack gap="xs">
          {outcomes.map((outcome) => (
            <Text
              key={outcome.key}
              role={outcome.role}
              size="sm"
              style={{
                margin: 0,
                color: outcome.role === 'alert' ? colors.error : colors.text.secondary,
              }}
            >
              {outcome.text}
            </Text>
          ))}
        </Stack>
      )}
      <AdminCard
        title="Pending invitations"
        description="Invitations not yet accepted or revoked, with when their emails were last sent and when their links expire."
      >
        <PendingInvitations onOutcome={reportOutcome} />
      </AdminCard>
    </>
  );
}
