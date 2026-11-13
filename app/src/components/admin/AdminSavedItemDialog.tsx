import dayjs from 'dayjs';
import type { ReactNode, RefObject } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Spinner,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { getCountryLabel } from '@/utils/geographyUtils';

/** The dialog's quieter text: the line under its title, notes and loading. */
export const SECONDARY_TEXT: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/** "Oct 12, 2026", as the reforms page says when a reform was saved. */
export function savedOn(createdAt: string): string {
  return dayjs(createdAt).format('MMM D, YYYY');
}

/** What a dialog shows: "policy" or "household". */
export type SavedItemSubject = 'policy' | 'household';

/**
 * The saved item's name and, under it, a line about it, as the reforms page
 * heads a saved reform; they name and describe the dialog.
 */
export function SavedItemHeader({
  name,
  description,
}: {
  name: string | null;
  description: string;
}) {
  return (
    // Clear of the dialog's close button, in its top right corner.
    <Stack style={{ gap: spacing.xs, paddingRight: spacing['2xl'] }}>
      {/*
        A name without spaces wraps too, rather than running under the close
        button. The class name keeps the reforms page's heading size (Title's
        order 1), which DialogTitle's own text size and line height replace.
      */}
      <DialogTitle asChild className="tw:text-4xl tw:font-bold">
        <Title order={1} style={{ margin: 0, overflowWrap: 'anywhere' }}>
          {name ?? 'No name'}
        </Title>
      </DialogTitle>
      <DialogDescription asChild>
        <Text style={SECONDARY_TEXT}>{description}</Text>
      </DialogDescription>
    </Stack>
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
 * The width the reforms page shows a saved reform at (`WorkspaceLayout`'s
 * reading width, 760px), with the dialog's padding on each side, and never
 * wider than the window less a margin.
 */
const DIALOG_MAX_WIDTH = `min(calc(760px + 2 * ${spacing.xl}), calc(100% - 2rem))`;

/**
 * A modal dialog over the admin page showing one of a user's saved items,
 * read only, at the width the reforms page shows a saved reform. It is
 * never taller than the window: its content scrolls under the close
 * button. `children` is the item's content, starting with a
 * `SavedItemHeader`, which names the dialog. When it closes, focus goes
 * back to `returnFocusTo`, the control that opened it: the dialog has no
 * trigger of its own to return focus to.
 */
export default function AdminSavedItemDialog({
  open,
  onClose,
  returnFocusTo,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLElement | null>;
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
          <div className="tw:min-h-0 tw:overflow-y-auto" style={{ padding: spacing.xl }}>
            <Stack style={{ gap: spacing.xl }}>{children}</Stack>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
