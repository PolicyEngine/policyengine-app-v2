import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { copyHouseholdToYear } from '@/pages/reportBuilder/utils/changeReportYear';

/**
 * A saved household as the builder holds it in `year`: a report moves a
 * household it opens into its own year, and that move alone is not an
 * edit. A household that cannot move is compared as it is.
 */
function inYear(household: Household, year: number | null): Household {
  if (year === null || household.year === year) {
    return household;
  }
  try {
    return copyHouseholdToYear(household, String(year));
  } catch {
    return household;
  }
}

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
  /**
   * The saved household after the save. Not called for a save that
   * finishes after the form has gone, as when the page opens another
   * saved household (which gives the form a new key) while it runs.
   */
  onSaved?: (saved: SavedHousehold) => void;
}) {
  const labelId = useId();
  const { store } = useSavedHouseholdStore();
  const saveHousehold = useSaveHousehold();
  const saveChanges = useSaveHouseholdChanges();
  const [label, setLabel] = useState(saved?.label ?? '');
  const [saving, setSaving] = useState(false);
  // What the last save stored: "Saved" shows only while the household and
  // label on screen are still what it stored.
  const [lastSaved, setLastSaved] = useState<{ household: Household; label: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savedInBuilderYear = useMemo(
    () => (saved ? inYear(saved.household, household.year) : null),
    [saved, household.year]
  );
  const shown = useRef(true);
  useEffect(() => {
    shown.current = true;
    return () => {
      shown.current = false;
    };
  }, []);

  if (!store) {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        {SAVED_HOUSEHOLDS_UNAVAILABLE}
      </Text>
    );
  }

  const contentChanged =
    !savedInBuilderYear || !haveSameStoredContent(household, savedInBuilderYear);
  const labelChanged = !saved || label.trim() !== (saved.label ?? '');
  const nothingToSave = !!saved && !contentChanged && !labelChanged;
  const showsSaved =
    !!lastSaved &&
    lastSaved.label === label.trim() &&
    haveSameStoredContent(household, lastSaved.household);

  const save = async () => {
    setSaving(true);
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
      if (!shown.current) {
        return;
      }
      setLastSaved({ household, label: label.trim() });
      onSaved?.(result);
    } catch (error) {
      setLastSaved(null);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
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
          onChange={(event) => setLabel(event.target.value)}
          className="tw:max-w-xs"
        />
        <Button size="sm" onClick={save} disabled={saving || nothingToSave}>
          <IconDeviceFloppy size={16} aria-hidden />
          {saved ? 'Save changes' : 'Save household'}
        </Button>
        {showsSaved && (
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
