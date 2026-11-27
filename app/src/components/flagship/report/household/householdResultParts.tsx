import type { CSSProperties } from 'react';
import { colors, spacing, typography } from '@/designTokens';

/**
 * What v3's household results share: the household's change in net
 * income with a reform (HouseholdImpactResult) and its net income under
 * one policy (HouseholdNetIncomeResult). Their money formatting is in
 * householdMoney.ts.
 */

/** The bordered card each household result sits in. */
export const householdResultCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  padding: spacing.lg,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
  background: colors.background.primary,
};

/** The headline's caption, e.g. "Annual net income". */
export const householdHeadlineLabelStyle: CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

/** The headline's amount, in large figures that line up. */
export const householdHeadlineFigureStyle: CSSProperties = {
  fontSize: typography.fontSize['4xl'],
  lineHeight: 1.1,
  fontWeight: typography.fontWeight.semibold,
  fontVariantNumeric: 'tabular-nums',
};

/** A tab per household output, under the result's headline. */
export function HouseholdOutputTabs<View extends string>({
  options,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<{ value: View; label: string }>;
  selected: View;
  onSelect: (view: View) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Household outputs"
      style={{
        display: 'flex',
        gap: spacing.lg,
        overflowX: 'auto',
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(option.value)}
            // The text color comes from classes, so the hover color can apply.
            className={`tw:cursor-pointer ${
              isSelected ? 'tw:text-text-primary' : 'tw:text-text-secondary tw:hover:text-gray-900'
            }`}
            style={{
              border: 'none',
              background: 'none',
              padding: `${spacing.sm} 0`,
              marginBottom: -1,
              borderBottom: `2px solid ${isSelected ? colors.primary[600] : 'transparent'}`,
              whiteSpace: 'nowrap',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
              fontWeight: isSelected
                ? typography.fontWeight.semibold
                : typography.fontWeight.normal,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
