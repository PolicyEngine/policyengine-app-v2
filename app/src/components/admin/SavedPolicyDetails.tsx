import { parseReportItem } from '@/api/flagshipReportStore';
import type { UserSavedItems } from '@/api/v2AdminUserSavedItems';
import SavedReformView, { type SavedReformChanges } from '@/components/flagship/SavedReformView';
import { useAdminSavedPolicyContent, type AdminSavedPolicy } from '@/hooks/useAdminSavedPolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { isFlagshipShellEnabled } from '@/libs/featureFlags';
import { readableReports } from '@/libs/flagship/reportSchema';
import { reformParameterNames } from '@/libs/flagship/v3ParameterNames';
import type { UserReportItem } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';
import {
  asDialogDescription,
  asDialogTitle,
  OtherCountryNote,
  SavedItemLoading,
  SavedItemReadError,
} from './AdminSavedItemDialog';

/**
 * An exported saved report as the app's own type of one. The export is
 * typed from the Public API's schema, which leaves a provision's `unit` and
 * `intervals` optional and its `growth_round` any string. `parseReportItem`
 * fills in a missing unit and intervals, and the report schema it reads the
 * result through refuses any other `growth_round`.
 */
function asUserReportItem(report: UserSavedItems['reports'][number]): UserReportItem {
  return report as UserReportItem;
}

/**
 * One of a user's saved policies in the admin page's dialog, read only, in
 * the reforms page's view of a saved reform (`SavedReformView`): its name,
 * how many provisions it has and when it was saved, its parameters against
 * current law, and the reports the user ran from it. The dialog adds only
 * its own parts:
 * - Names and current law come from the page's country's model, so a
 *   policy saved in another country shows its parameters by their paths,
 *   and a note says why.
 * - The policy is read when the dialog opens, so its parameters wait for
 *   that read, or say why it failed.
 * - Its reports open their pages in a new tab, where the policy's country
 *   has the v3 interface, which that page belongs to. A saved report the
 *   app can't read is left out, as the reforms page leaves it out.
 * - Nothing in it acts on the policy.
 */
export default function SavedPolicyDetails({
  policy,
  savedItems,
}: {
  policy: AdminSavedPolicy;
  /** The user's saved items: the reports run from the policy, and the policies they compare with. */
  savedItems: Pick<UserSavedItems, 'policies' | 'reports'>;
}) {
  const countryId = useCurrentCountry();
  const inPageCountry = policy.country_id === countryId;
  const read = useAdminSavedPolicyContent(policy);
  const metadata = useEnsureV3Parameters(
    inPageCountry && read.data ? reformParameterNames([read.data]) : []
  );
  const changes: SavedReformChanges = read.error
    ? {
        read: false,
        unavailable: true,
        placeholder: (
          <SavedItemReadError
            subject="policy"
            error={read.error}
            onRetry={() => void read.refetch()}
          />
        ),
      }
    : read.data === undefined
      ? { read: false, unavailable: false, placeholder: <SavedItemLoading subject="policy" /> }
      : {
          read: true,
          parameters: read.data.parameters,
          missingParameters: read.data.missingParameters,
          metadataReady: !inPageCountry || metadata.status === 'ready',
          metadataFailed: inPageCountry && metadata.status === 'error',
          onRetryMetadata: metadata.retry,
          withoutMetadata: !inPageCountry,
        };
  const reports = readableReports(
    savedItems.reports
      .filter((report) => report.user_policy_id === policy.id)
      .map((report) => parseReportItem(asUserReportItem(report)))
  );
  // A policy a report was compared with, as the saved policies table names it.
  const policyName = (policyId: string) => {
    const saved = savedItems.policies.find((candidate) => candidate.id === policyId);
    return saved ? (saved.name ?? 'No name') : undefined;
  };
  return (
    <SavedReformView
      name={policy.name ?? 'No name'}
      savedAt={policy.created_at}
      wrapTitle={asDialogTitle}
      wrapSummary={asDialogDescription}
      subject="This policy"
      reformHeading="Reform"
      changes={changes}
      notes={
        !inPageCountry && (
          <OtherCountryNote
            subject="policy"
            itemCountryId={policy.country_id}
            pageCountryId={countryId}
            shownAs="its parameters show by their paths, without current law or units"
          />
        )
      }
      reports={{
        countryId: policy.country_id,
        reports,
        reformName: policyName,
        openIn: 'newTab',
        cannotOpenReason: isFlagshipShellEnabled(policy.country_id)
          ? undefined
          : `These reports can't be opened while the ${getCountryLabel(policy.country_id)} uses the older interface.`,
        emptyNote: 'No reports yet.',
      }}
    />
  );
}
