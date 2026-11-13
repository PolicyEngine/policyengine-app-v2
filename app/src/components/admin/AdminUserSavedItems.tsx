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
import type { AdminSavedHousehold } from '@/hooks/useAdminSavedHousehold';
import type { AdminSavedPolicy } from '@/hooks/useAdminSavedPolicy';
import { useAdminUserSavedItems } from '@/hooks/useAdminUserSavedItems';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CountryId } from '@/libs/countries';
import { getCountryLabel } from '@/utils/geographyUtils';
import AdminSavedItemPanel from './AdminSavedItemPanel';
import { formatAdminDate } from './adminUserFormat';
import NewTabLink from './NewTabLink';
import SavedHouseholdDetails from './SavedHouseholdDetails';
import SavedPolicyDetails from './SavedPolicyDetails';

/** A saved policy or household, which the panel shows. */
type PanelItem =
  | { kind: 'policy'; policy: AdminSavedPolicy }
  | { kind: 'household'; household: AdminSavedHousehold };

/** One saved record, whatever its kind, as its table shows it. */
interface SavedItemRow {
  /** The saved record's own ID. */
  id: string;
  name: string | null;
  countryId: string;
  createdAt: string;
  /** Reports only: when it last ran, or null if it never has. */
  lastRunAt?: string | null;
  /** Policies and households: the record, which its name opens in the panel. */
  panelItem?: PanelItem;
  /** Reports only: the report's page, which its name opens in a new tab. */
  reportPath?: string;
}

/** One kind of saved record: policies, households or reports. */
interface SavedItemKind {
  /** Plural, such as "Policies". */
  heading: string;
  tableLabel: string;
  emptyMessage: string;
  rows: SavedItemRow[];
  showsLastRun: boolean;
}

/**
 * The saved policies, households and reports. Each name opens the record
 * itself, which says more than the IDs it points to. The read also
 * returns the user's saved simulations, which the view leaves out.
 */
function savedItemKinds(savedItems: UserSavedItems): SavedItemKind[] {
  return [
    {
      heading: 'Policies',
      tableLabel: 'Saved policies',
      emptyMessage: 'No saved policies.',
      showsLastRun: false,
      rows: savedItems.policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        countryId: policy.country_id,
        createdAt: policy.created_at,
        panelItem: { kind: 'policy', policy },
      })),
    },
    {
      heading: 'Households',
      tableLabel: 'Saved households',
      emptyMessage: 'No saved households.',
      showsLastRun: false,
      rows: savedItems.households.map((household) => ({
        id: household.id,
        name: household.name,
        countryId: household.country_id,
        createdAt: household.created_at,
        panelItem: { kind: 'household', household },
      })),
    },
    {
      heading: 'Reports',
      tableLabel: 'Saved reports',
      emptyMessage: 'No saved reports.',
      showsLastRun: true,
      rows: savedItems.reports.map((report) => ({
        id: report.id,
        name: report.name,
        countryId: report.country_id,
        createdAt: report.created_at,
        lastRunAt: report.last_run_at,
        // A saved report's own ID is its link, which anyone can open, in
        // the country it was saved in.
        reportPath: `/${report.country_id}/report/${report.id}`,
      })),
    },
  ];
}

/** Opens a saved policy or household in the panel; `opener` takes focus back when it closes. */
type OpenInPanel = (item: PanelItem, opener: HTMLElement) => void;

/** A record's name: for a policy or household, a control that opens it; for a report, a link to it. */
function SavedItemName({ row, onOpen }: { row: SavedItemRow; onOpen: OpenInPanel }) {
  const name = row.name ?? 'No name';
  const { panelItem, reportPath } = row;
  if (panelItem) {
    return (
      <Button
        variant="link"
        className="tw:h-auto tw:p-0 tw:whitespace-normal tw:text-left"
        onClick={(event) => onOpen(panelItem, event.currentTarget)}
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
  onOpen,
}: {
  kind: SavedItemKind;
  countryId: CountryId;
  onOpen: OpenInPanel;
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
              <TableHead>Saved</TableHead>
              {kind.showsLastRun && <TableHead>Last run</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {kind.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell style={{ whiteSpace: 'normal' }}>
                  <SavedItemName row={row} onOpen={onOpen} />
                </TableCell>
                <TableCell>{getCountryLabel(row.countryId)}</TableCell>
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
  const [panelItem, setPanelItem] = useState<PanelItem | null>(null);
  const panelOpenerRef = useRef<HTMLElement | null>(null);
  const openInPanel: OpenInPanel = (item, opener) => {
    panelOpenerRef.current = opener;
    setPanelItem(item);
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
          onOpen={openInPanel}
        />
      ))}
      <AdminSavedItemPanel
        open={panelItem !== null}
        onClose={() => setPanelItem(null)}
        returnFocusTo={panelOpenerRef}
      >
        {panelItem?.kind === 'policy' && (
          <SavedPolicyDetails key={panelItem.policy.id} policy={panelItem.policy} />
        )}
        {panelItem?.kind === 'household' && (
          <SavedHouseholdDetails key={panelItem.household.id} household={panelItem.household} />
        )}
      </AdminSavedItemPanel>
    </Stack>
  );
}

/**
 * A signed-in user's saved policies, households and reports, in every
 * country, read-only. They are read only when the admin asks,
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
              The policies, households and reports this user saved, in every country. Each read is
              recorded with your ID and the user&apos;s.
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
