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
  getBudgetCsvRows,
  getBudgetFillColor,
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

/** The bars' names where the full ones do not fit under their bars, as on a phone. */
const SHORT_NAMES: Record<string, string> = {
  'Federal tax revenues': 'Federal taxes',
  'Tax revenues': 'Taxes',
  'State and local income tax revenues': 'State taxes',
  'State and local income taxes': 'State taxes',
  'Benefit spending': 'Benefits',
  'Net impact': 'Net',
};

/** "−$296.5m": each bar in its own unit, the minus before the currency symbol. */
function formatBarAmount(value: number, countryId: CountryId): string {
  const amount = formatCurrencyAbbr(Math.abs(value), countryId, { maximumFractionDigits: 1 });
  return `${value < 0 ? MINUS : ''}${amount}`;
}

/**
 * The report's budgetary impact waterfall. The axis reads in the unit the
 * change is in (millions when it is under a billion), and every bar has
 * its label.
 */
export default function BudgetaryImpactSubPage({
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
  const spendingImpact = output.budget.benefit_spending_impact;
  const stateTaxImpact = output.budget.state_tax_revenue_impact;
  const taxImpact = output.budget.tax_revenue_impact - stateTaxImpact;

  const isUS = countryId === 'us';
  const labelsBeforeFilter = mobile
    ? [isUS ? 'Federal taxes' : 'Taxes', 'State and local income taxes', 'Benefits', 'Net']
    : [
        isUS ? 'Federal tax revenues' : 'Tax revenues',
        'State and local income tax revenues',
        'Benefit spending',
        'Net impact',
      ];
  const valuesBeforeFilter = [taxImpact, stateTaxImpact, -spendingImpact, budgetaryImpact];
  const values = valuesBeforeFilter.filter((value) => value !== 0);
  const labels = labelsBeforeFilter.filter((_label, i) => valuesBeforeFilter[i] !== 0);

  const items: WaterfallItem[] = values.map((value, i) => ({
    name: labels[i],
    value,
    isTotal: i === values.length - 1 && values.length > 1,
  }));

  // The unit comes from the bars' full extents, running totals included.
  const unit = pickCurrencyUnit(computeWaterfallData(items, String).flatMap((d) => d.range));
  const toAmount = (valueInUnit: number) => valueInUnit * unit.divisor;

  const hoverMessage = (name: string, amount: number) => {
    const nameLower = name.toLowerCase();
    const isTax = nameLower.includes('tax');
    const object = isTax
      ? nameLower
      : nameLower.includes('benefit')
        ? 'benefit spending'
        : 'the budget deficit';
    return absoluteChangeMessage('This reform', object, isTax ? amount : -amount, 0, (v) =>
      formatBillions(v, countryId)
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
    shortNames: SHORT_NAMES,
  };

  if (fillHeight) {
    return <ReportWaterfallChart {...chartProps} fillHeight />;
  }

  return (
    <ChartContainer
      title={getBudgetChartTitle(budgetaryImpact, countryId, metadata)}
      downloadFilename="budgetary-impact.svg"
      csvFilename="budgetary-impact.csv"
      csvData={getBudgetCsvRows(output, countryId)}
    >
      <ReportWaterfallChart {...chartProps} height={chartHeight} />
    </ChartContainer>
  );
}
