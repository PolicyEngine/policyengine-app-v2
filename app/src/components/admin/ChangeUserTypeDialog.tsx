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
  Stack,
  Text,
} from '@/components/ui';
import { colors } from '@/designTokens';
import { USER_TYPE_LABELS } from './adminUserFormat';

/**
 * What the confirmation knows when it opens: the chosen type, and the
 * user's type as the API answered a read made then (null until it answers).
 */
export interface UserTypeConfirmation {
  newType: SignedInUserType;
  currentType: SignedInUserType | null;
  /** Why that read failed. */
  readErrorMessage: string | null;
}

/**
 * What the dialog says about the last change: why it failed (`alert`), or
 * an outcome that needs nothing more (`status`, such as "nothing will
 * change").
 */
export interface ChangeOutcomeMessage {
  text: string;
  role: 'alert' | 'status';
}

interface ChangeUserTypeDialogProps {
  open: boolean;
  /** The user's email, or its ID when it has none. */
  userLabel: string;
  confirmation: UserTypeConfirmation;
  /** Whether the user is the signed-in admin. */
  isOwnAccount: boolean;
  changing: boolean;
  /**
   * About the last change: the API's message, or after a changed-type
   * refusal the app's own sentence.
   */
  outcomeMessage: ChangeOutcomeMessage | null;
  onConfirm: () => void;
  onCancel: () => void;
  onReadAgain: () => void;
  /**
   * Places focus when the dialog closes. It opens from state, with no
   * trigger, so without this focus falls to the page body.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

function confirmationText(userLabel: string, confirmation: UserTypeConfirmation): string {
  const newLabel = USER_TYPE_LABELS[confirmation.newType];
  if (confirmation.readErrorMessage) {
    return `The current type of ${userLabel} is not known.`;
  }
  if (confirmation.currentType === null) {
    return `Checking the current type of ${userLabel}…`;
  }
  if (confirmation.currentType === confirmation.newType) {
    return `${userLabel} is already ${newLabel}. Nothing will change.`;
  }
  return `${userLabel} will change from ${USER_TYPE_LABELS[confirmation.currentType]} to ${newLabel}.`;
}

/**
 * Asks an admin to confirm a type change. It names the type the API gave
 * when the dialog opened, not the one cached earlier, and can be confirmed
 * only once that read has answered with another type than the chosen one.
 */
export default function ChangeUserTypeDialog({
  open,
  userLabel,
  confirmation,
  isOwnAccount,
  changing,
  outcomeMessage,
  onConfirm,
  onCancel,
  onReadAgain,
  onCloseAutoFocus,
}: ChangeUserTypeDialogProps) {
  const { currentType, newType, readErrorMessage } = confirmation;
  const unchanged = currentType !== null && currentType === newType;
  const losesAdmin = isOwnAccount && currentType === 'admin' && newType !== 'admin';
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !changing && onCancel()}>
      <DialogContent showCloseButton={!changing} onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Change this user&apos;s type?</DialogTitle>
          <DialogDescription>{confirmationText(userLabel, confirmation)}</DialogDescription>
        </DialogHeader>
        {currentType === null && !readErrorMessage && (
          <Stack role="status" aria-live="polite" align="start">
            <Spinner size="sm" />
          </Stack>
        )}
        {readErrorMessage && (
          <Stack gap="sm" align="start">
            <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
              We could not check this user&apos;s current type: {readErrorMessage}
            </Text>
            <Button variant="outline" size="sm" onClick={onReadAgain}>
              Try again
            </Button>
          </Stack>
        )}
        {losesAdmin && (
          <Text size="sm" style={{ margin: 0, color: colors.text.warning }}>
            This is your own account: you will no longer be an admin, and you will lose this page.
          </Text>
        )}
        {outcomeMessage && (
          <Text
            role={outcomeMessage.role}
            size="sm"
            style={{
              margin: 0,
              color: outcomeMessage.role === 'alert' ? colors.error : colors.text.secondary,
            }}
          >
            {outcomeMessage.text}
          </Text>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={changing}>
            {unchanged ? 'Close' : 'Cancel'}
          </Button>
          {!unchanged && (
            <Button onClick={onConfirm} disabled={changing || currentType === null}>
              {changing && <Spinner size="sm" />}
              Confirm change
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
