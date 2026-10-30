import type { CSSProperties, ReactElement } from 'react';
import type { ListedSavedHousehold } from '@/api/savedHouseholdStore';
import { Spinner, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import type { VariableInfo } from '@/utils/VariableResolver';

/**
 * What v3's saved-household controls (the save form, the picker and the
 * list) share: how a saved household is named and described, and what
 * they say before there is a saved household to show.
 */

/** Without accounts there are no saved households; each control says so instead. */
export const SAVED_HOUSEHOLDS_UNAVAILABLE = 'Saved households are not available here.';

const quietText: CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/** A saved household's name, or what it is when saved without one. */
export function savedHouseholdName(saved: Pick<ListedSavedHousehold, 'label'>): string {
  return saved.label || 'Untitled household';
}

/**
 * Who a saved household describes ("Married · 2 children · California"),
 * in the year its inputs are in; for one that cannot open, that it cannot.
 */
export function savedHouseholdDescription(
  saved: ListedSavedHousehold,
  variables?: Record<string, VariableInfo>
): string {
  if (saved.unavailable) {
    return 'Cannot be opened here';
  }
  const { household } = saved;
  return household.year === null
    ? 'No year set'
    : describeHousehold(household, String(household.year), saved.countryId, variables);
}

/**
 * What a list of saved households shows instead of its households: that
 * there are none here (no accounts), that they are loading, why they
 * could not load, or that none are saved. Null once there are some to show.
 */
export function savedHouseholdsNotice({
  available,
  isLoading,
  error,
  count,
}: {
  available: boolean;
  isLoading: boolean;
  error: Error | null;
  /** How many saved households there are to show. */
  count: number;
}): ReactElement | null {
  if (!available) {
    return <Text style={quietText}>{SAVED_HOUSEHOLDS_UNAVAILABLE}</Text>;
  }
  if (isLoading) {
    return (
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <Spinner size="sm" />
        <Text style={quietText}>Loading your households...</Text>
      </div>
    );
  }
  if (error) {
    return (
      <Text role="alert" style={{ ...quietText, color: colors.error }}>
        Your households could not be loaded. {error.message}
      </Text>
    );
  }
  if (count === 0) {
    return <Text style={quietText}>No saved households yet.</Text>;
  }
  return null;
}
