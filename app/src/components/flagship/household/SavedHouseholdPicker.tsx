import { IconHome } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import type { ListedSavedHousehold, SavedHousehold } from '@/api/savedHouseholdStore';
import { Spinner, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useSavedHouseholds } from '@/hooks/useSavedHouseholds';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import type { RootState } from '@/store';

/** A saved household's name, or what it is when saved without one. */
export function savedHouseholdName(saved: Pick<ListedSavedHousehold, 'label'>): string {
  return saved.label || 'Untitled household';
}

/**
 * The session's saved households to choose one from: each by its label,
 * with who it describes. One that cannot open (saved before households
 * moved to v2, or failing to load) is listed but cannot be chosen.
 */
export default function SavedHouseholdPicker({
  countryId,
  year,
  selectedId,
  onSelect,
}: {
  countryId: string;
  /** The year the households are described in. */
  year: string;
  selectedId?: string;
  onSelect: (saved: SavedHousehold) => void;
}) {
  const variables = useSelector((state: RootState) => state.metadata?.variables);
  const { available, savedHouseholds, isLoading, error } = useSavedHouseholds();
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
  const households = savedHouseholds.filter((saved) => saved.countryId === countryId);
  if (households.length === 0) {
    return <Text style={quiet}>No saved households yet.</Text>;
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
              disabled={saved.unavailable}
              aria-pressed={selected}
              onClick={() => !saved.unavailable && onSelect(saved)}
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
                  {saved.unavailable
                    ? 'Cannot be opened here'
                    : describeHousehold(saved.household, year, countryId, variables)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
