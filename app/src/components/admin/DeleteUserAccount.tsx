import { useRef, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import type { AdminUserItem } from '@/api/v2AdminUsers';
import { AppLink } from '@/components/AppLink';
import { Button, Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { isDeletedWithAuth0UsersLeft, useDeleteAdminUser } from '@/hooks/useDeleteAdminUser';
import { adminUserLabel, adminUserName } from './adminUserFormat';
import DeleteUserAccountDialog from './DeleteUserAccountDialog';

/** An account the admin deleted, named as the details showed it before the deletion. */
export interface DeletedAccount {
  /** The user's email, or ID when they had none. */
  userLabel: string;
  email: string | null;
  /**
   * The API's message when the account's data was deleted but some of the
   * user's Auth0 users were not, or null when everything was deleted.
   */
  auth0UsersLeftMessage: string | null;
}

interface DeleteUserAccountProps {
  user: AdminUserItem;
  /** Whether the user is the signed-in admin, who deletes their own account on the account page. */
  isOwnAccount: boolean;
  /** Called once the user's account is gone. */
  onDeleted: (deletedAccount: DeletedAccount) => void;
}

/** The user's email (or ID) and, when they have one, their name. */
function userDescription(user: AdminUserItem): string {
  const name = adminUserName(user);
  return name ? `${adminUserLabel(user)} (${name})` : adminUserLabel(user);
}

/**
 * Deletes a user's account, their saved items and their sign-in account,
 * after a confirmation. An admin's own account is deleted on the account
 * page instead (`DELETE /v2/me`), so for it this links there.
 */
export default function DeleteUserAccount({
  user,
  isOwnAccount,
  onDeleted,
}: DeleteUserAccountProps) {
  const countryId = useCurrentCountry();
  const deleteUser = useDeleteAdminUser();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const label = (
    <Text size="sm" style={{ margin: 0 }}>
      Account deletion
    </Text>
  );

  if (isOwnAccount) {
    return (
      <Stack gap="xs" align="start">
        {label}
        <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
          This is your own account. To delete it, use your{' '}
          <AppLink to={`/${countryId}/account`}>account page</AppLink>.
        </Text>
      </Stack>
    );
  }

  const openConfirmation = () => {
    deleteUser.reset();
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
    deleteUser.reset();
  };

  const confirmDeletion = () => {
    const deletedAccount = { userLabel: adminUserLabel(user), email: user.email };
    deleteUser.mutate(
      { userId: user.id },
      {
        onSuccess: () => onDeleted({ ...deletedAccount, auth0UsersLeftMessage: null }),
        onError: (error) => {
          if (isDeletedWithAuth0UsersLeft(error)) {
            onDeleted({ ...deletedAccount, auth0UsersLeftMessage: error.message });
          }
        },
      }
    );
  };

  return (
    <Stack gap="sm" align="start">
      {label}
      <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
        Deletes this user&apos;s account, their saved items and their sign-in account.
      </Text>
      <Button ref={deleteButtonRef} variant="destructive" onClick={openConfirmation}>
        <IconTrash size={16} />
        Delete account
      </Button>
      <DeleteUserAccountDialog
        open={confirmationOpen}
        userDescription={userDescription(user)}
        deleting={deleteUser.isPending}
        errorMessage={deleteUser.error?.message ?? null}
        onConfirm={confirmDeletion}
        onCancel={closeConfirmation}
        onCloseAutoFocus={(event) => {
          // The dialog has no trigger to hand focus back to. Once the account
          // is deleted this button is gone, and the details place focus.
          event.preventDefault();
          if (deleteButtonRef.current?.isConnected) {
            deleteButtonRef.current.focus();
          }
        }}
      />
    </Stack>
  );
}
