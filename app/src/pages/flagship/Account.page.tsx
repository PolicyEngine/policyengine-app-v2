import { useState } from 'react';
import { IconDownload, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { deleteMe, exportMe, fetchMe } from '@/api/v2Me';
import { AppLink } from '@/components/AppLink';
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
  Title,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { isAssociationCountry, type AssociationCountryId } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';

const EXPORT_FILE_NAME = 'policyengine-account-data.json';

function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(iso: string | undefined | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="xl" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <Title order={1} style={{ margin: 0 }}>
        Your account
      </Title>
      {children}
    </Stack>
  );
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
 * The v3 account page: who the signed-in user is, downloading everything
 * saved to the account, and deleting the account. Reads the PolicyEngine
 * user from `GET /v2/me` (the user menu uses the Auth0 ID token instead).
 */
export default function AccountPage() {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();

  if (auth.status === 'disabled') {
    return (
      <PageShell>
        <Text style={{ margin: 0 }}>Signing in is not available here yet.</Text>
      </PageShell>
    );
  }

  if (auth.status === 'signed_out') {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to keep your work</CardTitle>
            <CardDescription>
              Signed in, the reforms and reports you save are kept in your account and available on
              any device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => auth.signIn()}>Sign in</Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!isAssociationCountry(countryId)) {
    return (
      <PageShell>
        <Text style={{ margin: 0 }}>
          Accounts store work for the US and UK calculators. Work in the{' '}
          {getCountryLabel(countryId)} calculator stays on this device. Manage your account from{' '}
          <AppLink to="/us/account">the US calculator</AppLink> or{' '}
          <AppLink to="/uk/account">the UK calculator</AppLink>.
        </Text>
        <div>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sign out
          </Button>
        </div>
      </PageShell>
    );
  }

  return <SignedInAccount countryId={countryId} />;
}

function SignedInAccount({ countryId }: { countryId: AssociationCountryId }) {
  const auth = useAuthStatus();
  const client = useV2UserClient();
  const me = useQuery({
    queryKey: ['account', auth.subject, countryId],
    queryFn: () => fetchMe(client, countryId),
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (me.isPending) {
    return (
      <PageShell>
        <Stack role="status" aria-live="polite" align="center" gap="md">
          <Spinner size="sm" />
          <Text style={{ margin: 0, color: colors.text.secondary }}>Loading your account…</Text>
        </Stack>
      </PageShell>
    );
  }

  if (me.isError) {
    return (
      <PageShell>
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load your PolicyEngine account: {me.error.message}
        </Text>
        <div className="tw:flex tw:gap-2">
          <Button onClick={() => me.refetch()}>Try again</Button>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sign out
          </Button>
        </div>
      </PageShell>
    );
  }

  const user = me.data;

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      downloadJson(await exportMe(client, countryId), EXPORT_FILE_NAME);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'The download did not complete.');
    } finally {
      setExporting(false);
    }
  };

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
    <PageShell>
      <Card>
        <CardHeader>
          <CardTitle>{accountDisplayName(auth)}</CardTitle>
          <CardDescription>Signed in with your social account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            <DetailRow label="Email" value={user.email ?? auth.profile?.email ?? null} />
            <DetailRow label="Primary country" value={getCountryLabel(user.primary_country)} />
            <DetailRow label="Member since" value={formatDate(user.created_at)} />
            <DetailRow label="PolicyEngine user ID" value={user.id} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download my data</CardTitle>
          <CardDescription>
            A JSON file with your account and everything saved to it, in every country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            <div>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? <Spinner size="sm" /> : <IconDownload size={16} />}
                Download my data
              </Button>
            </div>
            {exportError && (
              <Text size="sm" style={{ margin: 0, color: colors.error }}>
                {exportError}
              </Text>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete my account</CardTitle>
          <CardDescription>
            Permanently deletes your account and everything saved to it. Work saved on this browser
            while signed out stays on this browser.
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
    </PageShell>
  );
}
