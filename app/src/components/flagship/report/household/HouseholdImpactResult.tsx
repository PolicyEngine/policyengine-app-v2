import { useId, useState, type CSSProperties } from 'react';
import HouseholdBreakdowns, {
  HOUSEHOLD_BREAKDOWN_VIEWS,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { FlagshipHouseholdImpact, HouseholdLineChange } from '@/libs/flagship/householdRun';
import { formatCurrency } from '@/utils/formatters';

/** Whole dollars, with a true minus sign: "−$1,200". */
function money(value: number): string {
  const rounded = Math.round(value);
  const text = formatCurrency(Math.abs(rounded), 'us', { maximumFractionDigits: 0 });
  return rounded < 0 ? `−${text}` : text;
}

/** A change, always signed: "+$1,200", "−$300", "$0". */
function signedMoney(value: number): string {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${money(rounded)}` : money(rounded);
}

/** Gains read in the brand teal, losses in red. */
const effectColor = (effect: number) =>
  Math.round(effect) > 0
    ? colors.primary[700]
    : Math.round(effect) < 0
      ? colors.error
      : colors.text.primary;

const headerCell: CSSProperties = {
  padding: `0 ${spacing.md} ${spacing.sm}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

const bodyCell: CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

function ChangeTable({
  label,
  lines,
  total,
}: {
  label: string;
  lines: HouseholdLineChange[];
  total?: HouseholdLineChange;
}) {
  const rows = total ? [...lines, total] : lines;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-label={label}
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
              {label}
            </th>
            <th scope="col" style={headerCell}>
              Baseline
            </th>
            <th scope="col" style={headerCell}>
              Reform
            </th>
            <th scope="col" style={headerCell}>
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((line) => {
            const isTotal = line === total;
            return (
              <tr
                key={line.id}
                style={{
                  borderTop: `1px solid ${isTotal ? colors.border.medium : colors.border.light}`,
                  fontWeight: isTotal ? typography.fontWeight.semibold : undefined,
                }}
              >
                <th
                  scope="row"
                  style={{
                    ...bodyCell,
                    textAlign: 'left',
                    paddingLeft: 0,
                    whiteSpace: 'normal',
                    fontWeight: isTotal
                      ? typography.fontWeight.semibold
                      : typography.fontWeight.normal,
                  }}
                >
                  {line.label}
                </th>
                <td style={bodyCell}>{line.baseline === null ? '—' : money(line.baseline)}</td>
                <td style={bodyCell}>{line.reform === null ? '—' : money(line.reform)}</td>
                <td style={{ ...bodyCell, color: effectColor(line.effect) }}>
                  {signedMoney(line.change)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The v3 summary: the taxes and benefits, and the credits and benefits, the reform changes. */
function SummaryTables({
  impact,
  noChange,
  change,
}: {
  impact: FlagshipHouseholdImpact;
  noChange: boolean;
  change: number;
}) {
  const { netIncome, components, programs } = impact;
  return noChange ? (
    <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
      No change in this household&apos;s taxes or benefits.
    </Text>
  ) : (
    <>
      {(components.length > 0 || change !== 0) && (
        <ChangeTable
          label="Taxes and benefits"
          lines={components}
          total={{
            id: 'net_income',
            label: 'Net income',
            baseline: netIncome.baseline,
            reform: netIncome.reform,
            change: netIncome.change,
            effect: netIncome.change,
          }}
        />
      )}
      {programs.length > 0 && <ChangeTable label="Credits and benefits" lines={programs} />}
    </>
  );
}

const VIEW_OPTIONS = [{ value: 'summary', label: 'Summary' }, ...HOUSEHOLD_BREAKDOWN_VIEWS];

/**
 * A household's result: the change in its net income first, then the
 * taxes and benefits that make it up, then the credits and benefits
 * within them that the reform changes. Given the household run, a
 * switcher under the headline also offers the v2 household report's
 * breakdowns of it.
 */
export default function HouseholdImpactResult({
  impact,
  summary,
  breakdowns,
}: {
  impact: FlagshipHouseholdImpact;
  /** The household the result is for, e.g. "Single · no children · $50,000 earnings · Ohio · 2026". */
  summary: string;
  /** The household run the v2 breakdowns read; without it, only the summary shows. */
  breakdowns?: HouseholdBreakdownSource;
}) {
  const [view, setView] = useState<'summary' | HouseholdBreakdownView>('summary');
  const { netIncome, components, programs } = impact;
  const change = Math.round(netIncome.change);
  const percent =
    netIncome.baseline > 0 && change !== 0 ? (netIncome.change / netIncome.baseline) * 100 : null;
  const noChange = change === 0 && components.length === 0 && programs.length === 0;
  const id = useId();

  // The changes that drive the result, largest first: what a reader looks for next.
  const drivers = [...programs, ...components]
    .filter((line) => Math.round(line.change) !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .filter((line, index, all) => all.findIndex((other) => other.label === line.label) === index)
    .slice(0, 3);

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
          Household impact
        </Title>
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {summary}
        </Text>
      </Stack>

      {/* The headline beside what drives it, so the result reads at a glance. */}
      <div
        className="tw:grid tw:gap-4 tw:md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        style={{ alignItems: 'stretch' }}
      >
        <div
          role="group"
          aria-labelledby={`${id}-net`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            padding: spacing.lg,
            borderRadius: 10,
            background: change > 0 ? colors.primary[50] : colors.gray[50],
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
            Change in annual net income
          </span>
          <span
            style={{
              fontSize: typography.fontSize['4xl'],
              lineHeight: 1.1,
              fontWeight: typography.fontWeight.semibold,
              fontVariantNumeric: 'tabular-nums',
              color: effectColor(change),
            }}
          >
            {signedMoney(change)}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {money(netIncome.baseline)} → {money(netIncome.reform)}
            {percent !== null &&
              ` (${percent > 0 ? '+' : '−'}${Math.abs(percent) < 0.1 ? '<0.1' : Math.abs(percent).toFixed(1)}%)`}
          </span>
        </div>
        {drivers.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              padding: spacing.lg,
              borderRadius: 10,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
              }}
            >
              What changes
            </span>
            {drivers.map((line) => (
              <div
                key={line.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  fontSize: typography.fontSize.sm,
                }}
              >
                <span style={{ color: colors.text.primary }}>{line.label}</span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: typography.fontWeight.medium,
                    color: effectColor(line.effect),
                  }}
                >
                  {signedMoney(line.change)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {breakdowns && (
        // A tab per output: the summary, then the v2 household report's breakdowns.
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
          {VIEW_OPTIONS.map((option) => {
            const selected = view === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setView(option.value as typeof view)}
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
      )}

      {breakdowns && view !== 'summary' ? (
        <div style={{ minWidth: 0 }}>
          <HouseholdBreakdowns view={view} source={breakdowns} />
        </div>
      ) : (
        <SummaryTables impact={impact} noChange={noChange} change={change} />
      )}
    </section>
  );
}
