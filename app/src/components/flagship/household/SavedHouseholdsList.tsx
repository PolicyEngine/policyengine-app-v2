import { useState } from 'react';
import { IconPencil } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import type { ListedSavedHousehold } from '@/api/savedHouseholdStore';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import DeleteConfirmationDialog from '@/components/flagship/DeleteConfirmationDialog';
import {
  savedHouseholdDescription,
  savedHouseholdName,
  savedHouseholdsNotice,
} from '@/components/flagship/household/savedHouseholdDisplay';
import { Button, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  useDeleteSavedHousehold,
  useRenameSavedHousehold,
  useSavedHouseholds,
} from '@/hooks/useSavedHouseholds';
import type { RootState } from '@/store';

/**
 * The session's saved households, each with who it describes, to rename
 * or delete. A saved household that cannot open is listed, and can still
 * be renamed or deleted. A failed rename keeps its dialog open with the
 * reason; a failed delete names the household and the reason above the list.
 */
export default function SavedHouseholdsList() {
  const variables = useSelector((state: RootState) => state.metadata?.variables);
  const { available, savedHouseholds, isLoading, error } = useSavedHouseholds();
  const renameHousehold = useRenameSavedHousehold();
  const deleteHousehold = useDeleteSavedHousehold();
  const [renaming, setRenaming] = useState<ListedSavedHousehold | null>(null);
  const [deleting, setDeleting] = useState<ListedSavedHousehold | null>(null);

  const notice = savedHouseholdsNotice({
    available,
    isLoading,
    error,
    count: savedHouseholds.length,
  });
  if (notice) {
    return notice;
  }

  const openRename = (saved: ListedSavedHousehold) => {
    // An earlier rename's failure belongs to the household it was tried on.
    renameHousehold.reset();
    setRenaming(saved);
  };

  const remove = (saved: ListedSavedHousehold) => {
    setDeleting(saved);
    deleteHousehold.mutate(saved.id);
  };

  return (
    <>
      {deleteHousehold.isError && deleting && (
        <Text
          role="alert"
          style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
        >
          “{savedHouseholdName(deleting)}” could not be deleted. {deleteHousehold.error.message}
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
                  {savedHouseholdDescription(saved, variables)}
                </span>
              </span>
              <span style={{ display: 'flex', gap: spacing.xs }}>
                <Button size="sm" variant="ghost" onClick={() => openRename(saved)}>
                  <IconPencil size={14} aria-hidden />
                  Rename
                </Button>
                <DeleteConfirmationDialog
                  compact
                  name={name}
                  // Only the saved row goes: the stored household stays, as
                  // reports and other users may use it.
                  description="This removes it from your households for good. Reports already run with it are not changed."
                  confirmLabel="Delete household"
                  disabled={deleteHousehold.isPending}
                  onConfirm={() => remove(saved)}
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
            // The dialog shows the reason and stays open.
          }
        }}
      />
    </>
  );
}
