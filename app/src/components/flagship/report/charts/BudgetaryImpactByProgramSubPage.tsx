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
import { absoluteChangeMessage } from '@/utils/chartMessages';
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
}

/** "−£296.5m": each bar in its own unit, the minus before the currency symbol. */
function formatBarAmount(value: number, countryId: CountryId): string {
  const amount = formatCurrencyAbbr(Math.abs(value), countryId, { maximumFractionDigits: 1 });
  return `${value < 0 ? MINUS : ''}${amount}`;
}

/**
 * The benefit programmes in a detailed budget. The simulation API reports
 * each programme's own total, so a benefit's change is a change in
 * spending, and it costs the budget when it rises.
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
    if (typeof values?.difference !== 'number') {
      continue;
    }
    if (BENEFIT_PROGRAMS.has(key)) {
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
    .filter(([, values]) => typeof values?.difference === 'number' && values.difference !== 0)
    .map(([key, values]) => ({
      key,
      label: variableLabels[key]?.label || key,
      value: negateBenefits && BENEFIT_PROGRAMS.has(key) ? -values.difference : values.difference,
    }));
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

  if (programs.length === 0) {
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

  const items: WaterfallItem[] = [
    ...programs.map((program) => ({ name: program.label, value: program.value })),
    { name: 'Total', value: budgetaryImpact, isTotal: true },
  ];

  // The unit comes from the bars' full extents, running totals included.
  const unit = pickCurrencyUnit(computeWaterfallData(items, String).flatMap((d) => d.range));
  const toAmount = (valueInUnit: number) => valueInUnit * unit.divisor;

  const hoverMessage = (name: string, amount: number) => {
    const object =
      name === 'Total' ? 'the budget deficit' : `the ${name} ${programWord}'s budgetary impact`;
    return absoluteChangeMessage(
      'This reform',
      object,
      name === 'Total' ? -amount : amount,
      0,
      (v) => formatBillions(v, countryId)
    );
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
