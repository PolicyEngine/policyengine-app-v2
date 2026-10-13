import { useState } from 'react';
import { IconDownload, IconTrash, IconUpload } from '@tabler/icons-react';
import { deleteMe, exportMe } from '@/api/v2Me';
import { AppLink } from '@/components/AppLink';
import { accountDisplayName } from '@/components/auth/AuthMenu';
import { importSummaryLines } from '@/components/auth/importSummaryText';
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
import { useLocalDataImport } from '@/hooks/useLocalDataImport';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { forgetImportState } from '@/libs/auth/localImport';
import { useV2UserClient } from '@/libs/auth/useAssociationBackend';
import { isAssociationCountry } from '@/types/v2User';
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
 * The signed-in user's account: who they are, saving this device's work
 * to the account, downloading everything saved, and deleting the account.
 */
export default function AccountPage() {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();
  const client = useV2UserClient();
  const localImport = useLocalDataImport();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (auth.status === 'disabled') {
    return (
      <PageShell>
        <Text style={{ margin: 0 }}>Signing in is not available here yet.</Text>
      </PageShell>
    );
  }

  if (auth.status === 'loading') {
    return (
      <PageShell>
        <Stack role="status" aria-live="polite" align="center" gap="md">
          <Spinner size="sm" />
          <Text style={{ margin: 0, color: colors.text.secondary }}>Loading your account…</Text>
        </Stack>
      </PageShell>
    );
  }

  if (auth.status === 'anonymous') {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to keep your work</CardTitle>
            <CardDescription>
              Signed in, the policies, reports and reforms you save are kept in your account and
              available on any device.
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

  const user = auth.user;
  if (!user) {
    return (
      <PageShell>
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load your PolicyEngine account
          {auth.error ? `: ${auth.error.message}` : '.'} Saved work is unavailable until it loads.
        </Text>
        <div className="tw:flex tw:gap-2">
          <Button onClick={() => auth.retryAccount()}>Try again</Button>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sign out
          </Button>
        </div>
      </PageShell>
    );
  }

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
      forgetImportState(user.id);
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

      {localImport.available && (localImport.pendingCount > 0 || localImport.summary) && (
        <Card>
          <CardHeader>
            <CardTitle>Work saved on this device</CardTitle>
            <CardDescription>
              {localImport.pendingCount > 0
                ? `This browser has ${localImport.pendingCount} saved item${
                    localImport.pendingCount === 1 ? '' : 's'
                  } that are not in your account yet. Saving copies them; nothing is removed from this device.`
                : 'Everything this browser can save is in your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="sm">
              {localImport.summary &&
                importSummaryLines(localImport.summary).map((line) => (
                  <Text key={line} size="sm" style={{ margin: 0 }}>
                    {line}
                  </Text>
                ))}
              {localImport.state === 'error' && (
                <Text size="sm" style={{ margin: 0, color: colors.error }}>
                  {localImport.error}
                </Text>
              )}
              {localImport.pendingCount > 0 && (
                <div>
                  <Button
                    onClick={() => localImport.run()}
                    disabled={localImport.state === 'running'}
                  >
                    {localImport.state === 'running' ? (
                      <Spinner size="sm" />
                    ) : (
                      <IconUpload size={16} />
                    )}
                    Save to my account
                  </Button>
                </div>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

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
            Permanently deletes your account and everything saved to it. Work saved only on this
            device stays on this device.
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
              This permanently deletes your PolicyEngine account and every policy, household,
              simulation, report and reform saved to it. It cannot be undone.
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
