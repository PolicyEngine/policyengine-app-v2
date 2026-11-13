import { parseReportItem, type FlagshipReportRecord } from '@/api/flagshipReportStore';
import type { UserSavedItems } from '@/api/v2AdminUserSavedItems';
import MissingParametersNotice from '@/components/flagship/MissingParametersNotice';
import ReformParameterTable from '@/components/flagship/ReformParameterTable';
import ReformReports from '@/components/flagship/ReformReports';
import {
  useAdminSavedPolicyContent,
  type AdminSavedPolicy,
  type AdminSavedPolicyContent,
} from '@/hooks/useAdminSavedPolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import type { CountryId } from '@/libs/countries';
import { isFlagshipShellEnabled } from '@/libs/featureFlags';
import { reformParameterNames } from '@/libs/flagship/v3ParameterNames';
import type { UserReportItem } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';
import {
  OtherCountryNote,
  SavedItemHeader,
  SavedItemLoading,
  SavedItemReadError,
  savedOn,
} from './AdminSavedItemDialog';

/** "1 provision · saved Oct 12, 2026", as the reforms page says it; the date alone until read. */
function policyDescription(createdAt: string, content: AdminSavedPolicyContent | undefined) {
  if (content === undefined) {
    return `Saved ${savedOn(createdAt)}`;
  }
  const count = content.parameters.length;
  return `${count} ${count === 1 ? 'provision' : 'provisions'} · saved ${savedOn(createdAt)}`;
}

/**
 * The policy's parameters, as the reforms page shows a saved reform's: the
 * parameters the model no longer has, then the table. Names and current
 * law come from the loaded metadata, for a policy of the page's country;
 * another country's policy shows without them.
 */
function PolicyParameters({
  content,
  inPageCountry,
}: {
  content: AdminSavedPolicyContent;
  inPageCountry: boolean;
}) {
  const metadata = useEnsureV3Parameters(inPageCountry ? reformParameterNames([content]) : []);
  return (
    <>
      {content.missingParameters.length > 0 && (
        <MissingParametersNotice subject="This policy" parameterPaths={content.missingParameters} />
      )}
      <ReformParameterTable
        reformParameters={content.parameters}
        reformHeading="Reform"
        metadataReady={!inPageCountry || metadata.status === 'ready'}
        metadataFailed={inPageCountry && metadata.status === 'error'}
        onRetryMetadata={metadata.retry}
        withoutMetadata={!inPageCountry}
      />
    </>
  );
}

/**
 * An exported saved report as the app's own type of one. The export is
 * typed from the Public API's schema, which leaves a provision's `unit` and
 * `intervals` optional and its `growth_round` any string; `parseReportItem`
 * reads the result through the report schema, which checks those fields.
 */
function asUserReportItem(report: UserSavedItems['reports'][number]): UserReportItem {
  return report as UserReportItem;
}

/**
 * The reports the user ran from the policy, as the reforms page lists a
 * saved reform's: each opens its page in a new tab, where the policy's
 * country has the v3 interface, which that page belongs to. A saved report
 * the app can't read is left out, as the reforms page leaves it out.
 */
function PolicyReports({
  policy,
  savedItems,
}: {
  policy: AdminSavedPolicy;
  savedItems: Pick<UserSavedItems, 'policies' | 'reports'>;
}) {
  const reports = savedItems.reports
    .filter((report) => report.user_policy_id === policy.id)
    .flatMap((report): FlagshipReportRecord[] => {
      const parsed = parseReportItem(asUserReportItem(report));
      return parsed.ok ? [parsed.value] : [];
    });
  return (
    <ReformReports
      countryId={policy.country_id as CountryId}
      reports={reports}
      reformName={(policyId) => savedItems.policies.find((saved) => saved.id === policyId)?.name}
      openIn="newTab"
      cannotOpenReason={
        isFlagshipShellEnabled(policy.country_id)
          ? undefined
          : `These reports can't be opened while the ${getCountryLabel(policy.country_id)} uses the older interface.`
      }
      emptyNote="No reports yet."
    />
  );
}

/**
 * One of a user's saved policies in the admin page's dialog, read only, as
 * the reforms page shows a saved reform: its name, how many provisions it
 * has and when it was saved, its parameters against current law, and the
 * reports run from it. Names and current law come from the page's
 * country's model, so a policy saved in another country shows its
 * parameters by their paths, and says so.
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
  return (
    <>
      <SavedItemHeader
        name={policy.name}
        description={policyDescription(policy.created_at, read.data)}
      />
      {!inPageCountry && (
        <OtherCountryNote
          subject="policy"
          itemCountryId={policy.country_id}
          pageCountryId={countryId}
          shownAs="its parameters show by their paths, without current law or units"
        />
      )}
      {read.error ? (
        <SavedItemReadError
          subject="policy"
          error={read.error}
          onRetry={() => void read.refetch()}
        />
      ) : read.data === undefined ? (
        <SavedItemLoading subject="policy" />
      ) : (
        <PolicyParameters content={read.data} inPageCountry={inPageCountry} />
      )}
      <PolicyReports policy={policy} savedItems={savedItems} />
    </>
  );
}
