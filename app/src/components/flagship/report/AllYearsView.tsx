import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { winnerShareMetric } from '@/components/flagship/ReportContents';
import { Button, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useBudgetWindow } from '@/hooks/useBudgetWindow';
import { formatCurrencyAbbr } from '@/utils/formatters';
import type { YearStatus } from './ReportYearSwitcher';

/** A signed relative change, "−2.1%", or "No change". */
function relativeChange(values?: { baseline: number; reform: number }): string {
  if (!values || !Number.isFinite(values.baseline) || !Number.isFinite(values.reform)) {
    return '—';
  }
  if (values.reform === values.baseline) {
    return 'No change';
  }
  if (values.baseline === 0) {
    return 'n/a';
  }
  const change = ((values.reform - values.baseline) / values.baseline) * 100;
  const magnitude = Math.abs(change);
  return `${change < 0 ? '−' : '+'}${magnitude < 0.1 ? '<0.1' : magnitude.toFixed(1)}%`;
}

function money(value: number, countryId: string): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (Math.abs(value) < 1000) {
    return '$0';
  }
  const amount = formatCurrencyAbbr(Math.abs(value), countryId as 'us', {
    maximumFractionDigits: 1,
  });
  return `${value < 0 ? '−' : '+'}${amount}`;
}

interface Row {
  label: string;
  /** What the figure means, under its label. */
  note?: string;
  cell: (output: SocietyWideReportOutput) => string;
}

const ROWS: Row[] = [
  {
    label: 'People gaining income',
    cell: (output) => {
      const all = output.intra_decile.all;
      return winnerShareMetric(
        all['Gain more than 5%'] + all['Gain less than 5%'],
        all['Lose more than 5%'] + all['Lose less than 5%']
      ).value;
    },
  },
  { label: 'Poverty', note: 'relative change', cell: (o) => relativeChange(o.poverty.poverty.all) },
  {
    label: 'Child poverty',
    note: 'relative change',
    cell: (o) => relativeChange(o.poverty.poverty.child),
  },
  {
    label: 'Inequality (Gini)',
    note: 'relative change',
    cell: (o) => relativeChange(o.inequality.gini),
  },
];

/**
 * A budget window's report, all its years at once. The budget adds up
 * across years, so it has a total; the rest — who gains, poverty,
 * inequality — are rates within a year, which do not add up, so each
 * year shows its own. A year's figures fill in once its results are in.
 */
export default function AllYearsView({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  years,
  outputs,
  statusByYear,
  onCalculateAll,
}: {
  countryId: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  years: string[];
  outputs: Record<string, SocietyWideReportOutput | null>;
  statusByYear: Record<string, YearStatus>;
  onCalculateAll: () => void;
}) {
  const window = useBudgetWindow(
    countryId,
    reformPolicyId,
    baselinePolicyId,
    { region: region || countryId, startYear: Number(years[0]), windowSize: years.length },
    { enabled: true }
  );
  const budget = window.data?.status === 'ok' ? window.data.result : null;
  const budgetFor = (year: string) =>
    budget?.annualImpacts.find((impact) => String(impact.year) === year)?.budgetaryImpact;
  const budgetPending = !budget && !window.isError && window.data?.status !== 'error';
  const notRun = years.filter((year) => statusByYear[year] === 'not-run');
  const span = `${years[0]}–${years[years.length - 1]}`;

  const pendingCell = (year: string) =>
    statusByYear[year] === 'computing'
      ? 'Calculating…'
      : statusByYear[year] === 'error'
        ? 'Failed'
        : '—';

  const cellStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    borderTop: `1px solid ${colors.border.light}`,
  };
  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    textAlign: 'left',
    whiteSpace: 'normal',
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  };

  return (
    <section
      aria-label={`All years, ${span}`}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <div>
          <Text
            style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}
          >
            Budgetary impact, {span}
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              fontVariantNumeric: 'tabular-nums',
              color: colors.text.primary,
            }}
          >
            {budget
              ? money(budget.totals.budgetaryImpact, countryId)
              : budgetPending
                ? 'Calculating…'
                : '—'}
          </Text>
        </div>
        {notRun.length > 0 && (
          <Button size="sm" variant="outline" onClick={onCalculateAll}>
            Calculate {notRun.length === 1 ? notRun[0] : `the other ${notRun.length} years`}
          </Button>
        )}
      </div>

      <div
        className="tw:overflow-x-auto"
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 12,
          background: colors.background.primary,
        }}
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: typography.fontSize.sm }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{
                  ...labelStyle,
                  borderTop: 'none',
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                <span className="tw:sr-only">Measure</span>
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  scope="col"
                  style={{
                    ...cellStyle,
                    borderTop: 'none',
                    color: colors.text.secondary,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {year}
                </th>
              ))}
              <th
                scope="col"
                style={{
                  ...cellStyle,
                  borderTop: 'none',
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style={labelStyle}>
                Budgetary impact
              </th>
              {years.map((year) => {
                const value = budgetFor(year);
                return (
                  <td key={year} style={cellStyle}>
                    {typeof value === 'number'
                      ? money(value, countryId)
                      : budgetPending
                        ? 'Calculating…'
                        : '—'}
                  </td>
                );
              })}
              <td style={{ ...cellStyle, fontWeight: typography.fontWeight.semibold }}>
                {budget ? money(budget.totals.budgetaryImpact, countryId) : '—'}
              </td>
            </tr>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row" style={labelStyle}>
                  {row.label}
                  {row.note && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.normal,
                        color: colors.text.secondary,
                      }}
                    >
                      {row.note}
                    </span>
                  )}
                </th>
                {years.map((year) => {
                  const output = outputs[year];
                  return (
                    <td
                      key={year}
                      style={{
                        ...cellStyle,
                        color: output ? colors.text.primary : colors.text.secondary,
                      }}
                    >
                      {output ? row.cell(output) : pendingCell(year)}
                    </td>
                  );
                })}
                <td
                  style={{ ...cellStyle, color: colors.text.tertiary }}
                  title="Rates within a year do not add up across years"
                >
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
