import { useId } from 'react';
import type { UserTypeChangeItem } from '@/api/v2AdminUsers';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { isRefusedOrMissing, useUserTypeChanges } from '@/hooks/useAdminUsers';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { formatAdminDateTime, USER_TYPE_LABELS } from './adminUserFormat';

/**
 * Who made a change: an admin through the admin routes, the user by
 * accepting an admin's invitation, or the type script.
 */
function changeAuthor(change: UserTypeChangeItem): string {
  if (change.source === 'script') {
    return 'Set by the type script';
  }
  if (change.source === 'invitation') {
    return change.changed_by_email
      ? `Accepted an invitation from ${change.changed_by_email}`
      : "Accepted an admin's invitation";
  }
  // The admin's email is null when the admin has none, or once their account is deleted.
  return change.changed_by_email ? `Changed by ${change.changed_by_email}` : 'Changed by an admin';
}

/** A user's recorded type changes, newest first. */
export default function UserTypeChangeHistory({ userId }: { userId: string }) {
  const countryId = useCurrentCountry();
  const changes = useUserTypeChanges(userId);
  const headingId = useId();

  let content: React.ReactNode;
  // Changes already read stay on the screen when a later read fails for a
  // while (a network error, a 5xx), but not after a 403 or 404.
  if (changes.isError && (changes.data === undefined || isRefusedOrMissing(changes.error))) {
    content = (
      <Stack gap="sm" align="start">
        <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
          We could not load the type changes: {changes.error.message}
        </Text>
        <Button variant="outline" size="sm" onClick={() => changes.refetch()}>
          Try again
        </Button>
      </Stack>
    );
  } else if (changes.data === undefined) {
    content = (
      <Stack role="status" aria-live="polite" gap="sm">
        <Spinner size="sm" />
      </Stack>
    );
  } else if (changes.data.length === 0) {
    content = (
      <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
        No type changes recorded.
      </Text>
    );
  } else {
    content = (
      <ol
        aria-labelledby={headingId}
        style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: spacing.md }}
      >
        {changes.data.map((change) => (
          <li key={change.id} style={{ display: 'grid', gap: spacing.xs }}>
            <Text size="sm" style={{ margin: 0, fontWeight: typography.fontWeight.medium }}>
              {`${USER_TYPE_LABELS[change.previous_user_type]} to ${USER_TYPE_LABELS[change.new_user_type]}`}
            </Text>
            <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
              {changeAuthor(change)}
            </Text>
            <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
              {formatAdminDateTime(change.created_at, countryId)}
            </Text>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <Stack gap="sm">
      <Title order={3} id={headingId} style={{ margin: 0, fontSize: typography.fontSize.base }}>
        Type changes
      </Title>
      {content}
    </Stack>
  );
}
