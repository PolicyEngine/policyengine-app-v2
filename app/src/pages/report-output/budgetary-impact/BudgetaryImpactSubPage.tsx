import { useSelector } from 'react-redux';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import {
  computeWaterfallData,
  getWaterfallDomain,
  WaterfallChart,
  type WaterfallItem,
} from '@/components/charts';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import {
  BudgetWaterfallTooltip,
  formatBillions,
  getBudgetChartTitle,
  getBudgetFillColor,
} from './budgetChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function BudgetaryImpactSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  const budgetaryImpact = output.budget.budgetary_impact;
  const spendingImpact = output.budget.benefit_spending_impact;
  const stateTaxImpact = output.budget.state_tax_revenue_impact;
  const taxImpact = output.budget.tax_revenue_impact - stateTaxImpact;

  // Labels differ for US vs other countries, and desktop vs mobile
  const isUS = countryId === 'us';
  const desktopLabels = [
    isUS ? 'Federal tax revenues' : 'Tax revenues',
    'State and local income tax revenues',
    'Benefit spending',
    'Net impact',
  ];
  const mobileLabels = [
    isUS ? 'Federal taxes' : 'Taxes',
    'State and local income taxes',
    'Benefits',
    'Net',
  ];
  const labelsBeforeFilter = mobile ? mobileLabels : desktopLabels;

  // Values in billions
  const valuesBeforeFilter = [
    taxImpact / 1e9,
    stateTaxImpact / 1e9,
    -spendingImpact / 1e9,
    budgetaryImpact / 1e9,
  ];

  // Filter out zero values
  const values = valuesBeforeFilter.filter((v) => v !== 0);
  const labels = labelsBeforeFilter.filter((_label, i) => valuesBeforeFilter[i] !== 0);

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = labels.map((label, i) => [label, values[i].toString()]);
    downloadCsv(csvData, 'budgetary-impact.csv');
  };

  // Generate hover message
  const hoverMessage = (name: string, valueBn: number) => {
    const nameLower = name.toLowerCase();
    const isTax = nameLower.includes('tax');
    const yValue = isTax ? valueBn * 1e9 : -(valueBn * 1e9);

    let obj: string;
    if (isTax) {
      obj = nameLower;
    } else if (nameLower.includes('benefit')) {
      obj = 'benefit spending';
    } else {
      obj = 'the budget deficit';
    }

    return absoluteChangeMessage('This reform', obj, yValue, 0, (v) =>
      formatBillions(v, countryId)
    );
  };

  // Build waterfall items
  const items: WaterfallItem[] = values.map((value, i) => ({
    name: labels[i],
    value,
    isTotal: i === values.length - 1 && values.length > 1,
  }));

  const data = computeWaterfallData(items, (v) => formatBillions(v * 1e9, countryId));

  // Attach hover text to each datum for the tooltip
  const dataWithHover = data.map((d) => ({
    ...d,
    hoverText: hoverMessage(d.name, d.value),
  }));

  const yDomain = getWaterfallDomain(data);
  const symbol = currencySymbol(countryId);

  return (
    <ChartContainer
      title={getBudgetChartTitle(budgetaryImpact, countryId, metadata)}
      onDownloadCsv={handleDownloadCsv}
    >
      <WaterfallChart
        data={dataWithHover}
        yDomain={yDomain}
        height={chartHeight}
        yAxisLabel="Budgetary impact (bn)"
        yTickFormatter={(v: number) => `${symbol}${v.toFixed(1)}`}
        fillColor={(d) => getBudgetFillColor(d, budgetaryImpact)}
        tooltipContent={<BudgetWaterfallTooltip />}
      />
    </ChartContainer>
  );
}
