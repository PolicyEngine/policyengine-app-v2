import dayjs from 'dayjs';
import type { ReactNode, RefObject } from 'react';
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
import { getCountryLabel } from '@/utils/geographyUtils';

/** The panel's quieter text: the line under its title, notes and loading. */
export const SECONDARY_TEXT: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/** "Oct 12, 2026", as the reforms page says when a reform was saved. */
export function savedOn(createdAt: string): string {
  return dayjs(createdAt).format('MMM D, YYYY');
}

/** What a panel shows: "policy" or "household". */
export type SavedItemSubject = 'policy' | 'household';

/** The saved item's name and, under it, a line about it; they name and describe the panel. */
export function SavedItemHeader({
  name,
  description,
}: {
  name: string | null;
  description: string;
}) {
  return (
    <Stack style={{ gap: spacing.xs }}>
      <SheetTitle asChild>
        <Title order={2} style={{ margin: 0 }}>
          {name ?? 'No name'}
        </Title>
      </SheetTitle>
      <SheetDescription asChild>
        <Text style={SECONDARY_TEXT}>{description}</Text>
      </SheetDescription>
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
 * A panel over the admin page showing one of a user's saved items, read
 * only. `children` is the item's content, starting with a
 * `SavedItemHeader`, which names the panel. When it closes, focus goes back
 * to `returnFocusTo`, the control that opened it: the panel has no trigger
 * of its own to return focus to.
 */
export default function AdminSavedItemPanel({
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
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {open && (
        <SheetContent
          side="right"
          className="tw:w-full tw:sm:max-w-2xl tw:overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
        >
          <Stack style={{ gap: spacing.xl, padding: spacing.xl }}>{children}</Stack>
        </SheetContent>
      )}
    </Sheet>
  );
}
