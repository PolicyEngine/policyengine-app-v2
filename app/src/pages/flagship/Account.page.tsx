import { useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { deleteMe } from '@/api/v2Me';
import AccountSection from '@/components/account/AccountSection';
import { accountDisplayName } from '@/components/auth/AuthMenu';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useMe } from '@/hooks/useMe';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import type { AssociationCountryId } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';

function formatDate(iso: string | undefined | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
      <Text size="sm" style={{ margin: 0, minWidth: 160, color: colors.text.secondary }}>
        {label}
      </Text>
      <Text size="sm" style={{ margin: 0, wordBreak: 'break-all' }}>
        {value}
      </Text>
    </div>
  );
}

/**
 * The v3 account page, the account settings' General page: who the
 * signed-in user is, and deleting the account ("Download my data" is on
 * the My data page). Reads the PolicyEngine user from `GET /v2/me` (the
 * user menu uses the Auth0 ID token instead), and does not show its ID.
 */
export default function AccountPage() {
  return (
    <AccountSection title="General">
      {(countryId) => <SignedInAccount countryId={countryId} />}
    </AccountSection>
  );
}

function SignedInAccount({ countryId }: { countryId: AssociationCountryId }) {
  const auth = useAuthStatus();
  const client = useV2UserClient();
  const me = useMe();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (me.isPending) {
    return (
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading your account…</Text>
      </Stack>
    );
  }

  if (me.isError) {
    return (
      <>
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load your PolicyEngine account: {me.error.message}
        </Text>
        <div className="tw:flex tw:gap-2">
          <Button onClick={() => me.refetch()}>Try again</Button>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sign out
          </Button>
        </div>
      </>
    );
  }

  const user = me.data;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMe(client, countryId);
      await auth.signOut();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The account was not deleted.');
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{accountDisplayName(auth)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            <DetailRow label="Email" value={user.email ?? auth.profile?.email ?? null} />
            <DetailRow
              label="Primary country"
              value={user.primary_country ? getCountryLabel(user.primary_country) : null}
            />
            <DetailRow label="Member since" value={formatDate(user.created_at)} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete my account</CardTitle>
          <CardDescription>
            Permanently deletes your account and everything saved to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
            <IconTrash size={16} />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !open && !deleting && setConfirmingDelete(false)}
      >
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your PolicyEngine account and every reform and report saved
              to it. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Text size="sm" style={{ margin: 0, color: colors.error }}>
              {deleteError}
            </Text>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Spinner size="sm" />}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
