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

/** The programs a reform changes, by name, with their budget changes. */
export function getChangedPrograms(
  output: SocietyWideReportOutput,
  variableLabels: Record<string, { label?: string } | undefined>
): Array<{ key: string; label: string; value: number }> {
  const detailedBudget = (output.detailed_budget ?? {}) as Record<string, ProgramBudgetItem>;
  return Object.entries(detailedBudget)
    .filter(([, values]) => typeof values?.difference === 'number' && values.difference !== 0)
    .map(([key, values]) => ({
      key,
      label: variableLabels[key]?.label || key,
      value: values.difference,
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

  if (programs.length === 0) {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {output.detailed_budget
            ? 'This reform has no impact on individual programs.'
            : 'Detailed budgetary impact by program is not available for this report.'}
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
      name === 'Total' ? 'the budget deficit' : `the ${name} program's budgetary impact`;
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
