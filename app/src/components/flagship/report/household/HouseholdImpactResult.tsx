import { useId, useState, type CSSProperties } from 'react';
import HouseholdBreakdowns, {
  HOUSEHOLD_BREAKDOWN_VIEWS,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import {
  effectColor,
  money,
  signedMoney,
} from '@/components/flagship/report/household/householdMoney';
import VariableInfoTip from '@/components/household/VariableInfoTip';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';
import type { HouseholdProgrammeChange } from '@/libs/flagship/householdProgrammeChanges';
import type { FlagshipHouseholdImpact, HouseholdLineChange } from '@/libs/flagship/householdRun';
import { trackHouseholdOutputViewed, type HouseholdOutputTab } from '@/utils/analytics';

const headerCell: CSSProperties = {
  padding: `0 0 ${spacing.sm}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

/** A number column's gap from the column before: narrow on a phone, so all four columns fit. */
const NUMBER_CELL = 'tw:pl-3 tw:md:pl-8';

/** A model variable's description, by its name; none for a variable without one. */
type DescribeVariable = (variable: string) => string | undefined;

/**
 * A line's name with its tip: every amount in the result is for the year,
 * then the line's variable as the model describes it, where it has one.
 */
function LineName({ line, describe }: { line: HouseholdLineChange; describe?: DescribeVariable }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
      {line.label}
      <VariableInfoTip
        label={line.label}
        period="Per year"
        description={line.variable ? describe?.(line.variable) : undefined}
      />
    </span>
  );
}

const bodyCell: CSSProperties = {
  padding: `${spacing.sm} 0`,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

function ChangeTable({
  label,
  lines,
  total,
  countryId,
  describe,
}: {
  label: string;
  lines: HouseholdLineChange[];
  total?: HouseholdLineChange;
  countryId: CountryId;
  describe?: DescribeVariable;
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
            <th scope="col" className={NUMBER_CELL} style={headerCell}>
              Baseline
            </th>
            <th scope="col" className={NUMBER_CELL} style={headerCell}>
              Reform
            </th>
            <th scope="col" className={NUMBER_CELL} style={headerCell}>
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
                  <LineName line={line} describe={describe} />
                </th>
                <td className={NUMBER_CELL} style={bodyCell}>
                  {line.baseline === null ? '—' : money(line.baseline, countryId)}
                </td>
                <td className={NUMBER_CELL} style={bodyCell}>
                  {line.reform === null ? '—' : money(line.reform, countryId)}
                </td>
                <td
                  className={NUMBER_CELL}
                  style={{ ...bodyCell, color: effectColor(line.effect) }}
                >
                  {signedMoney(line.change, countryId)}
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
  countryId,
  describe,
}: {
  impact: FlagshipHouseholdImpact;
  noChange: boolean;
  change: number;
  countryId: CountryId;
  describe?: DescribeVariable;
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
          countryId={countryId}
          describe={describe}
          total={{
            id: 'net_income',
            label: 'Net income',
            variable: 'household_net_income',
            baseline: netIncome.baseline,
            reform: netIncome.reform,
            change: netIncome.change,
            effect: netIncome.change,
          }}
        />
      )}
      {programs.length > 0 && (
        <ChangeTable
          label="Credits and benefits"
          lines={programs}
          countryId={countryId}
          describe={describe}
        />
      )}
    </>
  );
}

const VIEW_OPTIONS = [{ value: 'summary', label: 'Summary' }, ...HOUSEHOLD_BREAKDOWN_VIEWS];

/** Each output tab as analytics names it. */
const VIEW_ANALYTICS_NAMES: Record<'summary' | HouseholdBreakdownView, HouseholdOutputTab> = {
  summary: 'summary',
  'net-income': 'net_income',
  'earnings-variation': 'varying_earnings',
  'marginal-tax-rates': 'marginal_tax_rates',
};

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
  programmes,
  variationStartedAt,
  onVariationOpen,
  countryId = 'us',
  describe,
}: {
  impact: FlagshipHouseholdImpact;
  /** The household the result is for, e.g. "Single · no children · $50,000 earnings · Ohio · 2026". */
  summary: string;
  /** The household run the v2 breakdowns read; without it, only the summary shows. */
  breakdowns?: HouseholdBreakdownSource;
  /** When the household's variation run started, if it has: its bar carries on from there. */
  variationStartedAt?: number;
  /** Called when a variation output opens. */
  onVariationOpen?: () => void;
  /** The report's country: its currency. */
  countryId?: CountryId;
  /** A model variable's description, for the tip beside each line. */
  describe?: DescribeVariable;
  /**
   * The programmes the reform changes, from net income's tree, largest
   * first: "What changes" names them. Without them, it names the lines of
   * the summary tables.
   */
  programmes?: HouseholdProgrammeChange[];
}) {
  const [view, setView] = useState<'summary' | HouseholdBreakdownView>('summary');
  const { netIncome, components, programs } = impact;
  const change = Math.round(netIncome.change);
  const percent =
    netIncome.baseline > 0 && change !== 0 ? (netIncome.change / netIncome.baseline) * 100 : null;
  const noChange = change === 0 && components.length === 0 && programs.length === 0;
  const id = useId();

  // The changes that drive the result, largest first: what a reader looks for
  // next. Each programme that changes, signed by what it does to net income
  // (a tax that rises reads negative); else the summary's lines.
  const changed: { id: string; line: HouseholdLineChange; amount: number; effect: number }[] =
    programmes && programmes.length > 0
      ? programmes
          .filter((programme) => Math.round(programme.effect) !== 0)
          .map((programme) => ({
            id: programme.variable,
            line: {
              id: programme.variable,
              label: programme.label,
              variable: programme.variable,
              baseline: 0,
              reform: programme.change,
              change: programme.change,
              effect: programme.effect,
            },
            amount: programme.effect,
            effect: programme.effect,
          }))
      : [...programs, ...components]
          .filter((line) => Math.round(line.change) !== 0)
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .filter(
            (line, index, all) => all.findIndex((other) => other.label === line.label) === index
          )
          .map((line) => ({ id: line.id, line, amount: line.change, effect: line.effect }));
  const shownCount = programmes && programmes.length > 0 ? 4 : 3;
  const drivers = changed.slice(0, shownCount);
  const moreCount = changed.length - drivers.length;

  return (
    // No frame or title of its own: the household's panel names it, and the
    // result, its tables and its charts take the panel's full width.
    <section
      aria-label="Household impact"
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, minWidth: 0 }}
    >
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        {summary}
      </Text>

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
            {signedMoney(change, countryId)}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {money(netIncome.baseline, countryId)} → {money(netIncome.reform, countryId)}
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
            {drivers.map(({ id: key, line, amount, effect }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  fontSize: typography.fontSize.sm,
                }}
              >
                <span style={{ color: colors.text.primary }}>
                  <LineName line={line} describe={describe} />
                </span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: typography.fontWeight.medium,
                    color: effectColor(effect),
                  }}
                >
                  {signedMoney(amount, countryId)}
                </span>
              </div>
            ))}
            {moreCount > 0 &&
              (breakdowns ? (
                <button
                  type="button"
                  onClick={() => {
                    trackHouseholdOutputViewed({
                      countryId,
                      tab: VIEW_ANALYTICS_NAMES['net-income'],
                    });
                    setView('net-income');
                  }}
                  className="tw:cursor-pointer tw:self-start tw:border-0 tw:bg-transparent tw:p-0 tw:underline"
                  style={{ fontSize: typography.fontSize.sm, color: colors.primary[700] }}
                >
                  and {moreCount} more
                </button>
              ) : (
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  and {moreCount} more
                </span>
              ))}
            {programmes && changed.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  paddingTop: spacing.sm,
                  borderTop: `1px solid ${colors.border.light}`,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                <span style={{ color: colors.text.primary }}>Net income</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: effectColor(change) }}>
                  {signedMoney(change, countryId)}
                </span>
              </div>
            )}
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
                onClick={() => {
                  const next = option.value as typeof view;
                  // Sent per tab opened: a click on the open tab sends nothing.
                  if (next !== view) {
                    trackHouseholdOutputViewed({ countryId, tab: VIEW_ANALYTICS_NAMES[next] });
                  }
                  setView(next);
                }}
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
          <HouseholdBreakdowns
            view={view}
            source={breakdowns}
            variationStartedAt={variationStartedAt}
            onVariationOpen={onVariationOpen}
          />
        </div>
      ) : (
        <SummaryTables
          impact={impact}
          noChange={noChange}
          change={change}
          countryId={countryId}
          describe={describe}
        />
      )}
    </section>
  );
}
