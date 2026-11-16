import type { ReactElement, ReactNode, RefObject } from 'react';
import { SAVED_ITEM_SUMMARY_STYLE, SavedItemHeading } from '@/components/flagship/SavedReformView';
import { WORKSPACE_READING_WIDTH } from '@/components/flagship/WorkspaceLayout';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { getCountryLabel } from '@/utils/geographyUtils';

/** The dialog's quieter text: its notes and loading, in the heading's summary style. */
export const SECONDARY_TEXT = SAVED_ITEM_SUMMARY_STYLE;

/** What a dialog shows: "policy" or "household". */
export type SavedItemSubject = 'policy' | 'household';

/**
 * How a saved item's heading names and describes the dialog: its title as
 * the dialog's title and its summary as the dialog's description. The
 * title's class name keeps the reforms page's heading size (Title's order
 * 1), which DialogTitle's own text size and line height would replace.
 */
export const DIALOG_HEADING = {
  wrapTitle: (title: ReactElement): ReactElement => (
    <DialogTitle asChild className="tw:text-4xl tw:font-bold">
      {title}
    </DialogTitle>
  ),
  wrapSummary: (summary: ReactElement): ReactElement => (
    <DialogDescription asChild>{summary}</DialogDescription>
  ),
};

/** A saved item's name in its dialog: its own, or "No name". */
export function dialogName(name: string | null): string {
  return name ?? 'No name';
}

/**
 * A saved item's name and, under it, its summary, in the heading the
 * reforms page gives a saved reform; they name and describe the dialog.
 */
export function SavedItemHeader({ name, summary }: { name: string | null; summary: string }) {
  return <SavedItemHeading name={dialogName(name)} summary={summary} {...DIALOG_HEADING} />;
}

/**
 * For an item saved in another country than the page's: names, current law
 * and units come from the page's country's model, which cannot describe
 * another country's, so the item shows as it is stored. `shownAs` says how:
 * "its parameters show by their paths, without current law or units".
 */
export function OtherCountryNote({
  subject,
  itemCountryId,
  pageCountryId,
  shownAs,
}: {
  subject: SavedItemSubject;
  itemCountryId: string;
  pageCountryId: string;
  shownAs: string;
}) {
  return (
    <Text style={SECONDARY_TEXT}>
      {`This ${subject} was saved in the ${getCountryLabel(itemCountryId)}. This page loads the ${getCountryLabel(pageCountryId)} model only, so ${shownAs}.`}
    </Text>
  );
}

/** Why the item could not be read, with "Try again". */
export function SavedItemReadError({
  subject,
  error,
  onRetry,
}: {
  subject: SavedItemSubject;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Stack gap="sm" align="start">
      <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
        We could not load this {subject}: {error.message}
      </Text>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </Stack>
  );
}

export function SavedItemLoading({ subject }: { subject: SavedItemSubject }) {
  return (
    <Stack role="status" aria-live="polite" gap="sm" align="start">
      <Spinner size="sm" />
      <Text size="sm" style={SECONDARY_TEXT}>
        {`Loading the ${subject}…`}
      </Text>
    </Stack>
  );
}

/**
 * The content's padding. On the right it clears the close button, which
 * the content scrolls under: the button ends 32px from the dialog's edge.
 */
const CONTENT_PADDING = `${spacing.xl} ${spacing['3xl']} ${spacing.xl} ${spacing.xl}`;

/**
 * The width the reforms page shows a saved reform at (`WorkspaceLayout`'s
 * reading width), with the content's padding and the dialog's 1px border on
 * each side, and never wider than the window less a margin.
 */
const DIALOG_MAX_WIDTH = `min(calc(${WORKSPACE_READING_WIDTH}px + ${spacing.xl} + ${spacing['3xl']} + 2px), calc(100% - 2rem))`;

/**
 * A modal dialog over the admin page showing one of a user's saved items,
 * read only, at the width the reforms page shows a saved reform. It is
 * never taller than the window: its content scrolls under the close
 * button, in a region ("Saved policy") that takes keyboard focus, so the
 * keyboard can scroll it though it may hold nothing else to focus.
 * `children` is the item's content, starting with its heading in the
 * dialog's title and description (`DIALOG_HEADING`), which names the
 * dialog. When it closes, focus goes back to
 * `returnFocusTo`, the control that opened it: the dialog has no trigger
 * of its own to return focus to.
 */
export default function AdminSavedItemDialog({
  open,
  onClose,
  returnFocusTo,
  subject,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLElement | null>;
  /** What the dialog shows, which names its content. */
  subject: SavedItemSubject;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {open && (
        <DialogContent
          className="tw:flex tw:flex-col tw:gap-0 tw:overflow-hidden tw:p-0"
          // Inline, so it holds at every window width over the dialog's own
          // max-width classes (32rem from Tailwind's sm breakpoint).
          style={{ maxWidth: DIALOG_MAX_WIDTH, maxHeight: 'calc(100% - 2rem)' }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
        >
          <div
            role="region"
            aria-label={`Saved ${subject}`}
            // A scrolling region with perhaps nothing else to focus: without
            // focus of its own, the keyboard couldn't scroll it.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            // Its focus ring is drawn inside it: the dialog clips anything outside.
            className="tw:min-h-0 tw:overflow-y-auto tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-inset"
            style={{ padding: CONTENT_PADDING }}
          >
            <Stack style={{ gap: spacing.xl }}>{children}</Stack>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
