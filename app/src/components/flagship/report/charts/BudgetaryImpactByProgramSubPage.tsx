import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { computeWaterfallData, type WaterfallDatum, type WaterfallItem } from '@/components/charts';
import {
  formatUnitAmount,
  MINUS,
  pickCurrencyUnit,
} from '@/components/flagship/report/charts/barLayout';
import ReportWaterfallChart from '@/components/flagship/report/charts/ReportWaterfallChart';
import { Stack, Text } from '@/components/ui';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { CountryId } from '@/libs/countries';
import { tooltipText } from '@/libs/flagship/tooltipText';
import {
  BudgetWaterfallTooltip,
  formatBillions,
  getBudgetChartTitle,
  getBudgetFillColor,
  getDetailedBudgetCsvRows,
} from '@/pages/report-output/budgetary-impact/budgetChartUtils';
import type { RootState } from '@/store';
import { absoluteChangeMessage, wordWrap } from '@/utils/chartMessages';
import { getClampedChartHeight } from '@/utils/chartUtils';
import { currencySymbol, formatCurrencyAbbr } from '@/utils/formatters';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
}

interface ProgramBudgetItem {
  baseline: number;
  difference: number;
  reform: number;
  /** Whether the program is a tax; absent from outputs built before the simulation API sent it. */
  is_tax?: boolean | null;
}

/** "−£296.5m": each bar in its own unit, the minus before the currency symbol. */
function formatBarAmount(value: number, countryId: CountryId): string {
  const amount = formatCurrencyAbbr(Math.abs(value), countryId, { maximumFractionDigits: 1 });
  return `${value < 0 ? MINUS : ''}${amount}`;
}

/**
 * The benefit programmes in a detailed budget, for outputs whose rows
 * don't say whether each is a tax. The simulation API reports each
 * programme's own total, so a benefit's change is a change in spending,
 * and it costs the budget when it rises.
 */
const BENEFIT_PROGRAMS = new Set([
  'universal_credit',
  'child_benefit',
  'pension_credit',
  'income_support',
  'working_tax_credit',
  'child_tax_credit',
  'tax_credits',
  'state_pension',
  'snap',
  'tanf',
  'ssi',
  'social_security',
  'medicare',
  'medicaid',
  'eitc',
  'ctc',
]);

/**
 * Rows the total budgetary impact doesn't include, with why, to follow
 * "Not in the total:" in a bar's hover text. The total is
 * the change in the taxes households pay less the change in the benefits
 * they get. Their changes are shown but not added up against the total.
 */
const OUTSIDE_TOTAL_REASONS: Record<string, string> = {
  ni_employer: 'employers pay it, so the total of household taxes and benefits leaves it out.',
  tax_credits:
    'it is what families are entitled to; the total counts the Working Tax Credit and Child Tax Credit they claim.',
};

/** Short names for the rows outside the total, for a narrow axis. */
const OUTSIDE_TOTAL_SHORT_NAMES: Record<string, string> = {
  ni_employer: 'Employer NI',
  tax_credits: 'Tax credits',
};

/**
 * Rows dropped where rows that cover the same money are listed:
 * `tax_credits` is the entitlement behind Working Tax Credit and Child Tax
 * Credit, and `vat` changes by as much as `vat_change`, the VAT above
 * current law's that the total counts.
 */
const REPEATED_ROWS: Record<string, string[]> = {
  tax_credits: ['working_tax_credit', 'child_tax_credit'],
  vat: ['vat_change'],
};

/** Whether a row repeats others the detailed budget lists. */
function isRepeatedRow(key: string, detailedBudget: Record<string, unknown>): boolean {
  return (REPEATED_ROWS[key] ?? []).some((repeated) => repeated in detailedBudget);
}

/**
 * Whether a row is a benefit: its own `is_tax` flag when the output has
 * one, which covers every programme the model reports, otherwise the
 * fixed list.
 */
function isBenefit(key: string, values: ProgramBudgetItem): boolean {
  return typeof values.is_tax === 'boolean' ? !values.is_tax : BENEFIT_PROGRAMS.has(key);
}

/**
 * Whether the benefits' differences are spending changes, to negate into
 * budget changes. The simulation API sends spending; the legacy API sent
 * each benefit already as its budget effect. The sign that lets the bars
 * add up to the total tells the two apart; spending wins a tie.
 */
function benefitsAreSpending(
  detailedBudget: Record<string, ProgramBudgetItem>,
  budgetaryImpact: number | undefined
): boolean {
  let taxes = 0;
  let benefits = 0;
  for (const [key, values] of Object.entries(detailedBudget)) {
    if (
      typeof values?.difference !== 'number' ||
      key in OUTSIDE_TOTAL_REASONS ||
      isRepeatedRow(key, detailedBudget)
    ) {
      continue;
    }
    if (isBenefit(key, values)) {
      benefits += values.difference;
    } else {
      taxes += values.difference;
    }
  }
  if (typeof budgetaryImpact !== 'number' || !Number.isFinite(budgetaryImpact)) {
    return true;
  }
  return (
    Math.abs(taxes - benefits - budgetaryImpact) <= Math.abs(taxes + benefits - budgetaryImpact)
  );
}

/** The programs a reform changes, by name, with each one's effect on the budget. */
export function getChangedPrograms(
  output: SocietyWideReportOutput,
  variableLabels: Record<string, { label?: string } | undefined>
): Array<{ key: string; label: string; value: number }> {
  const detailedBudget = (output.detailed_budget ?? {}) as Record<string, ProgramBudgetItem>;
  const negateBenefits = benefitsAreSpending(detailedBudget, output.budget?.budgetary_impact);
  return Object.entries(detailedBudget)
    .filter(
      ([key, values]) =>
        typeof values?.difference === 'number' &&
        values.difference !== 0 &&
        !isRepeatedRow(key, detailedBudget)
    )
    .map(([key, values]) => ({
      key,
      label: variableLabels[key]?.label || key,
      value: negateBenefits && isBenefit(key, values) ? -values.difference : values.difference,
    }));
}

/** Whether a row's change is left out of the total budgetary impact. */
export function isOutsideTotal(key: string | undefined): boolean {
  return key !== undefined && key in OUTSIDE_TOTAL_REASONS;
}

/**
 * The smallest unlisted share of the total that gets its own bar: below it
 * the gap is rounding, not a program.
 */
const OTHER_PROGRAMS_MIN_SHARE = 0.001;

/**
 * The part of the total budgetary impact that the listed programs don't
 * add up to; 0 when they do. The total sums every tax and benefit in the
 * model, but the detailed budget lists only some programs, so a change in
 * any other one (such as Scottish Child Payment lost with Universal Credit)
 * is in the total with no bar of its own. Rows outside the total don't
 * count towards it.
 */
export function getOtherProgramsAmount(
  budgetaryImpact: number,
  programs: Array<{ key?: string; value: number }>
): number {
  const listed = programs
    .filter((program) => !isOutsideTotal(program.key))
    .reduce((sum, program) => sum + program.value, 0);
  const other = budgetaryImpact - listed;
  const threshold = Math.max(1, OTHER_PROGRAMS_MIN_SHARE * Math.abs(budgetaryImpact));
  return Number.isFinite(other) && Math.abs(other) >= threshold ? other : 0;
}

/**
 * The UK report's budgetary impact by program, as v2 shows it: a
 * waterfall of each program's change and the total, drawn the flagship
 * way — the axis in the unit the change is in, and a label on every bar.
 */
export default function BudgetaryImpactByProgramSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  const budgetaryImpact = output.budget.budgetary_impact;
  const programs = getChangedPrograms(output, metadata.variables ?? {});
  const programWord = countryId === 'uk' ? 'programme' : 'program';
  const otherLabel = `Other ${programWord}s`;
  const other = output.detailed_budget ? getOtherProgramsAmount(budgetaryImpact, programs) : 0;
  // Rows the total leaves out, by bar name: they stand after the total.
  const outsideTotal = new Map(
    programs
      .filter((program) => isOutsideTotal(program.key))
      .map((program) => [`${program.label} (not in total)`, program])
  );

  if (programs.length === 0 && other === 0) {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {output.detailed_budget
            ? `This reform has no impact on individual ${programWord}s.`
            : `Detailed budgetary impact by ${programWord} is not available for this report.`}
        </Text>
      </Stack>
    );
  }

  // Rows the total leaves out stand after it, each from zero, so the bars
  // before it still add up to the total.
  const items: WaterfallItem[] = [
    ...programs
      .filter((program) => !isOutsideTotal(program.key))
      .map((program) => ({ name: program.label, value: program.value })),
    ...(other !== 0 ? [{ name: otherLabel, value: other }] : []),
    { name: 'Total', value: budgetaryImpact, isTotal: true },
    ...[...outsideTotal].map(([name, program]) => ({
      name,
      value: program.value,
      isStandalone: true,
    })),
  ];

  // The unit comes from the bars' full extents, running totals included.
  const unit = pickCurrencyUnit(computeWaterfallData(items, String).flatMap((d) => d.range));
  const toAmount = (valueInUnit: number) => valueInUnit * unit.divisor;

  const hoverMessage = (name: string, amount: number) => {
    if (name === otherLabel) {
      const change = absoluteChangeMessage(
        'This reform',
        `the budgetary impact of ${programWord}s that this chart doesn't list separately`,
        amount,
        0,
        (v) => formatBillions(v, countryId)
      );
      const why = wordWrap(
        'The total includes every tax and benefit in the model, so their changes are in it without a bar of their own.',
        50
      );
      return `${change}.\n${why}`;
    }
    const label = outsideTotal.get(name)?.label ?? name;
    const object =
      name === 'Total' ? 'the budget deficit' : `the ${label} ${programWord}'s budgetary impact`;
    const change = absoluteChangeMessage(
      'This reform',
      object,
      name === 'Total' ? -amount : amount,
      0,
      (v) => formatBillions(v, countryId)
    );
    const outside = outsideTotal.get(name);
    if (!outside) {
      return change;
    }
    const why = wordWrap(`Not in the total: ${OUTSIDE_TOTAL_REASONS[outside.key]}`, 50);
    return `${change}.\n${why}`;
  };

  const data = computeWaterfallData(
    items.map((item) => ({ ...item, value: item.value / unit.divisor })),
    (value) => formatBarAmount(toAmount(value), countryId)
  ).map((datum) => ({
    ...datum,
    hoverText: tooltipText(hoverMessage(datum.name, toAmount(datum.value))),
  }));

  const symbol = currencySymbol(countryId);
  const unitName = `${symbol}${unit.suffix}`;
  const chartProps = {
    data,
    // A narrow axis shows a bar outside the total by its short name.
    shortNames: Object.fromEntries(
      [...outsideTotal].map(([name, program]) => [
        name,
        `${OUTSIDE_TOTAL_SHORT_NAMES[program.key] ?? program.label} (not in total)`,
      ])
    ),
    yAxisTitles: [`Budgetary impact (${unitName})`, `Impact (${unitName})`],
    formatTick: (value: number, decimals: number) =>
      formatUnitAmount(value, unit, symbol, decimals),
    formatBarLabel: (value: number) => formatBarAmount(toAmount(value), countryId),
    fillColor: (datum: WaterfallDatum) => getBudgetFillColor(datum, budgetaryImpact),
    tooltipContent: <BudgetWaterfallTooltip />,
  };

  if (fillHeight) {
    return <ReportWaterfallChart {...chartProps} fillHeight />;
  }

  return (
    <ChartContainer
      title={getBudgetChartTitle(budgetaryImpact, countryId, metadata)}
      downloadFilename="budgetary-impact-by-program.svg"
      csvFilename="budgetary-impact-by-program.csv"
      csvData={getDetailedBudgetCsvRows(output, metadata)}
    >
      <ReportWaterfallChart {...chartProps} height={chartHeight} />
    </ChartContainer>
  );
}
