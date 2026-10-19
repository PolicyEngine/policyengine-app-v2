import { useId, useState } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { SavedHouseholdRepointError, type SavedHousehold } from '@/api/savedHouseholdStore';
import { Button, Input, Label, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  useRenameSavedHousehold,
  useReplaceSavedHousehold,
  useSavedHouseholdStore,
  useSaveHousehold,
} from '@/hooks/useSavedHouseholds';
import type { Household } from '@/models/Household';

/** Whether two households have the same content, whatever their ids and labels. */
function sameContent(first: Household, second: Household): boolean {
  return (
    JSON.stringify(first.toV1CreationPayload().data) ===
      JSON.stringify(second.toV1CreationPayload().data) &&
    JSON.stringify(first.spm ?? null) === JSON.stringify(second.spm ?? null)
  );
}

const SAVED_HOUSEHOLDS_UNAVAILABLE = 'Saved households are not available here.';

/**
 * A label field and a Save button for the household in the builder. A new
 * household is saved under the label. A saved household's edit is saved
 * as a new household, with the saved household pointed at it (households
 * never change once stored); a new label alone only renames it.
 */
export default function SaveHouseholdForm({
  household,
  saved,
  onSaved,
}: {
  /** The household as the builder holds it. */
  household: Household;
  /** The saved household the builder is editing; a new one is saved without it. */
  saved?: SavedHousehold | null;
  /** The saved household after the save: an edit's id differs from the one edited. */
  onSaved?: (saved: SavedHousehold) => void;
}) {
  const labelId = useId();
  const { store } = useSavedHouseholdStore();
  const saveHousehold = useSaveHousehold();
  const replaceHousehold = useReplaceSavedHousehold();
  const renameHousehold = useRenameSavedHousehold();
  const [label, setLabel] = useState(saved?.label ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!store) {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        {SAVED_HOUSEHOLDS_UNAVAILABLE}
      </Text>
    );
  }

  const contentChanged = !saved || !sameContent(household, saved.household);
  const labelChanged = !saved || label.trim() !== (saved.label ?? '');
  const nothingToSave = !!saved && !contentChanged && !labelChanged;

  const save = async () => {
    setStatus('saving');
    setErrorMessage(null);
    try {
      let result: SavedHousehold;
      if (!saved) {
        result = await saveHousehold.mutateAsync({ household, label });
      } else {
        result = saved;
        if (contentChanged) {
          try {
            result = await replaceHousehold.mutateAsync({ saved, household });
          } catch (error) {
            // The edit was saved; only the earlier version stayed. Say so, and go on.
            if (!(error instanceof SavedHouseholdRepointError)) {
              throw error;
            }
            setErrorMessage(error.message);
            result = error.replacement;
          }
        }
        if (labelChanged) {
          const renamed = await renameHousehold.mutateAsync({
            savedHouseholdId: result.id,
            label,
          });
          result = { ...result, label: renamed.label, updatedAt: renamed.updatedAt };
        }
      }
      setStatus('saved');
      onSaved?.(result);
    } catch (error) {
      setStatus('idle');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Stack style={{ gap: spacing.sm }}>
      <Label htmlFor={labelId}>Household label</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
        <Input
          id={labelId}
          value={label}
          placeholder="For example, our family"
          maxLength={255}
          onChange={(event) => {
            setLabel(event.target.value);
            setStatus('idle');
          }}
          style={{ maxWidth: 320 }}
        />
        <Button size="sm" onClick={save} disabled={status === 'saving' || nothingToSave}>
          <IconDeviceFloppy size={16} aria-hidden />
          {saved ? 'Save changes' : 'Save household'}
        </Button>
        {status === 'saved' && (
          <span
            role="status"
            style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
          >
            Saved
          </span>
        )}
      </div>
      {errorMessage && (
        <Text
          role="alert"
          style={{
            margin: 0,
            fontSize: typography.fontSize.xs,
            color: colors.error,
            overflowWrap: 'anywhere',
          }}
        >
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
}
