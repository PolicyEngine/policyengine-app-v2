import dayjs from 'dayjs';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import MissingParametersNotice from '@/components/flagship/MissingParametersNotice';
import ReformParameterTable from '@/components/flagship/ReformParameterTable';
import ReformReports from '@/components/flagship/ReformReports';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { Parameter } from '@/types/subIngredients/parameter';

/** "Oct 12, 2026", as a saved item's summary says when it was saved. */
export function savedOn(createdAt: string): string {
  return dayjs(createdAt).format('MMM D, YYYY');
}

/**
 * What a saved reform's summary says of its changes: how many provisions
 * it has, that they could not be loaded, or, while they're read, nothing.
 */
export type SavedReformChangesSummary = { count: number } | 'unavailable' | 'reading';

/**
 * A saved reform's summary, under its name: "3 provisions · saved Oct 12,
 * 2026", "Changes could not be loaded · saved Oct 12, 2026", or "Saved
 * Oct 12, 2026" while its changes are read. Without a save date, the
 * changes alone.
 */
export function savedReformSummary(
  changes: SavedReformChangesSummary,
  savedAt: string | null | undefined
): string {
  const changesText =
    changes === 'unavailable'
      ? 'Changes could not be loaded'
      : changes === 'reading'
        ? null
        : `${changes.count} ${changes.count === 1 ? 'provision' : 'provisions'}`;
  const saved = savedAt ? savedOn(savedAt) : null;
  if (changesText === null) {
    return saved ? `Saved ${saved}` : '';
  }
  return saved ? `${changesText} · saved ${saved}` : changesText;
}

/** Wraps part of a heading, such as a dialog's title around the name. */
type HeadingWrapper = (part: ReactElement) => ReactElement;

const unwrapped: HeadingWrapper = (part) => part;

/**
 * A saved item's name as a level-1 heading and, under it, its summary, as
 * the reforms page heads a saved reform. In a dialog, `wrapTitle` and
 * `wrapSummary` make them its title and description.
 */
export function SavedItemHeading({
  name,
  summary,
  wrapTitle = unwrapped,
  wrapSummary = unwrapped,
}: {
  name: string;
  summary: string;
  wrapTitle?: HeadingWrapper;
  wrapSummary?: HeadingWrapper;
}) {
  return (
    <Stack style={{ gap: spacing.xs }}>
      {wrapTitle(
        // A name without spaces wraps too, rather than running past the view.
        <Title order={1} style={{ margin: 0, overflowWrap: 'anywhere' }}>
          {name}
        </Title>
      )}
      {wrapSummary(
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {summary}
        </Text>
      )}
    </Stack>
  );
}

/**
 * A saved reform's changes: read, so its parameters show, or not (still
 * being read, or unreadable), so `placeholder` shows in their place.
 * `unavailable` says its changes could not be loaded.
 */
export type SavedReformChanges =
  | {
      read: true;
      parameters: Parameter[];
      /** The parameters it sets that the model no longer has. */
      missingParameters: string[];
      unavailable?: boolean;
      /** The model's parameter metadata, which names the parameters and gives current law. */
      metadataReady: boolean;
      metadataFailed: boolean;
      onRetryMetadata: () => void;
      /** Shows the parameters by their paths, without current law. */
      withoutMetadata?: boolean;
    }
  | { read: false; unavailable: boolean; placeholder: ReactNode };

/**
 * A saved reform, read only, as the reforms page shows one and the admin
 * page's dialog shows a user's saved policy: its name and summary, the
 * notice of parameters the model no longer has, `notes`, its parameters
 * against current law, `actions`, and the reports run from it. Each place
 * adds only its own parts: the reforms page its way back and what can be
 * done with the reform, the admin dialog its notes and how its reports
 * open.
 */
export default function SavedReformView({
  lead,
  name,
  savedAt,
  wrapTitle,
  wrapSummary,
  subject,
  reformHeading,
  changes,
  notes,
  actions,
  reports,
}: {
  /** Above the heading, such as the reforms page's way back to its list. */
  lead?: ReactNode;
  name: string;
  savedAt: string | null | undefined;
  wrapTitle?: HeadingWrapper;
  wrapSummary?: HeadingWrapper;
  /** What the notice of removed parameters calls it, such as "This reform". */
  subject: string;
  /** The parameter table's heading for its values, such as "Your reform". */
  reformHeading: string;
  changes: SavedReformChanges;
  /** After the notice, before the parameters: more about the reform, such as why it can't load. */
  notes?: ReactNode;
  /** After the parameters: what can be done with the reform, and how that went. */
  actions?: ReactNode;
  reports: ComponentProps<typeof ReformReports>;
}) {
  const summary = savedReformSummary(
    changes.unavailable
      ? 'unavailable'
      : changes.read
        ? { count: changes.parameters.length }
        : 'reading',
    savedAt
  );
  return (
    <Stack style={{ gap: spacing.xl }}>
      {lead}
      <SavedItemHeading
        name={name}
        summary={summary}
        wrapTitle={wrapTitle}
        wrapSummary={wrapSummary}
      />
      {changes.read && changes.missingParameters.length > 0 && (
        <MissingParametersNotice subject={subject} parameterPaths={changes.missingParameters} />
      )}
      {notes}
      {changes.read ? (
        <ReformParameterTable
          reformParameters={changes.parameters}
          reformHeading={reformHeading}
          metadataReady={changes.metadataReady}
          metadataFailed={changes.metadataFailed}
          onRetryMetadata={changes.onRetryMetadata}
          withoutMetadata={changes.withoutMetadata}
        />
      ) : (
        changes.placeholder
      )}
      {actions}
      <ReformReports {...reports} />
    </Stack>
  );
}
