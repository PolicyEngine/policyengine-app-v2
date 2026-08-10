import { IconArrowLeft, IconChartBar } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrackedBill } from '@/api/billFeed';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
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

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Stack
      style={{
        gap: 2,
        padding: `${spacing.md} ${spacing.lg}`,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        minWidth: 140,
      }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        {label}
      </Text>
    </Stack>
  );
}

function money(value: number): string {
  const { display, label } = formatBudgetaryImpact(value);
  return `${value < 0 ? '−' : ''}$${display}${label ? ` ${label}` : ''}`;
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

  const decileRows = impact?.decile?.average
    ? Object.entries(impact.decile.average)
        .map(([decile, value]) => ({ decile, value: Number(value) }))
        .sort((a, b) => Number(a.decile) - Number(b.decile))
    : [];

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
            </Stack>

            {provisions.length > 0 && (
              <Stack style={{ gap: spacing.md }}>
                <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.xl }}>
                  What it changes
                </Title>
                <ProvisionList provisions={provisions} />
              </Stack>
            )}

            <Stack style={{ gap: spacing.md }}>
              <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.xl }}>
                Economic impacts
              </Title>
              <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                {typeof impact?.budgetary?.stateRevenueImpact === 'number' && (
                  <StatTile
                    value={money(impact.budgetary.stateRevenueImpact)}
                    label="revenue change"
                  />
                )}
                {typeof impact?.budgetary?.households === 'number' &&
                  impact.budgetary.households > 0 && (
                    <StatTile
                      value={impact.budgetary.households.toLocaleString()}
                      label="households affected"
                    />
                  )}
                {typeof impact?.poverty?.percentChange === 'number' &&
                  impact.poverty.percentChange !== 0 && (
                    <StatTile
                      value={`${impact.poverty.percentChange > 0 ? '+' : '−'}${Math.abs(impact.poverty.percentChange).toFixed(1)}%`}
                      label="poverty rate change"
                    />
                  )}
                {typeof betterOff === 'number' && betterOff > 0 && (
                  <StatTile value={`${betterOff.toFixed(0)}%`} label="better off" />
                )}
                {typeof worseOff === 'number' && worseOff > 0 && (
                  <StatTile value={`${worseOff.toFixed(0)}%`} label="worse off" />
                )}
              </Stack>

              {decileRows.length > 0 && (
                <Stack
                  style={{
                    gap: spacing.sm,
                    padding: spacing.lg,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 12,
                    background: colors.background.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                    }}
                  >
                    Average household income change by decile
                  </Text>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={decileRows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <XAxis
                          dataKey="decile"
                          tickLine={false}
                          axisLine={{ stroke: colors.border.light }}
                          tick={{ fontSize: 12, fill: colors.text.secondary }}
                        />
                        <YAxis
                          tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: colors.text.secondary }}
                          width={70}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value ?? 0).toLocaleString()}`,
                            'Average change',
                          ]}
                          labelFormatter={(label) => `Decile ${label}`}
                        />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
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
                </Stack>
              )}

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
