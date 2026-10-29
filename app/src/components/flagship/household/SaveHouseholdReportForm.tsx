import { useId, useState } from 'react';
import { IconDeviceFloppy, IconLink } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { saveV2HouseholdReport, submitV2HouseholdReport } from '@/api/v2HouseholdReports';
import { Button, Input, Label, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import { plainV2HouseholdError, v2PolicyIdFor } from '@/libs/flagship/v2HouseholdRun';
import type { RootState } from '@/store';
import type { AssociationCountryId } from '@/types/v2User';

export const SAVED_REPORTS_UNAVAILABLE = 'Saved reports are not available here.';

/** A saved report's link: the saved report's ID, on the v3 report page. */
export function savedHouseholdReportPath(countryId: string, savedReportId: string): string {
  return `/${countryId}/report/${savedReportId}`;
}

/**
 * A name field and a Save button that keep a household report: the
 * household the report calculated (stored on `/v2/households`) under its
 * baseline and reform becomes a household report on `/v2/reports`, saved
 * in the account under the name (`/v2/user-reports`). The saved report's
 * ID is its link, which anyone can open. Only on the Public API's v2
 * routes, and only where saved work is in the account.
 */
export default function SaveHouseholdReportForm({
  countryId,
  householdId,
  baselinePolicyId,
  reformPolicyId,
}: {
  countryId: AssociationCountryId;
  /** The stored household the report calculated. */
  householdId: string;
  /** The policies as v3 holds them: current law, or v2 policies. */
  baselinePolicyId: string;
  reformPolicyId: string;
}) {
  const nameId = useId();
  const { account } = useV3SavedWork();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  // The household report this form created: saving again (after the save in
  // the account failed, or under another name) saves it, rather than
  // creating another report of the same household.
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quietText = { margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary };
  if (!account) {
    return <Text style={quietText}>{SAVED_REPORTS_UNAVAILABLE}</Text>;
  }

  const save = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSavedReportId(null);
    try {
      const reportId =
        createdReportId ??
        (
          await submitV2HouseholdReport({
            countryId,
            householdId,
            baselinePolicyId: v2PolicyIdFor(baselinePolicyId, currentLawId),
            reformPolicyId: v2PolicyIdFor(reformPolicyId, currentLawId),
          })
        ).id;
      setCreatedReportId(reportId);
      setSavedReportId(await saveV2HouseholdReport(account, { countryId, reportId, name }));
    } catch (error) {
      setErrorMessage(plainV2HouseholdError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack style={{ gap: spacing.sm }}>
      <Label htmlFor={nameId}>Report name</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
        <Input
          id={nameId}
          value={name}
          placeholder="For example, our family under the reform"
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
          className="tw:max-w-xs"
        />
        <Button size="sm" onClick={save} disabled={saving}>
          <IconDeviceFloppy size={16} aria-hidden />
          Save report
        </Button>
      </div>
      {savedReportId && (
        <Text role="status" style={quietText}>
          Saved. Anyone with the link can open it:{' '}
          <a href={savedHouseholdReportPath(countryId, savedReportId)}>
            <IconLink size={14} aria-hidden /> Open the saved report
          </a>
        </Text>
      )}
      {errorMessage && (
        <Text
          role="alert"
          style={{ ...quietText, fontSize: typography.fontSize.xs, color: colors.error }}
        >
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
}
