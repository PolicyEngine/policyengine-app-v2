import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import {
  computeWaterfallData,
  getWaterfallDomain,
  WaterfallChart,
  type WaterfallDatum,
  type WaterfallItem,
} from '@/components/charts';
import { Stack, Text } from '@/components/ui';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { getClampedChartHeight, getNiceTicks } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import {
  BudgetWaterfallTooltip,
  formatBillions,
  getBudgetFillColor,
  makeBudgetTickFormatter,
} from './budgetChartUtils';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
}

export default function BudgetaryImpactByLevelSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  const budget = output.budget;
  const federalBudgetaryImpact = budget.federal_budgetary_impact;
  const stateBudgetaryImpact = budget.state_budgetary_impact;

  // If the economy worker didn't populate the new keys (older releases, or
  // non-US countries), fall back to a message pointing users at the total
  // chart. Breaking the chart silently is worse than an explicit note.
  if (
    federalBudgetaryImpact === undefined ||
    stateBudgetaryImpact === undefined ||
    countryId !== 'us'
  ) {
    return (
      <Stack gap="md">
        <Text size="lg" fw={500}>
          Federal vs. state budgetary impact is available only for US reforms, and requires the
          simulation to include FMAP-based Medicaid/CHIP cost attribution (shipping in the next
          policyengine-us release).
        </Text>
      </Stack>
    );
  }

  const budgetaryImpact = budget.budgetary_impact;

  // Values in billions
  const valuesBeforeFilter = [
    federalBudgetaryImpact / 1e9,
    stateBudgetaryImpact / 1e9,
    budgetaryImpact / 1e9,
  ];
  const labelsBeforeFilter = mobile
    ? ['Federal', 'State', 'Net']
    : ['Federal budgetary impact', 'State budgetary impact', 'Net impact'];

  const values = valuesBeforeFilter.filter((v) => v !== 0);
  const labels = labelsBeforeFilter.filter((_l, i) => valuesBeforeFilter[i] !== 0);

  const hoverMessage = (name: string, valueBn: number) => {
    const nameLower = name.toLowerCase();
    const yValue = valueBn * 1e9;
    const obj = nameLower.includes('net')
      ? 'the combined budget deficit'
      : nameLower.includes('federal')
        ? 'the federal budget deficit'
        : 'state budget deficits';
    return absoluteChangeMessage('This reform', obj, -yValue, 0, (v) =>
      formatBillions(v, countryId)
    );
  };

  const items: WaterfallItem[] = values.map((value, i) => ({
    name: labels[i],
    value,
    isTotal: i === values.length - 1 && values.length > 1,
  }));

  const data = computeWaterfallData(items, (v) => formatBillions(v * 1e9, countryId));
  const dataWithHover = data.map((d) => ({
    ...d,
    hoverText: hoverMessage(d.name, d.value),
  }));

  const yDomain = getWaterfallDomain(data);
  const yTicks = getNiceTicks(yDomain);
  const symbol = currencySymbol(countryId);
  const tickFormatter = makeBudgetTickFormatter(symbol, yDomain);

  const waterfallProps = {
    data: dataWithHover,
    yDomain,
    yTicks,
    yAxisLabel: 'Budgetary impact (bn)' as const,
    yTickFormatter: tickFormatter,
    fillColor: (d: WaterfallDatum) => getBudgetFillColor(d, budgetaryImpact),
    tooltipContent: <BudgetWaterfallTooltip />,
    barLabelFormatter: (v: number) => formatBillions(v * 1e9, countryId),
  };

  if (fillHeight) {
    return <WaterfallChart {...waterfallProps} fillHeight />;
  }

  // Suppress unused metadata warning — kept for parity with sibling sub-pages
  // that consume metadata for title generation.
  void metadata;

  return (
    <ChartContainer
      title={
        budgetaryImpact < 0
          ? `This reform costs the federal and state governments $${formatBillions(-budgetaryImpact, countryId)}`
          : `This reform raises $${formatBillions(budgetaryImpact, countryId)} split between federal and state`
      }
      downloadFilename="budgetary-impact-by-level.svg"
    >
      <WaterfallChart {...waterfallProps} height={chartHeight} />
    </ChartContainer>
  );
}
