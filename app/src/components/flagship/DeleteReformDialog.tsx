import { IconTrash } from '@tabler/icons-react';
import { AlertDialog } from 'radix-ui';
import { Button } from '@/components/ui';

/** What the delete does to the reports run from the reform. */
function reportsNote(reportCount: number): string {
  if (reportCount === 0) {
    return '';
  }
  return reportCount === 1
    ? ' Its 1 report leaves this list; it still opens from its link.'
    : ` Its ${reportCount} reports leave this list; they still open from their links.`;
}

/**
 * The reform detail's Delete button. A delete cannot be undone, and the
 * reform's reports are listed only under it, so the button asks first.
 */
export default function DeleteReformDialog({
  name,
  reportCount,
  disabled,
  onConfirm,
}: {
  name: string;
  /** The reports this browser ran from the reform. */
  reportCount: number;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="outline" disabled={disabled}>
          <IconTrash size={16} />
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
            This removes the reform for good.{reportsNote(reportCount)}
          </AlertDialog.Description>
          <div className="tw:flex tw:flex-col-reverse tw:gap-2 tw:sm:flex-row tw:sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Delete reform
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
