import type { ReactNode } from 'react';
import { MissingParameterList } from '@/components/flagship/MissingParametersNotice';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Text,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';

interface MissingParametersTransferDialogProps {
  open: boolean;
  /** Closing it is "Not now": the item stays as it is, and cannot run. */
  onOpenChange: (open: boolean) => void;
  /** What uses the parameters: one of the user's saved reforms or saved reports. */
  subject: 'reform' | 'report';
  /** The parameter paths the model no longer has, as the API reports them. */
  parameterPaths: string[];
  /** The transfer's button: "Transfer to a new policy", "Transfer and run again". */
  transferLabel: string;
  /** What the transfer keeps and does, after the list. */
  transferNote: ReactNode;
  /** Without the parameters the item would change nothing: there is nothing to transfer. */
  nothingLeft?: boolean;
  /** A transfer is under way: neither action can be clicked. */
  transferring?: boolean;
  /** Why the last transfer failed; the item is as it was. */
  error?: string | null;
  onTransfer: () => void;
}

/**
 * Offers to move one of the user's saved reforms or reports onto a new
 * policy without the parameters the model no longer has, as the old app's
 * "Transfer parameters" did. "Not now" leaves it as it is, unable to run.
 */
export default function MissingParametersTransferDialog({
  open,
  onOpenChange,
  subject,
  parameterPaths,
  transferLabel,
  transferNote,
  nothingLeft = false,
  transferring = false,
  error,
  onTransfer,
}: MissingParametersTransferDialogProps) {
  const them = parameterPaths.length === 1 ? 'this parameter' : 'these parameters';
  return (
    <Dialog open={open} onOpenChange={(next) => !transferring && onOpenChange(next)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>This {subject} uses parameters the model no longer has</DialogTitle>
          <DialogDescription>
            PolicyEngine’s model no longer has {them}, so this {subject} cannot be run:
          </DialogDescription>
        </DialogHeader>
        <MissingParameterList parameterPaths={parameterPaths} />
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {nothingLeft
            ? `Without ${them}, this ${subject} changes nothing, so there is nothing to transfer.`
            : transferNote}
        </Text>
        {error && (
          <Text
            role="alert"
            style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
          >
            {error}
          </Text>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={transferring} onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button disabled={nothingLeft || transferring} onClick={onTransfer}>
            {transferring ? 'Transferring…' : transferLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
