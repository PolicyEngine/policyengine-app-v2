import type { SignedInUserType } from '@/api/v2AdminUsers';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  Text,
} from '@/components/ui';
import { colors } from '@/designTokens';

interface ChangeUserTypeDialogProps {
  open: boolean;
  /** The user's email, or its ID when it has none. */
  userLabel: string;
  currentType: SignedInUserType;
  newType: SignedInUserType;
  changing: boolean;
  /** Why the last attempt failed: the API's message. */
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks an admin to confirm a type change; nothing is sent until they confirm. */
export default function ChangeUserTypeDialog({
  open,
  userLabel,
  currentType,
  newType,
  changing,
  errorMessage,
  onConfirm,
  onCancel,
}: ChangeUserTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !changing && onCancel()}>
      <DialogContent showCloseButton={!changing}>
        <DialogHeader>
          <DialogTitle>Change this user&apos;s type?</DialogTitle>
          <DialogDescription>
            {`${userLabel} will change from ${currentType} to ${newType}.`}
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
            {errorMessage}
          </Text>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={changing}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={changing}>
            {changing && <Spinner size="sm" />}
            Confirm change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
