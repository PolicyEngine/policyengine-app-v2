import { useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { exportMe } from '@/api/v2Me';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors } from '@/designTokens';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import type { AssociationCountryId, MeExportResult } from '@/types/v2User';

const EXPORT_FILE_NAME = 'policyengine-account-data.json';

/**
 * The export as the downloaded file holds it: every saved record, without
 * the account record (`user`) or the user ID (`user_id`) each record
 * repeats. The Public API still sends them to the browser.
 */
function exportFileContent(exported: MeExportResult): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(exported)
      .filter(([section]) => section !== 'user')
      .map(([section, records]) => [
        section,
        Array.isArray(records) ? records.map(withoutUserId) : records,
      ])
  );
}

function withoutUserId(record: unknown): unknown {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }
  return Object.fromEntries(Object.entries(record).filter(([field]) => field !== 'user_id'));
}

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

/**
 * "Download my data": a JSON file of everything saved to the signed-in
 * account, in every country, from `GET /v2/me/export`.
 */
export default function DownloadMyData({ countryId }: { countryId: AssociationCountryId }) {
  const client = useV2UserClient();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      downloadJson(exportFileContent(await exportMe(client, countryId)), EXPORT_FILE_NAME);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'The download did not complete.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download my data</CardTitle>
        <CardDescription>A JSON file with everything saved to your account.</CardDescription>
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
  );
}
