import { IconHome } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import type { SavedHousehold } from '@/api/savedHouseholdStore';
import {
  savedHouseholdDescription,
  savedHouseholdName,
  savedHouseholdsNotice,
} from '@/components/flagship/household/savedHouseholdDisplay';
import { colors, spacing, typography } from '@/designTokens';
import { useSavedHouseholds } from '@/hooks/useSavedHouseholds';
import type { RootState } from '@/store';

/**
 * The session's saved households in a country, to open one: each by its
 * label, with who it describes. One that cannot open (saved before
 * households moved to the Public API's v2 routes, or failing to load) is
 * listed but cannot be chosen.
 */
export default function SavedHouseholdPicker({
  countryId,
  selectedId,
  onSelect,
  disabled = false,
}: {
  countryId: string;
  /** The saved household the builder holds, marked as chosen. */
  selectedId?: string;
  onSelect: (saved: SavedHousehold) => void;
  /** No saved household can be chosen, as while the builder's household is calculating. */
  disabled?: boolean;
}) {
  const variables = useSelector((state: RootState) => state.metadata?.variables);
  const { available, savedHouseholds, isLoading, error } = useSavedHouseholds();
  const households = savedHouseholds.filter((saved) => saved.countryId === countryId);
  const notice = savedHouseholdsNotice({
    available,
    isLoading,
    error,
    count: households.length,
  });
  if (notice) {
    return notice;
  }

  return (
    <ul
      aria-label="Saved households"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {households.map((saved) => {
        const selected = saved.id === selectedId;
        return (
          <li key={saved.id}>
            <button
              type="button"
              disabled={disabled || saved.unavailable}
              aria-pressed={selected}
              onClick={() => {
                if (!disabled && !saved.unavailable) {
                  onSelect(saved);
                }
              }}
              className="tw:w-full tw:cursor-pointer tw:rounded-md tw:border tw:text-left tw:transition-colors tw:hover:border-primary-500 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                background: selected ? colors.primary[50] : colors.background.primary,
                borderColor: selected ? colors.primary[500] : colors.border.light,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              <IconHome size={16} aria-hidden style={{ color: colors.text.tertiary }} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}
                >
                  {savedHouseholdName(saved)}
                </span>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  {savedHouseholdDescription(saved, variables)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
