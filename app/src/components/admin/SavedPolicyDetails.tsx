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
  OtherCountryNotice,
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
 * law come from the loaded metadata.
 */
function PolicyParameters({ content }: { content: AdminSavedPolicyContent }) {
  const metadata = useEnsureV3Parameters(reformParameterNames([content]));
  return (
    <>
      {content.missingParameters.length > 0 && (
        <MissingParametersNotice subject="This policy" parameterPaths={content.missingParameters} />
      )}
      <ReformParameterTable
        reformParameters={content.parameters}
        reformHeading="Reform"
        metadataReady={metadata.status === 'ready'}
        metadataFailed={metadata.status === 'error'}
        onRetryMetadata={metadata.retry}
      />
    </>
  );
}

/**
 * One of a user's saved policies in the admin page's panel, read only, as
 * the reforms page shows a saved reform: its name, how many provisions it
 * has and when it was saved, and its parameters against current law. Only
 * a policy saved in this page's country is read and shown.
 */
export default function SavedPolicyDetails({ policy }: { policy: AdminSavedPolicy }) {
  const countryId = useCurrentCountry();
  const inThisCountry = policy.country_id === countryId;
  const read = useAdminSavedPolicyContent(policy, inThisCountry);
  return (
    <>
      <SavedItemHeader
        name={policy.name}
        description={policyDescription(policy.created_at, read.data)}
      />
      {!inThisCountry ? (
        <OtherCountryNotice subject="policy" countryId={policy.country_id} />
      ) : read.error ? (
        <SavedItemReadError
          subject="policy"
          error={read.error}
          onRetry={() => void read.refetch()}
        />
      ) : read.data === undefined ? (
        <SavedItemLoading subject="policy" />
      ) : (
        <PolicyParameters content={read.data} />
      )}
    </>
  );
}
