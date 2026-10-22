import { useId, useState } from 'react';
import HouseholdBreakdowns, {
  HOUSEHOLD_BREAKDOWN_VIEWS,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import {
  householdMoney,
  HouseholdOutputTabs,
  householdResultCardStyle,
} from '@/components/flagship/report/household/householdResultParts';
import SPMMethodologyFootnote from '@/components/household/SPMMethodologyFootnote';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';
import type { HouseholdCalculationProvenance } from '@/libs/flagship/householdRun';

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
  /** The household's country: its currency. */
  countryId: CountryId;
  /**
   * How the calculation was made: a US calculation's SPM settings and
   * receipt show as a methodology footnote under the net income tree.
   */
  methodology?: HouseholdCalculationProvenance;
}) {
  const [view, setView] = useState<HouseholdBreakdownView>('net-income');
  const id = useId();

  return (
    <section aria-labelledby={`${id}-heading`} style={householdResultCardStyle}>
      <Stack style={{ gap: spacing.xs }}>
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
          borderRadius: spacing.radius.feature,
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
          {householdMoney(netIncome, countryId)}
        </span>
      </div>

      <HouseholdOutputTabs options={HOUSEHOLD_BREAKDOWN_VIEWS} selected={view} onSelect={setView} />

      <div style={{ minWidth: 0 }}>
        <HouseholdBreakdowns view={view} source={breakdowns} />
      </div>

      {/* The variation views show their own calculation's methodology. */}
      {methodology && view === 'net-income' && <SPMMethodologyFootnote output={[methodology]} />}
    </section>
  );
}
