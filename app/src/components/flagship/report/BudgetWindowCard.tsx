import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { BudgetWindowParams, BudgetWindowYear } from '@/api/budgetWindow';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { budgetWindowQueryKey, useBudgetWindow } from '@/hooks/useBudgetWindow';
import { getTaxYears } from '@/libs/metadataUtils';
import { formatCurrencyAbbr } from '@/utils/formatters';

/** Window lengths offered: the common scoring windows. */
const WINDOW_SIZES = [3, 5, 10];
const DEFAULT_WINDOW = 10;
/**
 * Below this a figure reads as nothing: the federal figure is the total
 * less the state's, and subtracting two large sums leaves a few dollars
 * of rounding where a state bill changes no federal revenue.
 */
const NEGLIGIBLE = 1000;
/** A typical 10-year window, for the bar until the API's progress arrives. */
const EXPECTED_MS = 20 * 60 * 1000;

interface BudgetWindowCardProps {
  countryId: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  /** The report's population, e.g. "state/de"; the whole country when absent. */
  region?: string;
  /** The report's year, the window's default start. */
  year: string;
  /** A window asked for with the run (in Build): the section opens on it, running. */
  initialWindow?: { startYear: number; windowSize: number };
}

const headerCell: React.CSSProperties = {
  padding: `0 ${spacing.md} ${spacing.sm}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

const bodyCell: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

function MiniSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        size="sm"
        className="tw:w-auto tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="tw:cursor-pointer">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Scoring 2026, 2027 (0 of 10 complete)..." reads without its trailing dots. */
const progressDetail = (message?: string | null) =>
  message ? message.replace(/[.…]+$/, '') : undefined;

/**
 * The reform's budget over several years: the same reform and baseline
 * scored for each year of a window, with the window's total. A window
 * runs a simulation for every year, so it starts only from its button —
 * changing the start or the length waits for the next click, and the
 * table keeps the window it was calculated for.
 */
export default function BudgetWindowCard({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  year,
  initialWindow,
}: BudgetWindowCardProps) {
  const taxYears = useSelector(getTaxYears);
  const reportYear = Number(year);
  const startOptions = Array.from(
    new Set([reportYear, ...taxYears.map((taxYear) => Number(taxYear.value))])
  )
    .filter((option) => Number.isFinite(option))
    .sort((a, b) => a - b);
  const [startYear, setStartYear] = useState(initialWindow?.startYear ?? reportYear);
  const [windowSize, setWindowSize] = useState(initialWindow?.windowSize ?? DEFAULT_WINDOW);
  // Back on the tab, a window already asked for picks up where it was:
  // its result, or its run, still being checked on.
  const queryClient = useQueryClient();
  const [requested, setRequested] = useState<BudgetWindowParams | null>(() => {
    // Asked for in Build: the reader already chose to run it.
    if (initialWindow) {
      return { region: region ?? countryId, ...initialWindow };
    }
    const initial = {
      region: region ?? countryId,
      startYear: reportYear,
      windowSize: DEFAULT_WINDOW,
    };
    return queryClient.getQueryData(
      budgetWindowQueryKey(countryId, reformPolicyId, baselinePolicyId, initial)
    )
      ? initial
      : null;
  });

  const budget = useBudgetWindow(
    countryId,
    reformPolicyId,
    baselinePolicyId,
    requested ?? { region: region ?? countryId, startYear, windowSize },
    { enabled: !!requested }
  );
  const data = budget.data;
  const computing =
    !!requested && (budget.isFetching || data?.status === 'computing') && !data?.result;
  const failed = !!requested && !computing && (budget.isError || data?.status === 'error');
  const result = data?.status === 'ok' ? data.result : null;
  const pendingChoice =
    !requested || requested.startYear !== startYear || requested.windowSize !== windowSize;

  const money = (value: number) => {
    if (!Number.isFinite(value)) {
      return '—';
    }
    if (Math.abs(value) < NEGLIGIBLE) {
      return countryId === 'uk' ? '£0' : '$0';
    }
    const text = formatCurrencyAbbr(Math.abs(value), countryId as 'us' | 'uk', {
      maximumFractionDigits: 1,
    });
    return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
  };

  const rows = result ? [...result.annualImpacts, result.totals] : [];
  // A state column only where a state figure exists: a state run, or a
  // federal reform that moves state revenue too.
  const showState =
    countryId === 'us' &&
    (!!region?.startsWith('state/') ||
      rows.some((row) => Math.abs(row.stateTaxRevenueImpact) >= NEGLIGIBLE));
  const columns: Array<{ label: string; value: (row: BudgetWindowYear) => number }> = [
    showState
      ? { label: 'Federal tax revenue', value: (row) => row.federalTaxRevenueImpact }
      : { label: 'Tax revenue', value: (row) => row.taxRevenueImpact },
    ...(showState
      ? [
          {
            label: 'State tax revenue',
            value: (row: BudgetWindowYear) => row.stateTaxRevenueImpact,
          },
        ]
      : []),
    { label: 'Benefit spending', value: (row) => row.benefitSpendingImpact },
    { label: 'Budgetary impact', value: (row) => row.budgetaryImpact },
  ];

  const start = () => setRequested({ region: region ?? countryId, startYear, windowSize });
  const lastYear = (params: { startYear: number; windowSize: number }) =>
    params.startYear + params.windowSize - 1;

  return (
    <section
      aria-labelledby="budget-window-heading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ gap: spacing.xs }}>
        <Title id="budget-window-heading" order={3} style={{ margin: 0 }}>
          Budget window
        </Title>
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          The budgetary impact in each year of a window, and the window&apos;s total.
        </Text>
      </Stack>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>From</span>
        <MiniSelect
          label="Window starts"
          value={String(startYear)}
          options={startOptions.map((option) => ({ value: String(option), label: String(option) }))}
          onChange={(next) => setStartYear(Number(next))}
        />
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>for</span>
        <MiniSelect
          label="Window length"
          value={String(windowSize)}
          options={WINDOW_SIZES.map((size) => ({ value: String(size), label: `${size} years` }))}
          onChange={(next) => setWindowSize(Number(next))}
        />
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {startYear}–{lastYear({ startYear, windowSize })}
        </span>
        <Button
          size="sm"
          onClick={start}
          // The window on screen is the one chosen: nothing to run again.
          disabled={
            !reformPolicyId || !baselinePolicyId || (!pendingChoice && (computing || !!result))
          }
          style={{ marginLeft: 'auto' }}
        >
          {result && !pendingChoice ? 'Calculated' : `Calculate ${windowSize}-year budget`}
        </Button>
      </div>

      {computing && requested && (
        <RunProgress
          title={`Calculating the ${requested.startYear}–${lastYear(requested)} budget`}
          progress={typeof data?.progress === 'number' ? data.progress : undefined}
          detail={progressDetail(data?.message)}
          expectedMs={EXPECTED_MS}
        />
      )}

      {failed && (
        <ErrorState
          compact
          title="The budget window could not be calculated"
          description={data?.error || budget.error?.message}
          onRetry={() => budget.refetch()}
        />
      )}

      {result && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <thead>
              <tr>
                <th scope="col" style={{ ...headerCell, textAlign: 'left', paddingLeft: 0 }}>
                  Year
                </th>
                {columns.map((column) => (
                  <th key={column.label} scope="col" style={headerCell}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const total = index === rows.length - 1;
                return (
                  <tr
                    key={String(row.year)}
                    style={{
                      borderTop: `1px solid ${total ? colors.border.medium : colors.border.light}`,
                      fontWeight: total ? typography.fontWeight.semibold : undefined,
                    }}
                  >
                    <th
                      scope="row"
                      style={{
                        ...bodyCell,
                        textAlign: 'left',
                        paddingLeft: 0,
                        fontWeight: total
                          ? typography.fontWeight.semibold
                          : typography.fontWeight.normal,
                      }}
                    >
                      {total ? 'Total' : String(row.year)}
                    </th>
                    {columns.map((column) => (
                      <td key={column.label} style={bodyCell}>
                        {money(column.value(row))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Text
            style={{
              margin: `${spacing.sm} 0 0`,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Budgetary impact is the change in tax revenue less the change in benefit spending. A
            negative value is a cost to the government.
          </Text>
        </div>
      )}
    </section>
  );
}
