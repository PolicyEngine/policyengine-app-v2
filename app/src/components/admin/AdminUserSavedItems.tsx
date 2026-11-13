import { useEffect, useId, useRef, useState } from 'react';
import type { UserSavedItems } from '@/api/v2AdminUserSavedItems';
import {
  Button,
  ShadcnTable,
  Spinner,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Title,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';
import type { AdminSavedPolicy } from '@/hooks/useAdminSavedPolicy';
import { useAdminUserSavedItems } from '@/hooks/useAdminUserSavedItems';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CountryId } from '@/libs/countries';
import { getCountryLabel } from '@/utils/geographyUtils';
import AdminSavedPolicyPanel from './AdminSavedPolicyPanel';
import { formatAdminDate } from './adminUserFormat';
import NewTabLink from './NewTabLink';

/** One saved record, whatever its kind, as its table shows it. */
interface SavedItemRow {
  /** The saved record's own ID. */
  id: string;
  name: string | null;
  countryId: string;
  /** The ID of the policy, household, simulation or report it points to. */
  targetId: string | null;
  /** The same for one saved before the detailed-save API: a v1 ID. */
  legacyTargetId: number | null;
  createdAt: string;
  /** Reports only: when it last ran, or null if it never has. */
  lastRunAt?: string | null;
  /** Policies only: the saved policy, which its name opens in a panel. */
  policy?: AdminSavedPolicy;
  /** Reports only: the report's page, which its name opens in a new tab. */
  reportPath?: string;
}

/** One kind of saved record: policies, households, simulations or reports. */
interface SavedItemKind {
  /** Plural, such as "Policies". */
  heading: string;
  tableLabel: string;
  emptyMessage: string;
  /** The heading of the column of IDs the records point to; null for none. */
  targetIdHeader: string | null;
  rows: SavedItemRow[];
  showsLastRun: boolean;
}

function savedItemKinds(savedItems: UserSavedItems): SavedItemKind[] {
  return [
    {
      heading: 'Policies',
      tableLabel: 'Saved policies',
      emptyMessage: 'No saved policies.',
      // Each name opens the policy itself, which says more than its ID.
      targetIdHeader: null,
      showsLastRun: false,
      rows: savedItems.policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        countryId: policy.country_id,
        targetId: policy.policy_id,
        legacyTargetId: policy.legacy_policy_id,
        createdAt: policy.created_at,
        policy,
      })),
    },
    {
      heading: 'Households',
      tableLabel: 'Saved households',
      emptyMessage: 'No saved households.',
      targetIdHeader: 'Household ID',
      showsLastRun: false,
      rows: savedItems.households.map((household) => ({
        id: household.id,
        name: household.name,
        countryId: household.country_id,
        targetId: household.household_id,
        legacyTargetId: household.legacy_household_id,
        createdAt: household.created_at,
      })),
    },
    {
      heading: 'Simulations',
      tableLabel: 'Saved simulations',
      emptyMessage: 'No saved simulations.',
      targetIdHeader: 'Simulation ID',
      showsLastRun: false,
      rows: savedItems.simulations.map((simulation) => ({
        id: simulation.id,
        name: simulation.name,
        countryId: simulation.country_id,
        targetId: simulation.simulation_id,
        legacyTargetId: simulation.legacy_simulation_id,
        createdAt: simulation.created_at,
      })),
    },
    {
      heading: 'Reports',
      tableLabel: 'Saved reports',
      emptyMessage: 'No saved reports.',
      // Each name opens the report itself, which says more than its ID.
      targetIdHeader: null,
      showsLastRun: true,
      rows: savedItems.reports.map((report) => ({
        id: report.id,
        name: report.name,
        countryId: report.country_id,
        targetId: report.report_id,
        legacyTargetId: report.legacy_report_id,
        createdAt: report.created_at,
        lastRunAt: report.last_run_at,
        // A saved report's own ID is its link, which anyone can open, in
        // the country it was saved in.
        reportPath: `/${report.country_id}/report/${report.id}`,
      })),
    },
  ];
}

/** The IDs a record points to: its v2 ID, its v1 ID marked "(v1)", or both. */
function targetIdLabel({ targetId, legacyTargetId }: SavedItemRow): string {
  const labels = [targetId, legacyTargetId === null ? null : `${legacyTargetId} (v1)`].filter(
    (label): label is string => label !== null
  );
  return labels.length > 0 ? labels.join(', ') : 'None';
}

/** Opens a saved policy's panel; `opener` takes focus back when it closes. */
type OpenPolicy = (policy: AdminSavedPolicy, opener: HTMLElement) => void;

/** A record's name: for a policy, a control that opens it; for a report, a link to it. */
function SavedItemName({ row, onOpenPolicy }: { row: SavedItemRow; onOpenPolicy: OpenPolicy }) {
  const name = row.name ?? 'No name';
  const { policy, reportPath } = row;
  if (policy) {
    return (
      <Button
        variant="link"
        className="tw:h-auto tw:p-0 tw:whitespace-normal tw:text-left"
        onClick={(event) => onOpenPolicy(policy, event.currentTarget)}
      >
        {name}
      </Button>
    );
  }
  if (reportPath) {
    return <NewTabLink href={reportPath}>{name}</NewTabLink>;
  }
  return name;
}

function SavedItemKindTable({
  kind,
  countryId,
  onOpenPolicy,
}: {
  kind: SavedItemKind;
  countryId: CountryId;
  onOpenPolicy: OpenPolicy;
}) {
  return (
    <Stack gap="xs">
      <Title order={4} style={{ margin: 0, fontSize: typography.fontSize.sm }}>
        {`${kind.heading} (${kind.rows.length})`}
      </Title>
      {kind.rows.length === 0 ? (
        <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
          {kind.emptyMessage}
        </Text>
      ) : (
        <ShadcnTable aria-label={kind.tableLabel}>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              {kind.targetIdHeader !== null && <TableHead>{kind.targetIdHeader}</TableHead>}
              <TableHead>Saved</TableHead>
              {kind.showsLastRun && <TableHead>Last run</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {kind.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell style={{ whiteSpace: 'normal' }}>
                  <SavedItemName row={row} onOpenPolicy={onOpenPolicy} />
                </TableCell>
                <TableCell>{getCountryLabel(row.countryId)}</TableCell>
                {kind.targetIdHeader !== null && (
                  <TableCell style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                    {targetIdLabel(row)}
                  </TableCell>
                )}
                <TableCell>{formatAdminDate(row.createdAt, countryId)}</TableCell>
                {kind.showsLastRun && (
                  <TableCell>
                    {row.lastRunAt ? formatAdminDate(row.lastRunAt, countryId) : 'Never'}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      )}
    </Stack>
  );
}

/**
 * Reads the saved items when it mounts, and shows them, or why they could
 * not be read. `focusHeading` gives the section's heading focus.
 */
function SavedItemsContent({ userId, focusHeading }: { userId: string; focusHeading: () => void }) {
  const countryId = useCurrentCountry();
  const savedItems = useAdminUserSavedItems(userId);
  const [openPolicy, setOpenPolicy] = useState<AdminSavedPolicy | null>(null);
  const policyOpenerRef = useRef<HTMLElement | null>(null);
  const openPolicyFrom: OpenPolicy = (policy, opener) => {
    policyOpenerRef.current = opener;
    setOpenPolicy(policy);
  };

  // Each showing reads once and keeps nothing from an earlier one (see
  // `useAdminUserSavedItems`), so an error here never has items to keep.
  if (savedItems.isError) {
    return (
      <Stack gap="sm" align="start">
        <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
          We could not load the saved items: {savedItems.error.message}
        </Text>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // The loading status replaces the button as soon as the read starts,
            // which would leave focus nowhere.
            focusHeading();
            void savedItems.refetch();
          }}
        >
          Try again
        </Button>
      </Stack>
    );
  }
  if (savedItems.data === undefined) {
    return (
      <Stack role="status" aria-live="polite" gap="sm" align="start">
        <Spinner size="sm" />
        <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
          Loading the saved items…
        </Text>
      </Stack>
    );
  }
  return (
    <Stack gap="lg">
      {savedItemKinds(savedItems.data).map((kind) => (
        <SavedItemKindTable
          key={kind.heading}
          kind={kind}
          countryId={countryId}
          onOpenPolicy={openPolicyFrom}
        />
      ))}
      <AdminSavedPolicyPanel
        policy={openPolicy}
        onClose={() => setOpenPolicy(null)}
        returnFocusTo={policyOpenerRef}
      />
    </Stack>
  );
}

/**
 * A signed-in user's saved policies, households, simulations and reports,
 * in every country, read-only. They are read only when the admin asks,
 * since the Public API records each read with the admin's and the user's
 * IDs: opening a user to change their type reads none of them.
 */
export default function AdminUserSavedItems({ userId }: { userId: string }) {
  const [shown, setShown] = useState(false);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // "Show saved items" had focus and is gone; the heading takes it.
    if (shown) {
      headingRef.current?.focus();
    }
  }, [shown]);

  return (
    <section aria-labelledby={headingId}>
      <Stack gap="sm">
        <Title
          order={3}
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          style={{ margin: 0, fontSize: typography.fontSize.base }}
        >
          Saved items
        </Title>
        {shown ? (
          <SavedItemsContent userId={userId} focusHeading={() => headingRef.current?.focus()} />
        ) : (
          <Stack gap="sm" align="start">
            <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
              The policies, households, simulations and reports this user saved, in every country.
              Each read is recorded with your ID and the user&apos;s.
            </Text>
            <Button variant="outline" size="sm" onClick={() => setShown(true)}>
              Show saved items
            </Button>
          </Stack>
        )}
      </Stack>
    </section>
  );
}
