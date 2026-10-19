import { useId, useState } from 'react';
import HouseholdBreakdowns, {
  HOUSEHOLD_BREAKDOWN_VIEWS,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import SPMMethodologyFootnote from '@/components/household/SPMMethodologyFootnote';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';
import type { HouseholdCalculationProvenance } from '@/libs/flagship/householdRun';
import { formatCurrency } from '@/utils/formatters';

/** Whole dollars (or pounds), with a true minus sign. */
function money(value: number, countryId: CountryId): string {
  const rounded = Math.round(value);
  const text = formatCurrency(Math.abs(rounded), countryId, { maximumFractionDigits: 0 });
  return rounded < 0 ? `−${text}` : text;
}

/**
 * A household's result under one policy, with no reform to compare: its
 * annual net income, then the v2 breakdowns of it (the net income tree,
 * varying earnings, marginal tax rates), each under that policy alone.
 */
export default function HouseholdNetIncomeResult({
  netIncome,
  summary,
  breakdowns,
  countryId,
  methodology,
}: {
  /** The household's annual net income under the policy. */
  netIncome: number;
  /** Who the result is for, e.g. "Married · 2 children · California · 2026". */
  summary: string;
  /** The run the breakdowns read; its baseline and reform policies are the same one. */
  breakdowns: HouseholdBreakdownSource;
  countryId: CountryId;
  /** The calculation's SPM settings and receipt, shown as a footnote under the net income tree. */
  methodology?: HouseholdCalculationProvenance;
}) {
  const [view, setView] = useState<HouseholdBreakdownView>('net-income');
  const id = useId();

  return (
    <section
      aria-labelledby={`${id}-heading`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ gap: 2 }}>
        <Title id={`${id}-heading`} order={3} style={{ margin: 0 }}>
          Household net income
        </Title>
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {summary}
        </Text>
      </Stack>

      <div
        role="group"
        aria-labelledby={`${id}-net`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          padding: spacing.lg,
          borderRadius: 10,
          background: colors.gray[50],
        }}
      >
        <span
          id={`${id}-net`}
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
          }}
        >
          Annual net income
        </span>
        <span
          style={{
            fontSize: typography.fontSize['4xl'],
            lineHeight: 1.1,
            fontWeight: typography.fontWeight.semibold,
            fontVariantNumeric: 'tabular-nums',
            color: colors.text.primary,
          }}
        >
          {money(netIncome, countryId)}
        </span>
      </div>

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
        {HOUSEHOLD_BREAKDOWN_VIEWS.map((option) => {
          const selected = view === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setView(option.value)}
              className="tw:cursor-pointer tw:hover:text-gray-900"
              style={{
                border: 'none',
                background: 'none',
                padding: `${spacing.sm} 0`,
                marginBottom: -1,
                borderBottom: `2px solid ${selected ? colors.primary[600] : 'transparent'}`,
                whiteSpace: 'nowrap',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                fontWeight: selected
                  ? typography.fontWeight.semibold
                  : typography.fontWeight.normal,
                color: selected ? colors.text.primary : colors.text.secondary,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={{ minWidth: 0 }}>
        <HouseholdBreakdowns view={view} source={breakdowns} />
      </div>

      {/* The variation views show their own calculation's methodology. */}
      {methodology && view === 'net-income' && <SPMMethodologyFootnote output={[methodology]} />}
    </section>
  );
}
