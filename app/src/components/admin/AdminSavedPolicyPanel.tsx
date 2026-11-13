import dayjs from 'dayjs';
import type { RefObject } from 'react';
import MissingParametersNotice from '@/components/flagship/MissingParametersNotice';
import ReformParameterTable from '@/components/flagship/ReformParameterTable';
import { adminUsersPath } from '@/components/settings/settingsPages';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Spinner,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  useAdminSavedPolicyContent,
  type AdminSavedPolicy,
  type AdminSavedPolicyContent,
} from '@/hooks/useAdminSavedPolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { reformParameterNames } from '@/libs/flagship/v3ParameterNames';
import { getCountryLabel } from '@/utils/geographyUtils';
import NewTabLink from './NewTabLink';

const SECONDARY_TEXT: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/** "1 provision · saved Oct 12, 2026", as the reforms page says it; the date alone until read. */
function savedLine(createdAt: string, content: AdminSavedPolicyContent | undefined): string {
  const saved = dayjs(createdAt).format('MMM D, YYYY');
  if (content === undefined) {
    return `Saved ${saved}`;
  }
  const count = content.parameters.length;
  return `${count} ${count === 1 ? 'provision' : 'provisions'} · saved ${saved}`;
}

/**
 * The parameters of a policy saved in this page's country, as the reforms
 * page shows a saved reform's: the parameters the model no longer has, then
 * the table. Names and current law come from the loaded metadata, so only
 * this country's policies can be shown.
 */
function PolicyParameters({
  content,
  error,
  onRetry,
}: {
  content: AdminSavedPolicyContent | undefined;
  error: Error | null;
  onRetry: () => void;
}) {
  const metadata = useEnsureV3Parameters(content ? reformParameterNames([content]) : []);
  if (error) {
    return (
      <Stack gap="sm" align="start">
        <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
          We could not load this policy: {error.message}
        </Text>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    );
  }
  if (content === undefined) {
    return (
      <Stack role="status" aria-live="polite" gap="sm" align="start">
        <Spinner size="sm" />
        <Text size="sm" style={SECONDARY_TEXT}>
          Loading the policy…
        </Text>
      </Stack>
    );
  }
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

/** The panel's content for one policy; mounted only while the panel shows it. */
function PolicyDetails({ policy }: { policy: AdminSavedPolicy }) {
  const countryId = useCurrentCountry();
  const inThisCountry = policy.country_id === countryId;
  const read = useAdminSavedPolicyContent(policy, inThisCountry);
  const countryLabel = getCountryLabel(policy.country_id);
  return (
    <Stack style={{ gap: spacing.xl, padding: spacing.xl }}>
      <Stack style={{ gap: spacing.xs }}>
        <SheetTitle asChild>
          <Title order={2} style={{ margin: 0 }}>
            {policy.name ?? 'No name'}
          </Title>
        </SheetTitle>
        <SheetDescription asChild>
          <Text style={SECONDARY_TEXT}>{savedLine(policy.created_at, read.data)}</Text>
        </SheetDescription>
      </Stack>
      {inThisCountry ? (
        <PolicyParameters
          content={read.data}
          error={read.error}
          onRetry={() => void read.refetch()}
        />
      ) : (
        // Names and current law come from this country's metadata, which
        // cannot name another country's parameters.
        <Stack gap="sm" align="start">
          <Text style={SECONDARY_TEXT}>
            This policy was saved in the {countryLabel}. Its parameters show on the {countryLabel}{' '}
            admin page.
          </Text>
          <NewTabLink href={adminUsersPath(policy.country_id)}>
            {`Open the ${countryLabel} admin page`}
          </NewTabLink>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * A panel over the admin page showing one of a user's saved policies, read
 * only, as the reforms page shows a saved reform: its name, how many
 * provisions it has and when it was saved, and its parameters against
 * current law. It offers nothing that changes the policy. `policy` null
 * closes it, and focus goes back to `returnFocusTo`, the control that
 * opened it: the panel has no trigger of its own to return focus to.
 */
export default function AdminSavedPolicyPanel({
  policy,
  onClose,
  returnFocusTo,
}: {
  policy: AdminSavedPolicy | null;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLElement | null>;
}) {
  return (
    <Sheet open={policy !== null} onOpenChange={(open) => !open && onClose()}>
      {policy && (
        <SheetContent
          side="right"
          className="tw:w-full tw:sm:max-w-2xl tw:overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
        >
          <PolicyDetails key={policy.id} policy={policy} />
        </SheetContent>
      )}
    </Sheet>
  );
}
