import MissingParametersTransferDialog from '@/components/flagship/MissingParametersTransferDialog';
import {
  useSavedReportTransfer,
  type SavedReportTransfer,
} from '@/hooks/useMissingParameterTransfers';
import { provisionsWithout } from '@/libs/flagship/missingParameterTransfer';

interface SavedReportTransferDialogProps extends SavedReportTransfer {
  open: boolean;
  /** Closing it is "Not now": the saved report stays as it is, and cannot run. */
  onOpenChange: (open: boolean) => void;
  /**
   * The saved report is an account row, whose ID is its link, so the link
   * keeps working. A report kept in this browser is linked by its v1
   * report, which the transfer replaces.
   */
  keepsLink: boolean;
  /** The new run started, on the same saved report. */
  onTransferred?: () => void;
}

/**
 * Offers to run one of the user's saved reports again without the
 * parameters the model no longer has, onto the same saved report: from
 * Re-run on a reform's page, and on the report's own page.
 */
export default function SavedReportTransferDialog({
  open,
  onOpenChange,
  keepsLink,
  onTransferred,
  ...transfer
}: SavedReportTransferDialogProps) {
  const reportTransfer = useSavedReportTransfer();
  const { report, missingParameters } = transfer;
  const them = missingParameters.length === 1 ? 'this parameter' : 'these parameters';
  return (
    <MissingParametersTransferDialog
      open={open}
      onOpenChange={onOpenChange}
      subject="report"
      parameterPaths={missingParameters}
      transferLabel="Transfer and run again"
      transferNote={`Transferring runs the report again without ${them}, for the same year, population and comparison. ${
        keepsLink
          ? 'It keeps its link, which then shows the new results.'
          : 'Your saved report then opens the new results.'
      }`}
      nothingLeft={provisionsWithout(report.provisions, missingParameters).length === 0}
      transferring={reportTransfer.isPending}
      error={reportTransfer.error?.message ?? null}
      onTransfer={() => reportTransfer.mutate(transfer, { onSuccess: () => onTransferred?.() })}
    />
  );
}
