import { useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { AlertDialog } from 'radix-ui';
import { useSelector } from 'react-redux';
import type { ListedSavedHousehold } from '@/api/savedHouseholdStore';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import { savedHouseholdName } from '@/components/flagship/household/SavedHouseholdPicker';
import { Button, Spinner, Text } from '@/components/ui';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import {
  useDeleteSavedHousehold,
  useRenameSavedHousehold,
  useSavedHouseholds,
} from '@/hooks/useSavedHouseholds';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import type { RootState } from '@/store';

/** Delete asks first: a deleted saved household cannot be brought back. */
function DeleteSavedHouseholdDialog({
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
            This removes it from your households. Reports already run with it are not changed.
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

/**
 * The session's saved households, each with who it describes, to rename
 * or delete. A saved household that cannot open is listed, and can still
 * be renamed or deleted.
 */
export default function SavedHouseholdsList() {
  const variables = useSelector((state: RootState) => state.metadata?.variables);
  const { available, savedHouseholds, isLoading, error } = useSavedHouseholds();
  const renameHousehold = useRenameSavedHousehold();
  const deleteHousehold = useDeleteSavedHousehold();
  const [renaming, setRenaming] = useState<ListedSavedHousehold | null>(null);
  const quiet = { margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary };

  if (!available) {
    return <Text style={quiet}>Saved households are not available here.</Text>;
  }
  if (isLoading) {
    return (
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <Spinner size="sm" />
        <Text style={quiet}>Loading your households...</Text>
      </div>
    );
  }
  if (error) {
    return (
      <Text role="alert" style={{ ...quiet, color: colors.error }}>
        Your households could not be loaded. {error.message}
      </Text>
    );
  }
  if (savedHouseholds.length === 0) {
    return <Text style={quiet}>No saved households yet.</Text>;
  }

  const actionError = renameHousehold.error ?? deleteHousehold.error;

  return (
    <>
      {actionError && (
        <Text role="alert" style={{ ...quiet, color: colors.error }}>
          {actionError.message}
        </Text>
      )}
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {savedHouseholds.map((saved) => {
          const name = savedHouseholdName(saved);
          return (
            <li
              key={saved.id}
              aria-label={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: spacing.md,
                padding: `${spacing.md} ${spacing.lg}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: spacing.radius.container,
                background: colors.background.primary,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {name}
                </span>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  {saved.unavailable
                    ? 'Cannot be opened here'
                    : describeHousehold(
                        saved.household,
                        String(saved.household.year ?? CURRENT_YEAR),
                        saved.countryId,
                        variables
                      )}
                </span>
              </span>
              <span style={{ display: 'flex', gap: spacing.xs }}>
                <Button size="sm" variant="ghost" onClick={() => setRenaming(saved)}>
                  <IconPencil size={14} aria-hidden />
                  Rename
                </Button>
                <DeleteSavedHouseholdDialog
                  name={name}
                  disabled={deleteHousehold.isPending}
                  onConfirm={() => deleteHousehold.mutate(saved.id)}
                />
              </span>
            </li>
          );
        })}
      </ul>
      <RenameIngredientModal
        opened={!!renaming}
        onClose={() => setRenaming(null)}
        currentLabel={renaming?.label ?? ''}
        ingredientType="household"
        isLoading={renameHousehold.isPending}
        submissionError={renameHousehold.error?.message ?? null}
        onRename={async (label) => {
          if (!renaming) {
            return;
          }
          try {
            await renameHousehold.mutateAsync({ savedHouseholdId: renaming.id, label });
            setRenaming(null);
          } catch {
            // The modal shows the error and stays open.
          }
        }}
      />
    </>
  );
}
