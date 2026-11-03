import DeleteConfirmationDialog from '@/components/flagship/DeleteConfirmationDialog';

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
    <DeleteConfirmationDialog
      name={name}
      description={`This removes the reform for good.${reportsNote(reportCount)}`}
      confirmLabel="Delete reform"
      disabled={disabled}
      onConfirm={onConfirm}
    />
  );
}
