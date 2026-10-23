import { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrackedBill, WinnerShares } from '@/api/billFeed';
import ReportChartCard from '@/components/flagship/report/ReportChartCard';
import type { ReportMetric } from '@/components/flagship/ReportContents';
import { SegmentedControl, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { storedRevenueMetric } from '@/libs/flagship/billMetrics';
import { currencySymbol } from '@/utils/formatters';

const WINNER_SEGMENTS = [
  { key: 'gainMore', label: 'Gain more than 5%', color: colors.primary[600] },
  { key: 'gainLess', label: 'Gain less than 5%', color: colors.primary[300] },
  { key: 'noChange', label: 'No change', color: colors.gray[300] },
  { key: 'loseLess', label: 'Lose less than 5%', color: colors.gray[400] },
  { key: 'loseMore', label: 'Lose more than 5%', color: colors.gray[600] },
] as const;

const AXIS_TICK = { fontSize: 12, fill: colors.text.secondary };

function winnerRow(label: string, shares: WinnerShares) {
  return {
    label,
    gainMore: (shares.gainMore5Pct ?? 0) * 100,
    gainLess: (shares.gainLess5Pct ?? 0) * 100,
    noChange: (shares.noChange ?? 0) * 100,
    loseLess: (shares.loseLess5Pct ?? 0) * 100,
    loseMore: (shares.loseMore5Pct ?? 0) * 100,
  };
}

function decileRows(record?: Record<string, number>, scale = 1) {
  return record
    ? Object.entries(record)
        .map(([decile, value]) => ({ decile, value: Number(value) * scale }))
        .sort((a, b) => Number(a.decile) - Number(b.decile))
    : [];
}

function Legend({ items }: { items: ReadonlyArray<{ label: string; color: string }> }) {
  return (
    <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }} aria-hidden>
      {items.map((item) => (
        <Text
          key={item.label}
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: item.color,
              display: 'inline-block',
            }}
          />
          {item.label}
        </Text>
      ))}
    </Stack>
  );
}

type PovertyRates = NonNullable<NonNullable<TrackedBill['impactData']>['poverty']>;

/** A poverty rate's relative change in percent: stored, or from the rates. */
function povertyPercentChange(rates: PovertyRates | undefined): number | null {
  if (typeof rates?.percentChange === 'number') {
    return rates.percentChange;
  }
  if (
    typeof rates?.baselineRate === 'number' &&
    typeof rates?.reformRate === 'number' &&
    rates.baselineRate > 0
  ) {
    return ((rates.reformRate - rates.baselineRate) / rates.baselineRate) * 100;
  }
  return null;
}

/** "−$24" (or "−£24"), not "$-24". */
const money = (value: number, symbol: string) =>
  `${value < 0 ? '−' : ''}${symbol}${Math.round(Math.abs(value)).toLocaleString()}`;

const signedPercent = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}%`;

type StoredBill = Pick<TrackedBill, 'state' | 'impacts' | 'impactData'>;

/**
 * The tracker's annual revenue change, in the overview's own words and
 * sign: a number, not a chart, across the grid's full width.
 */
function StoredBudget({ revenue }: { revenue: ReportMetric | null }) {
  if (!revenue) {
    return null;
  }
  return (
    <section
      aria-label="Budgetary impact"
      className="tw:p-md tw:border tw:border-border-light tw:rounded-container tw:bg-white"
      style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: spacing.sm }}
    >
      <Text size="lg" fw={typography.fontWeight.medium} style={{ margin: 0 }}>
        Budgetary impact
      </Text>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm }}>
        <span
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.semibold,
            fontVariantNumeric: 'tabular-nums',
            color: colors.text.primary,
          }}
        >
          {revenue.value}
        </span>
        <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {revenue.label}
        </span>
      </div>
    </section>
  );
}

/**
 * The legislative tracker's stored budgetary, distributional and poverty results for
 * a bill, in the same chart cards as a report's economic impacts. Shown
 * while the full results calculate, or instead of them when they cannot.
 */
export default function StoredImpactCharts({
  bill,
  countryId = 'us',
}: {
  bill: StoredBill;
  countryId?: Parameters<typeof storedRevenueMetric>[1];
}) {
  const [decileMode, setDecileMode] = useState<'average' | 'relative'>('average');
  const dollars = (value: number) => money(value, currencySymbol(countryId));
  const impact = bill.impactData;
  // Worded as the overview words it, so the two read the same.
  const revenue = storedRevenueMetric(bill, countryId);

  const average = decileRows(impact?.decile?.average);
  const relative = decileRows(impact?.decile?.relative, 100);
  const deciles = decileMode === 'average' ? average : relative;
  // Relative changes can be tiny (a few hundredths of a percent): enough
  // decimals that the bars don't all read "0.0%", and a true minus sign.
  const largestRelative = Math.max(0, ...relative.map((row) => Math.abs(row.value)));
  const relativeDigits = largestRelative >= 1 ? 1 : largestRelative >= 0.1 ? 2 : 3;
  const percent = (value: number) =>
    `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(relativeDigits)}%`;

  const winners = impact?.winnersLosers;
  // "All" on top and set apart by an empty row; then decile 10 down to 1,
  // so the income ladder reads upward.
  const winnersRows = winners?.byDecile
    ? [
        winnerRow('All', winners),
        { label: '' },
        ...Object.entries(winners.byDecile)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([decile, shares]) => winnerRow(decile, shares)),
      ]
    : [];

  // The change only, not the rates before and after.
  const povertyRows = [
    { group: 'All people', rates: impact?.poverty },
    { group: 'Children', rates: impact?.childPoverty },
  ].flatMap(({ group, rates }) => {
    const change = povertyPercentChange(rates);
    return change === null ? [] : [{ group, change }];
  });

  if (
    !revenue &&
    average.length + relative.length + winnersRows.length + povertyRows.length === 0
  ) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(370px, calc((100% - ${spacing.lg}) / 2))), 1fr))`,
        gap: spacing.lg,
      }}
    >
      {/* The budget leads, as it does in the full results. */}
      <StoredBudget revenue={revenue} />

      {(average.length > 0 || relative.length > 0) && (
        <ReportChartCard
          title="Income change by decile"
          controls={
            <SegmentedControl
              animated
              size="xs"
              value={decileMode}
              onValueChange={(value) => setDecileMode(value as 'average' | 'relative')}
              options={[
                { label: 'Absolute', value: 'average' },
                { label: 'Relative', value: 'relative' },
              ]}
            />
          }
        >
          <div key={decileMode} className="tw:h-full tw:motion-safe:fade-in-soft">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deciles} margin={{ top: 20, right: 8, bottom: 4, left: 8 }}>
                <XAxis
                  dataKey="decile"
                  tickLine={false}
                  axisLine={{ stroke: colors.border.light }}
                  tick={AXIS_TICK}
                />
                <YAxis
                  tickFormatter={(value: number) =>
                    decileMode === 'average' ? dollars(value) : percent(value)
                  }
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  width={64}
                />
                <Tooltip
                  formatter={(value) => [
                    decileMode === 'average'
                      ? dollars(Number(value ?? 0))
                      : percent(Number(value ?? 0)),
                    decileMode === 'average' ? 'Average change' : 'Relative change',
                  ]}
                  labelFormatter={(label) => `Decile ${label}`}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value) =>
                      decileMode === 'average'
                        ? dollars(Number(value ?? 0))
                        : percent(Number(value ?? 0))
                    }
                    style={{ fontSize: 11, fill: colors.text.secondary }}
                  />
                  {deciles.map((row) => (
                    <Cell
                      key={row.decile}
                      fill={row.value >= 0 ? colors.primary[500] : colors.gray[600]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      )}

      {winnersRows.length > 0 && (
        <ReportChartCard
          title="Winners and losers"
          focusedChartHeight={340}
          controls={<Legend items={WINNER_SEGMENTS} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={winnersRows}
              layout="vertical"
              margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                // Whole steps: computed ticks read "100.00000000000001%".
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tickLine={false}
                axisLine={{ stroke: colors.border.light }}
                tick={AXIS_TICK}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={36}
                // Every row named: skipping alternate labels set them off their bars.
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
              />
              <Tooltip
                formatter={(value, name) => [`${Number(value ?? 0).toFixed(1)}%`, String(name)]}
                // The shares count people, so the All row is everyone.
                labelFormatter={(label) =>
                  label === 'All' ? 'All people' : label ? `Decile ${label}` : ''
                }
              />
              {WINNER_SEGMENTS.map((segment) => (
                <Bar
                  key={segment.key}
                  dataKey={segment.key}
                  stackId="outcome"
                  name={segment.label}
                  fill={segment.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      )}

      {povertyRows.length > 0 && (
        <ReportChartCard title="Poverty rate change">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={povertyRows} margin={{ top: 20, right: 8, bottom: 4, left: 8 }}>
              <XAxis
                dataKey="group"
                tickLine={false}
                axisLine={{ stroke: colors.border.light }}
                tick={AXIS_TICK}
              />
              <YAxis
                tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                width={52}
              />
              <Tooltip
                formatter={(value) => [signedPercent(Number(value ?? 0)), 'Relative change']}
                cursor={{ fill: colors.gray[50] }}
              />
              <Bar dataKey="change" radius={[3, 3, 0, 0]}>
                <LabelList
                  dataKey="change"
                  position="top"
                  formatter={(value) => signedPercent(Number(value ?? 0))}
                  style={{ fontSize: 12, fill: colors.text.secondary }}
                />
                {povertyRows.map((row) => (
                  <Cell
                    key={row.group}
                    // Less poverty is the gain, as more income is in the decile chart.
                    fill={row.change <= 0 ? colors.primary[500] : colors.gray[600]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      )}
    </div>
  );
}
