import type { ReactNode } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { AlertDialog } from 'radix-ui';
import { Button } from '@/components/ui';

/**
 * A Delete button that asks first, for v3's saved work: a delete cannot be
 * undone. The dialog names what is deleted and says what the delete does.
 */
export default function DeleteConfirmationDialog({
  name,
  description,
  confirmLabel,
  disabled,
  onConfirm,
  compact = false,
}: {
  /** What is deleted, as the dialog's title names it. */
  name: string;
  /** What the delete does, under the title. */
  description: ReactNode;
  /** The button that deletes, e.g. "Delete reform". */
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
  /** A small, borderless Delete button, for a row of a list. */
  compact?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button
          size={compact ? 'sm' : 'default'}
          variant={compact ? 'ghost' : 'outline'}
          disabled={disabled}
        >
          <IconTrash size={compact ? 14 : 16} aria-hidden />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="tw:fixed tw:inset-0 tw:z-50 tw:bg-black/50" />
        <AlertDialog.Content className="tw:bg-background tw:fixed tw:top-[50%] tw:left-[50%] tw:z-50 tw:grid tw:w-full tw:max-w-[calc(100%-2rem)] tw:translate-x-[-50%] tw:translate-y-[-50%] tw:gap-4 tw:rounded-lg tw:border tw:p-6 tw:shadow-lg tw:outline-none tw:sm:max-w-[28rem]">
          <AlertDialog.Title className="tw:text-lg tw:leading-snug tw:font-semibold">
            Delete “{name}”?
          </AlertDialog.Title>
          <AlertDialog.Description className="tw:text-muted-foreground tw:text-sm">
            {description}
          </AlertDialog.Description>
          <div className="tw:flex tw:flex-col-reverse tw:gap-2 tw:sm:flex-row tw:sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
