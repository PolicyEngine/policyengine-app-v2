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

interface DeleteUserAccountDialogProps {
  open: boolean;
  /** Who is deleted: the user's email (or ID, without one), and their name when they have one. */
  userDescription: string;
  deleting: boolean;
  /** Why the last deletion failed: the API's message. */
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * Places focus when the dialog closes. It opens from state, with no
   * trigger, so without this focus falls to the page body.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * Asks an admin to confirm the deletion of a user's account. It names the
 * user and says what goes with the account. While the deletion is under
 * way it can be neither closed nor confirmed again.
 */
export default function DeleteUserAccountDialog({
  open,
  userDescription,
  deleting,
  errorMessage,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: DeleteUserAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !deleting && onCancel()}>
      <DialogContent showCloseButton={!deleting} onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Delete this user&apos;s account?</DialogTitle>
          <DialogDescription>
            This deletes the account of {userDescription}, their saved items and their sign-in
            account. They cannot be restored.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
            {errorMessage}
          </Text>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Spinner size="sm" />}
            Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
