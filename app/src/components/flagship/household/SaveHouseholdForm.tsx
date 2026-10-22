import { useId, useState } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';
import type { SavedHousehold } from '@/api/savedHouseholdStore';
import { SAVED_HOUSEHOLDS_UNAVAILABLE } from '@/components/flagship/household/savedHouseholdDisplay';
import { Button, Input, Label, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  useSavedHouseholdStore,
  useSaveHousehold,
  useSaveHouseholdChanges,
} from '@/hooks/useSavedHouseholds';
import type { Household } from '@/models/Household';
import { haveSameStoredContent } from '@/models/household/v2DocumentCodec';

/**
 * A label field and a Save button for the household in the builder. A new
 * household is saved under the label. A saved household's changes are
 * saved to it, keeping its id: an edit is stored as a new household
 * (stored households never change) and the saved household pointed at
 * it; a new label alone only renames it.
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
  /** The saved household after the save. */
  onSaved?: (saved: SavedHousehold) => void;
}) {
  const labelId = useId();
  const { store } = useSavedHouseholdStore();
  const saveHousehold = useSaveHousehold();
  const saveChanges = useSaveHouseholdChanges();
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

  const contentChanged = !saved || !haveSameStoredContent(household, saved.household);
  const labelChanged = !saved || label.trim() !== (saved.label ?? '');
  const nothingToSave = !!saved && !contentChanged && !labelChanged;

  const save = async () => {
    setStatus('saving');
    setErrorMessage(null);
    try {
      const result = saved
        ? await saveChanges.mutateAsync({
            saved,
            changes: {
              ...(contentChanged ? { household } : {}),
              ...(labelChanged ? { label } : {}),
            },
          })
        : await saveHousehold.mutateAsync({ household, label });
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
