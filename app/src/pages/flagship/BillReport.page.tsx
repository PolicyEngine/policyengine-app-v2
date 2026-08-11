import { useState } from 'react';
import { IconArrowLeft, IconChartBar, IconExternalLink } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrackedBill, WinnerShares } from '@/api/billFeed';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import StatTile from '@/components/flagship/StatTile';
import { Button, Stack, Text, Title } from '@/components/ui';
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

/** The bordered card every report visual sits in. */
function ChartCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack
      style={{
        gap: spacing.sm,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      {title}
      {children}
    </Stack>
  );
}

/**
 * A bill's impact report from the tracker's precomputed results —
 * opens instantly, no simulation run. The full nationwide dashboard
 * stays one click away via the standard run pipeline.
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
  const [decileMode, setDecileMode] = useState<'average' | 'relative'>('average');

  const bill: TrackedBill | undefined = bills.find((candidate) => candidate.id === billId);

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
  const winners = impact?.winnersLosers;
  const betterOff = winners && ((winners.gainMore5Pct ?? 0) + (winners.gainLess5Pct ?? 0)) * 100;
  const worseOff = winners && ((winners.loseMore5Pct ?? 0) + (winners.loseLess5Pct ?? 0)) * 100;

  const decileRowsFor = (record?: Record<string, number>, scale = 1) =>
    record
      ? Object.entries(record)
          .map(([decile, value]) => ({ decile, value: Number(value) * scale }))
          .sort((a, b) => Number(a.decile) - Number(b.decile))
      : [];
  const decileAverage = decileRowsFor(impact?.decile?.average);
  const decileRelative = decileRowsFor(impact?.decile?.relative, 100);

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
    ...(decileAverage.length > 0 || decileRelative.length > 0
      ? [{ id: 'distribution', label: 'Distribution' }]
      : []),
    ...(winnersRows.length > 0 || (typeof betterOff === 'number' && betterOff > 0)
      ? [{ id: 'winners', label: 'Winners and losers' }]
      : []),
    ...((bill.keyFindings && bill.keyFindings.length > 0) || bill.provenance
      ? [{ id: 'notes', label: 'Notes and sources' }]
      : []),
  ];

  const billTextUrl = bill.sourceUrl ?? bill.legiscanUrl;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <Stack style={{ maxWidth: 900, margin: '0 auto', gap: spacing.xl }}>
            <button
              type="button"
              onClick={() => nav.push(`/${countryId}/reforms?bill=${bill.id}`)}
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
              <Title order={1} style={{ margin: 0 }}>
                {bill.title}
              </Title>
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
              {(bill.author || bill.date || billTextUrl) && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  {bill.author && <>Sponsored by {bill.author}</>}
                  {bill.author && bill.date && ' · '}
                  {bill.date && <>Analyzed {formatDate(bill.date)}</>}
                  {(bill.author || bill.date) && billTextUrl && ' · '}
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
                      }}
                    >
                      Bill text
                      <IconExternalLink size={11} />
                    </a>
                  )}
                </Text>
              )}
            </Stack>

            <Stack style={{ flexDirection: 'row', gap: spacing.md }}>
              {tabs.map((option) => {
                const active = tab === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTab(option.id)}
                    aria-pressed={active}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: `0 0 ${spacing.xs}`,
                      cursor: 'pointer',
                      fontSize: typography.fontSize.base,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: active
                        ? typography.fontWeight.semibold
                        : typography.fontWeight.normal,
                      color: active ? colors.text.primary : colors.text.secondary,
                      borderBottom: `2px solid ${active ? colors.primary[500] : 'transparent'}`,
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </Stack>

            {tab === 'overview' && (
              <Stack style={{ gap: spacing.md }}>
                <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                  {typeof impact?.budgetary?.stateRevenueImpact === 'number' && (
                    <StatTile
                      value={money(impact.budgetary.stateRevenueImpact)}
                      label="revenue change"
                    />
                  )}
                  {typeof impact?.poverty?.percentChange === 'number' &&
                    impact.poverty.percentChange !== 0 && (
                      <StatTile
                        value={percentChangeValue(impact.poverty.percentChange)}
                        label="poverty rate change"
                        detail={rateDetail(impact.poverty)}
                      />
                    )}
                  {typeof impact?.childPoverty?.percentChange === 'number' &&
                    impact.childPoverty.percentChange !== 0 && (
                      <StatTile
                        value={percentChangeValue(impact.childPoverty.percentChange)}
                        label="child poverty change"
                        detail={rateDetail(impact.childPoverty)}
                      />
                    )}
                  {typeof betterOff === 'number' && betterOff > 0 && (
                    <StatTile value={`${betterOff.toFixed(0)}%`} label="households better off" />
                  )}
                  {typeof worseOff === 'number' && worseOff > 0 && (
                    <StatTile value={`${worseOff.toFixed(0)}%`} label="households worse off" />
                  )}
                </Stack>
                {provisions.length > 0 && (
                  <Stack style={{ gap: spacing.sm }}>
                    <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.xl }}>
                      What it changes
                    </Title>
                    <ProvisionList provisions={provisions} />
                  </Stack>
                )}
              </Stack>
            )}

            {tab === 'distribution' && (
              <ChartCard
                title={
                  <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Text
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        flex: 1,
                      }}
                    >
                      {decileMode === 'average'
                        ? 'Average household income change by decile'
                        : 'Relative household income change by decile'}
                    </Text>
                    {(
                      [
                        { id: 'average', label: 'Dollars' },
                        { id: 'relative', label: 'Percent' },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDecileMode(mode.id)}
                        aria-pressed={decileMode === mode.id}
                        style={{
                          border: `1px solid ${colors.border.light}`,
                          borderRadius: 8,
                          padding: `2px ${spacing.sm}`,
                          fontSize: typography.fontSize.xs,
                          fontFamily: typography.fontFamily.primary,
                          cursor: 'pointer',
                          background:
                            decileMode === mode.id ? colors.primary[50] : colors.background.primary,
                          color:
                            decileMode === mode.id ? colors.primary[700] : colors.text.secondary,
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </Stack>
                }
              >
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={decileMode === 'average' ? decileAverage : decileRelative}
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
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
                        {(decileMode === 'average' ? decileAverage : decileRelative).map((row) => (
                          <Cell
                            key={row.decile}
                            fill={row.value >= 0 ? colors.primary[500] : colors.gray[600]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Income deciles rank households from lowest (1) to highest (10) income.
                </Text>
              </ChartCard>
            )}

            {tab === 'winners' && (
              <Stack style={{ gap: spacing.md }}>
                <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                  {typeof betterOff === 'number' && betterOff > 0 && (
                    <StatTile value={`${betterOff.toFixed(0)}%`} label="households better off" />
                  )}
                  {typeof worseOff === 'number' && worseOff > 0 && (
                    <StatTile value={`${worseOff.toFixed(0)}%`} label="households worse off" />
                  )}
                  {typeof winners?.noChange === 'number' && (
                    <StatTile value={`${(winners.noChange * 100).toFixed(0)}%`} label="no change" />
                  )}
                </Stack>
                {winnersRows.length > 0 && (
                  <ChartCard
                    title={
                      <Text
                        style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        Outcomes by income decile
                      </Text>
                    }
                  >
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
                  </ChartCard>
                )}
              </Stack>
            )}

            {tab === 'notes' && (
              <Stack style={{ gap: spacing.md }}>
                {bill.keyFindings && bill.keyFindings.length > 0 && (
                  <Stack style={{ gap: spacing.xs }}>
                    {bill.keyFindings.map((finding) => (
                      <Text
                        key={finding}
                        style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.primary,
                          lineHeight: 1.6,
                        }}
                      >
                        · {finding}
                      </Text>
                    ))}
                  </Stack>
                )}
                {bill.provenance && (
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    {[
                      bill.provenance.modelVersion &&
                        `policyengine-us ${bill.provenance.modelVersion}`,
                      bill.provenance.dataset &&
                        `${bill.provenance.dataset}${
                          bill.provenance.datasetVersion ? ` ${bill.provenance.datasetVersion}` : ''
                        }`,
                      bill.provenance.computedAt &&
                        `computed ${formatDate(bill.provenance.computedAt)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </Stack>
            )}

            <Stack style={{ gap: spacing.md }}>
              <Stack
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Precomputed by the PolicyEngine legislative tracker. District, household, and
                  validation views arrive with the full nationwide run.
                </Text>
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
          </Stack>
        </div>
        <div style={{ flex: '0 1 340px', minWidth: 280 }}>
          <ReportAdjustPanel
            title={bill.title}
            sourceNote={`${bill.jurisdiction} · ${bill.status}`}
            provisions={provisions}
          />
        </div>
      </div>
    </div>
  );
}
