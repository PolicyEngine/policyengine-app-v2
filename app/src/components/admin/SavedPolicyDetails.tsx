import MissingParametersNotice from '@/components/flagship/MissingParametersNotice';
import ReformParameterTable from '@/components/flagship/ReformParameterTable';
import {
  useAdminSavedPolicyContent,
  type AdminSavedPolicy,
  type AdminSavedPolicyContent,
} from '@/hooks/useAdminSavedPolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { reformParameterNames } from '@/libs/flagship/v3ParameterNames';
import {
  OtherCountryNote,
  SavedItemHeader,
  SavedItemLoading,
  SavedItemReadError,
  savedOn,
} from './AdminSavedItemPanel';

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
 * One of a user's saved policies in the admin page's panel, read only, as
 * the reforms page shows a saved reform: its name, how many provisions it
 * has and when it was saved, and its parameters against current law. Names
 * and current law come from the page's country's model, so a policy saved
 * in another country shows its parameters by their paths, and says so.
 */
export default function SavedPolicyDetails({ policy }: { policy: AdminSavedPolicy }) {
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
    </>
  );
}
