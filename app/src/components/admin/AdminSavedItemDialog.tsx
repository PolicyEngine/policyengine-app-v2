import type { ReactElement, ReactNode, RefObject } from 'react';
import { SavedItemHeading } from '@/components/flagship/SavedReformView';
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
import { colors, spacing, typography } from '@/designTokens';
import { getCountryLabel } from '@/utils/geographyUtils';

/** The dialog's quieter text: its notes and loading, as the heading's summary reads. */
export const SECONDARY_TEXT: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/** What a dialog shows: "policy" or "household". */
export type SavedItemSubject = 'policy' | 'household';

/**
 * A heading's title as the dialog's title, which names the dialog. The
 * class name keeps the reforms page's heading size (Title's order 1),
 * which DialogTitle's own text size and line height would replace.
 */
export function asDialogTitle(title: ReactElement): ReactElement {
  return (
    <DialogTitle asChild className="tw:text-4xl tw:font-bold">
      {title}
    </DialogTitle>
  );
}

/** A heading's summary as the dialog's description. */
export function asDialogDescription(summary: ReactElement): ReactElement {
  return <DialogDescription asChild>{summary}</DialogDescription>;
}

/**
 * A saved item's name ("No name" when it has none) and, under it, its
 * summary, in the heading the reforms page gives a saved reform; they name
 * and describe the dialog.
 */
export function SavedItemHeader({ name, summary }: { name: string | null; summary: string }) {
  return (
    <SavedItemHeading
      name={name ?? 'No name'}
      summary={summary}
      wrapTitle={asDialogTitle}
      wrapSummary={asDialogDescription}
    />
  );
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
 * reading width, 760px), with the content's padding and the dialog's 1px
 * border on each side, and never wider than the window less a margin.
 */
const DIALOG_MAX_WIDTH = `min(calc(760px + ${spacing.xl} + ${spacing['3xl']} + 2px), calc(100% - 2rem))`;

/**
 * A modal dialog over the admin page showing one of a user's saved items,
 * read only, at the width the reforms page shows a saved reform. It is
 * never taller than the window: its content scrolls under the close
 * button, in a region ("Saved policy") that takes keyboard focus, so the
 * keyboard can scroll it though it may hold nothing else to focus.
 * `children` is the item's content, starting with a `SavedItemHeader`,
 * which names the dialog. When it closes, focus goes back to
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
