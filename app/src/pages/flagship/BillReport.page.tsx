import { useState } from 'react';
import {
  IconArrowLeft,
  IconCalendar,
  IconChartBar,
  IconExternalLink,
  IconUser,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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
import { TrackedBill, WinnerShares } from '@/api/billFeed';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import {
  BillValidationSection,
  ModelTrackRecordSection,
  useModelTrackRecord,
  ValidationChip,
} from '@/components/flagship/ValidationPanel';
import MetricCard from '@/components/report/MetricCard';
import {
  Button,
  SegmentedControl,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Title,
} from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import { RootState } from '@/store';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { getCurrentValue } from '@/utils/parameterValues';

interface BillReportPageProps {
  /** Passed by the Next.js route bridge; react-router falls back to params. */
  billId?: string;
}

function moneyPlain(value: number): string {
  return `${value < 0 ? '\u2212' : ''}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

function money(value: number): string {
  const { display, label } = formatBudgetaryImpact(value);
  return `${value < 0 ? '−' : ''}$${display}${label ? ` ${label}` : ''}`;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** baseline → reform rates as a compact percent range, when both exist. */
function rateDetail(rates?: { baselineRate?: number; reformRate?: number }): string | undefined {
  return typeof rates?.baselineRate === 'number' && typeof rates?.reformRate === 'number'
    ? `${(rates.baselineRate * 100).toFixed(1)}% → ${(rates.reformRate * 100).toFixed(1)}%`
    : undefined;
}

function percentChangeValue(percentChange: number): string {
  return `${percentChange > 0 ? '+' : '−'}${Math.abs(percentChange).toFixed(1)}%`;
}

const WINNER_SEGMENTS = [
  { key: 'gainMore', label: 'Gain more than 5%', color: colors.primary[600] },
  { key: 'gainLess', label: 'Gain less than 5%', color: colors.primary[300] },
  { key: 'noChange', label: 'No change', color: colors.gray[300] },
  { key: 'loseLess', label: 'Lose less than 5%', color: colors.gray[400] },
  { key: 'loseMore', label: 'Lose more than 5%', color: colors.gray[600] },
] as const;

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

/** The bordered card every report metric and visual sits in — the
 *  flagship echo of the report redesign's dashboard cards. */
function ReportCard({
  title,
  children,
  grow,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <Stack
      style={{
        gap: spacing.sm,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        ...(grow ? { flex: '1 1 220px', minWidth: 200 } : {}),
      }}
    >
      {title}
      {children}
    </Stack>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
      }}
    >
      {children}
    </Text>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
      {children}
    </Text>
  );
}

/**
 * A bill's impact report from the tracker's precomputed results —
 * opens instantly, no simulation run. The full nationwide dashboard
 * stays one click away via the standard run pipeline. Mirrors the
 * report-output redesign: teal title, metric cards, pill tabs, and
 * segmented chart controls.
 */
export default function BillReportPage({ billId: propId }: BillReportPageProps) {
  const params = useParams<{ billId: string }>();
  const billId = propId ?? params.billId ?? '';
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const runReport = useRunFlagshipReport();
  const { bills, isLoading } = useTrackedBills(countryId);
  const [tab, setTab] = useState('overview');
  const [decileMode, setDecileMode] = useState('average');

  const bill: TrackedBill | undefined = bills.find((candidate) => candidate.id === billId);

  // Kick off the scorecard fetch with the rest of the report, not on
  // tab click — inactive tab panels are unmounted.
  const trackRecord = useModelTrackRecord(bill ? bill.provisions.map((p) => p.path) : []);

  const resolveBreadcrumb = (path: string, fallback?: string) =>
    parameters?.[path]
      ? formatLabelParts(getHierarchicalLabels(path, parameters))
      : (fallback ?? path);

  if (!bill) {
    return (
      <Stack style={{ maxWidth: 760, margin: '0 auto', gap: spacing.lg }}>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {isLoading ? 'Loading the analysis…' : 'This bill is not in the current feed.'}
        </Text>
      </Stack>
    );
  }

  const provisions = bill.provisions.map((provision) => {
    const metadata = parameters?.[provision.path];
    return {
      path: provision.path,
      breadcrumb: resolveBreadcrumb(provision.path, provision.fallbackBreadcrumb),
      unit: metadata?.unit ?? null,
      baselineValue: getCurrentValue(metadata?.values),
      value: provision.value,
    };
  });

  const impact = bill.impactData;

  const households = impact?.budgetary?.households;
  const revenueForAverage = impact?.budgetary?.stateRevenueImpact;
  const perHousehold =
    typeof revenueForAverage === 'number' && households
      ? revenueForAverage / households
      : undefined;

  // PolicyEngine vs external estimates, when the validation pass found any.
  // Bars plot magnitudes (these are almost always all-negative revenue
  // effects, which read backwards on a signed axis); labels keep the sign.
  const estimateComparisonRaw = [
    ...(typeof (bill.validation?.peEstimate ?? revenueForAverage) === 'number'
      ? [{ label: 'PolicyEngine', value: bill.validation?.peEstimate ?? revenueForAverage! }]
      : []),
    ...(typeof bill.validation?.fiscalNoteEstimate === 'number'
      ? [{ label: 'Official fiscal note', value: bill.validation.fiscalNoteEstimate }]
      : typeof bill.validation?.targetRangeLow === 'number' &&
          typeof bill.validation?.targetRangeHigh === 'number'
        ? [
            { label: 'Fiscal note (low)', value: bill.validation.targetRangeLow },
            { label: 'Fiscal note (high)', value: bill.validation.targetRangeHigh },
          ]
        : []),
    ...(bill.validation?.externalAnalyses ?? [])
      .filter((analysis) => analysis.source && typeof analysis.estimate === 'number')
      .map((analysis) => ({ label: analysis.source!, value: analysis.estimate! })),
  ];
  const estimateSign = estimateComparisonRaw.every((entry) => entry.value <= 0) ? -1 : 1;
  const estimateComparison = estimateComparisonRaw.map((entry) => ({
    ...entry,
    magnitude: Math.abs(entry.value),
  }));

  const povertyChartRows = [
    ...(typeof impact?.poverty?.baselineRate === 'number' &&
    typeof impact?.poverty?.reformRate === 'number'
      ? [
          {
            group: 'All people',
            baseline: impact.poverty.baselineRate * 100,
            reform: impact.poverty.reformRate * 100,
          },
        ]
      : []),
    ...(typeof impact?.childPoverty?.baselineRate === 'number' &&
    typeof impact?.childPoverty?.reformRate === 'number'
      ? [
          {
            group: 'Children',
            baseline: impact.childPoverty.baselineRate * 100,
            reform: impact.childPoverty.reformRate * 100,
          },
        ]
      : []),
  ];

  const winners = impact?.winnersLosers;
  const betterOff = winners && ((winners.gainMore5Pct ?? 0) + (winners.gainLess5Pct ?? 0)) * 100;
  const worseOff = winners && ((winners.loseMore5Pct ?? 0) + (winners.loseLess5Pct ?? 0)) * 100;
  const revenue = impact?.budgetary?.stateRevenueImpact;

  const decileRowsFor = (record?: Record<string, number>, scale = 1) =>
    record
      ? Object.entries(record)
          .map(([decile, value]) => ({ decile, value: Number(value) * scale }))
          .sort((a, b) => Number(a.decile) - Number(b.decile))
      : [];
  const decileAverage = decileRowsFor(impact?.decile?.average);
  const decileRelative = decileRowsFor(impact?.decile?.relative, 100);
  const decileRows = decileMode === 'average' ? decileAverage : decileRelative;

  const winnersRows = winners?.byDecile
    ? [
        winnerRow('All', winners),
        ...Object.entries(winners.byDecile)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([decile, shares]) => winnerRow(decile, shares)),
      ]
    : [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(typeof revenue === 'number' || typeof impact?.budgetary?.netCost === 'number'
      ? [{ id: 'budgetary', label: 'Budgetary impact' }]
      : []),
    ...(typeof impact?.poverty?.percentChange === 'number' ||
    typeof impact?.childPoverty?.percentChange === 'number'
      ? [{ id: 'poverty', label: 'Poverty impact' }]
      : []),
    ...(decileAverage.length > 0 || decileRelative.length > 0
      ? [{ id: 'distribution', label: 'Distribution' }]
      : []),
    ...(winnersRows.length > 0 || (typeof betterOff === 'number' && betterOff > 0)
      ? [{ id: 'winners', label: 'Winners and losers' }]
      : []),
    ...(bill.validation || trackRecord.programs.length > 0
      ? [{ id: 'validation', label: 'Validation' }]
      : []),
    ...(bill.provenance ? [{ id: 'notes', label: 'Notes and sources' }] : []),
  ];

  const billTextUrl = bill.sourceUrl ?? bill.legiscanUrl;

  const povertyCard = (rates: NonNullable<typeof impact>['poverty'], label: string) =>
    typeof rates?.percentChange === 'number' &&
    rates.percentChange !== 0 && (
      <ReportCard grow>
        <MetricCard
          label={label}
          value={percentChangeValue(rates.percentChange)}
          subtext={rateDetail(rates)}
          trend={rates.percentChange < 0 ? 'positive' : 'negative'}
          invertArrow
        />
      </ReportCard>
    );

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>
          <Stack style={{ maxWidth: 1040, margin: '0 auto', gap: spacing.xl }}>
            <button
              type="button"
              onClick={() => nav.push(`/${countryId}/reforms`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.xs,
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.secondary,
                alignSelf: 'flex-start',
              }}
            >
              <IconArrowLeft size={14} />
              {bill.title}
            </button>

            <Stack style={{ gap: spacing.xs }}>
              <Text
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                {bill.jurisdiction} · {bill.status}
              </Text>
              <Title
                order={1}
                style={{
                  margin: 0,
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize['3xl'],
                  color: colors.primary[700],
                }}
              >
                {bill.title}
              </Title>
              {bill.validation && <ValidationChip validation={bill.validation} />}
            </Stack>

            <Tabs value={tab} onValueChange={setTab} style={{ gap: spacing.lg }}>
              <TabsList
                variant="line"
                className="tw:max-w-full tw:justify-start tw:gap-4 tw:overflow-x-auto tw:border-b tw:border-border"
              >
                {tabs.map((option) => (
                  <TabsTrigger
                    key={option.id}
                    value={option.id}
                    className="tw:px-0 tw:after:bottom-[-1px] tw:after:bg-primary"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview">
                <Stack style={{ gap: spacing.md }}>
                  {bill.summary && (
                    <Text
                      style={{
                        fontSize: typography.fontSize.base,
                        color: colors.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {bill.summary}
                    </Text>
                  )}
                  <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                    {typeof revenue === 'number' && (
                      <ReportCard grow>
                        <div style={{ margin: 'auto 0' }}>
                          <MetricCard
                            label="Revenue change"
                            value={money(revenue)}
                            trend={revenue < 0 ? 'negative' : 'positive'}
                            hero
                          />
                        </div>
                      </ReportCard>
                    )}
                    <Stack style={{ flex: '1 1 320px', gap: spacing.md }}>
                      <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                        {povertyCard(impact?.poverty, 'Poverty rate change')}
                        {povertyCard(impact?.childPoverty, 'Child poverty change')}
                      </Stack>
                      {typeof betterOff === 'number' && betterOff > 0 && (
                        <ReportCard>
                          <MetricCard
                            label="Households better off"
                            value={`${betterOff.toFixed(0)}%`}
                            trend="positive"
                          />
                        </ReportCard>
                      )}
                    </Stack>
                  </Stack>
                  {(bill.author || bill.date || billTextUrl) && (
                    <Stack
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flexWrap: 'wrap',
                      }}
                    >
                      {bill.author && (
                        <Stack
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                        >
                          <IconUser size={13} color={colors.text.secondary} />
                          <Caption>Sponsored by {bill.author}</Caption>
                        </Stack>
                      )}
                      {bill.date && (
                        <Stack
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                        >
                          <IconCalendar size={13} color={colors.text.secondary} />
                          <Caption>Analyzed {formatDate(bill.date)}</Caption>
                        </Stack>
                      )}
                      {billTextUrl && (
                        <a
                          href={billTextUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: colors.text.secondary,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: typography.fontSize.xs,
                            fontFamily: typography.fontFamily.primary,
                          }}
                        >
                          Bill text
                          <IconExternalLink size={11} />
                        </a>
                      )}
                    </Stack>
                  )}
                  {provisions.length > 0 && (
                    <Stack style={{ gap: spacing.sm }}>
                      <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.xl }}>
                        What it changes
                      </Title>
                      <ProvisionList provisions={provisions} />
                    </Stack>
                  )}
                </Stack>
              </TabsContent>

              <TabsContent value="budgetary">
                <Stack style={{ gap: spacing.lg }}>
                  <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                    {typeof revenue === 'number' && (
                      <ReportCard grow>
                        <MetricCard
                          label="Revenue change"
                          value={money(revenue)}
                          trend={revenue < 0 ? 'negative' : 'positive'}
                          hero
                        />
                      </ReportCard>
                    )}
                    {typeof perHousehold === 'number' && (
                      <ReportCard grow>
                        <MetricCard
                          label="Average per household"
                          value={moneyPlain(perHousehold)}
                          trend={perHousehold < 0 ? 'negative' : 'positive'}
                        />
                      </ReportCard>
                    )}
                    {typeof impact?.budgetary?.netCost === 'number' &&
                      impact.budgetary.netCost !== revenue && (
                        <ReportCard grow>
                          <MetricCard
                            label="Net cost"
                            value={money(impact.budgetary.netCost)}
                            trend={impact.budgetary.netCost < 0 ? 'negative' : 'positive'}
                          />
                        </ReportCard>
                      )}
                  </Stack>
                  {estimateComparison.length > 1 && (
                    <ReportCard title={<ChartTitle>How the estimate compares</ChartTitle>}>
                      <div style={{ width: '100%', height: 60 + estimateComparison.length * 52 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={estimateComparison}
                            layout="vertical"
                            margin={{ top: 8, right: 48, bottom: 8, left: 8 }}
                          >
                            <XAxis
                              type="number"
                              tickFormatter={(value: number) => money(estimateSign * value)}
                              tickLine={false}
                              axisLine={{ stroke: colors.border.light }}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                            />
                            <YAxis
                              type="category"
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                              width={150}
                            />
                            <Tooltip
                              formatter={(value) => [money(Number(value ?? 0)), 'Estimate']}
                              cursor={{ fill: colors.gray[50] }}
                            />
                            <Bar dataKey="magnitude" radius={[0, 3, 3, 0]} barSize={22}>
                              <LabelList
                                dataKey="value"
                                position="right"
                                formatter={(value) => money(Number(value ?? 0))}
                                style={{ fontSize: 12, fill: colors.text.primary }}
                              />
                              {estimateComparison.map((entry) => (
                                <Cell
                                  key={entry.label}
                                  fill={
                                    entry.label === 'PolicyEngine'
                                      ? colors.primary[500]
                                      : colors.gray[400]
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <Caption>
                        External estimates from the tracker&apos;s validation pass — see the
                        Validation tab for scope notes.
                      </Caption>
                    </ReportCard>
                  )}
                  <Caption>
                    Single-year budgetary impact from the tracker's stored microsimulation run.
                  </Caption>
                </Stack>
              </TabsContent>

              <TabsContent value="poverty">
                <Stack style={{ gap: spacing.lg }}>
                  <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                    {povertyCard(impact?.poverty, 'Poverty rate change')}
                    {povertyCard(impact?.childPoverty, 'Child poverty change')}
                  </Stack>
                  {povertyChartRows.length > 0 && (
                    <ReportCard title={<ChartTitle>Poverty rate, before and after</ChartTitle>}>
                      <Stack
                        style={{ flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' }}
                        aria-hidden
                      >
                        {[
                          { label: 'Current law', color: colors.gray[400] },
                          { label: 'With this bill', color: colors.primary[500] },
                        ].map((entry) => (
                          <Stack
                            key={entry.label}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                background: entry.color,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: typography.fontSize.xs,
                                color: colors.text.secondary,
                              }}
                            >
                              {entry.label}
                            </Text>
                          </Stack>
                        ))}
                      </Stack>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={povertyChartRows}
                            margin={{ top: 24, right: 8, bottom: 8, left: 8 }}
                            barGap={6}
                          >
                            <XAxis
                              dataKey="group"
                              tickLine={false}
                              axisLine={{ stroke: colors.border.light }}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                            />
                            <YAxis
                              tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                              width={44}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                `${Number(value ?? 0).toFixed(1)}%`,
                                name === 'baseline' ? 'Current law' : 'With this bill',
                              ]}
                              cursor={{ fill: colors.gray[50] }}
                            />
                            <Bar dataKey="baseline" fill={colors.gray[400]} radius={[3, 3, 0, 0]}>
                              <LabelList
                                dataKey="baseline"
                                position="top"
                                formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                                style={{ fontSize: 12, fill: colors.text.secondary }}
                              />
                            </Bar>
                            <Bar dataKey="reform" fill={colors.primary[500]} radius={[3, 3, 0, 0]}>
                              <LabelList
                                dataKey="reform"
                                position="top"
                                formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                                style={{ fontSize: 12, fill: colors.text.primary }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <Caption>
                        Share of people below the Supplemental Poverty Measure line, from the
                        tracker&apos;s stored run.
                      </Caption>
                    </ReportCard>
                  )}
                </Stack>
              </TabsContent>

              <TabsContent value="distribution">
                <ReportCard
                  title={
                    <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <div style={{ flex: 1 }}>
                        <ChartTitle>
                          {decileMode === 'average'
                            ? 'Average household income change by decile'
                            : 'Relative household income change by decile'}
                        </ChartTitle>
                      </div>
                      <SegmentedControl
                        size="xs"
                        value={decileMode}
                        onValueChange={setDecileMode}
                        options={[
                          { label: 'Dollars', value: 'average' },
                          { label: 'Percent', value: 'relative' },
                        ]}
                      />
                    </Stack>
                  }
                >
                  <div style={{ width: '100%', height: 360 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={decileRows}
                        margin={{ top: 24, right: 8, bottom: 8, left: 8 }}
                      >
                        <XAxis
                          dataKey="decile"
                          tickLine={false}
                          axisLine={{ stroke: colors.border.light }}
                          tick={{ fontSize: 12, fill: colors.text.secondary }}
                        />
                        <YAxis
                          tickFormatter={(value: number) =>
                            decileMode === 'average'
                              ? `$${value.toLocaleString()}`
                              : `${value.toFixed(1)}%`
                          }
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: colors.text.secondary }}
                          width={70}
                        />
                        <Tooltip
                          formatter={(value) => [
                            decileMode === 'average'
                              ? `$${Number(value ?? 0).toLocaleString()}`
                              : `${Number(value ?? 0).toFixed(2)}%`,
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
                                ? `$${Math.round(Number(value ?? 0)).toLocaleString()}`
                                : `${Number(value ?? 0).toFixed(1)}%`
                            }
                            style={{ fontSize: 11, fill: colors.text.secondary }}
                          />
                          {decileRows.map((row) => (
                            <Cell
                              key={row.decile}
                              fill={row.value >= 0 ? colors.primary[500] : colors.gray[600]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Caption>
                    Income deciles rank households from lowest (1) to highest (10) income.
                  </Caption>
                </ReportCard>
              </TabsContent>

              <TabsContent value="winners">
                <Stack style={{ gap: spacing.md }}>
                  <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                    {typeof betterOff === 'number' && betterOff > 0 && (
                      <ReportCard grow>
                        <MetricCard
                          label="Households better off"
                          value={`${betterOff.toFixed(0)}%`}
                          trend="positive"
                        />
                      </ReportCard>
                    )}
                    {typeof worseOff === 'number' && worseOff > 0 && (
                      <ReportCard grow>
                        <MetricCard
                          label="Households worse off"
                          value={`${worseOff.toFixed(0)}%`}
                          trend="negative"
                        />
                      </ReportCard>
                    )}
                    {typeof winners?.noChange === 'number' && (
                      <ReportCard grow>
                        <MetricCard
                          label="No change"
                          value={`${(winners.noChange * 100).toFixed(0)}%`}
                        />
                      </ReportCard>
                    )}
                  </Stack>
                  {winnersRows.length > 0 && (
                    <ReportCard title={<ChartTitle>Outcomes by income decile</ChartTitle>}>
                      <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                        {WINNER_SEGMENTS.map((segment) => (
                          <Text
                            key={segment.key}
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
                                background: segment.color,
                                display: 'inline-block',
                              }}
                            />
                            {segment.label}
                          </Text>
                        ))}
                      </Stack>
                      <div style={{ width: '100%', height: 340 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={winnersRows}
                            layout="vertical"
                            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                          >
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(value: number) => `${value}%`}
                              tickLine={false}
                              axisLine={{ stroke: colors.border.light }}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                            />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={36}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 12, fill: colors.text.secondary }}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                `${Number(value ?? 0).toFixed(1)}%`,
                                String(name),
                              ]}
                              labelFormatter={(label) =>
                                label === 'All' ? 'All households' : `Decile ${label}`
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
                      </div>
                    </ReportCard>
                  )}
                </Stack>
              </TabsContent>

              <TabsContent value="validation">
                <Stack style={{ gap: spacing.md }}>
                  {bill.validation && (
                    <BillValidationSection billId={bill.id} validation={bill.validation} />
                  )}
                  <ModelTrackRecordSection trackRecord={trackRecord} />
                </Stack>
              </TabsContent>

              <TabsContent value="notes">
                <Stack style={{ gap: spacing.md }}>
                  {bill.provenance && (
                    <Caption>
                      {[
                        bill.provenance.modelVersion &&
                          `Model version: policyengine-us ${bill.provenance.modelVersion}`,
                        bill.provenance.dataset &&
                          `Data version: ${bill.provenance.dataset}${
                            bill.provenance.datasetVersion
                              ? ` ${bill.provenance.datasetVersion}`
                              : ''
                          }`,
                        bill.provenance.computedAt &&
                          `Computed ${formatDate(bill.provenance.computedAt)}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </Caption>
                  )}
                </Stack>
              </TabsContent>
            </Tabs>

            <Stack
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Caption>
                Precomputed by the PolicyEngine legislative tracker. District and household views
                arrive with the full nationwide run.
              </Caption>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  runReport.run(bill.title, `${bill.jurisdiction} · ${bill.status}`, provisions)
                }
                disabled={runReport.isRunning || provisions.length === 0}
              >
                <IconChartBar size={14} />
                {runReport.isRunning ? 'Starting…' : 'Run the full report'}
              </Button>
              {runReport.error && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                  {runReport.error}
                </Text>
              )}
            </Stack>
          </Stack>
        </div>
        <ReportAdjustPanel
          title={bill.title}
          sourceNote={`${bill.jurisdiction} · ${bill.status}`}
          provisions={provisions}
        />
      </div>
    </div>
  );
}
