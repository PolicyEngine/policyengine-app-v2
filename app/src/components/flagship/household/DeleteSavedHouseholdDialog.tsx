import { IconTrash } from '@tabler/icons-react';
import { AlertDialog } from 'radix-ui';
import { Button } from '@/components/ui';

/**
 * A saved household's Delete button. A deleted saved household cannot be
 * brought back, so the button asks first. Only the user's saved row goes:
 * the stored household stays, as reports and other users may use it.
 */
export default function DeleteSavedHouseholdDialog({
  name,
  disabled,
  onConfirm,
}: {
  name: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled}>
          <IconTrash size={14} aria-hidden />
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
            This removes it from your households for good. Reports already run with it are not
            changed.
          </AlertDialog.Description>
          <div className="tw:flex tw:flex-col-reverse tw:gap-2 tw:sm:flex-row tw:sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Delete household
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
