import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import {
  computeWaterfallData,
  getWaterfallDomain,
  WaterfallChart,
  type WaterfallItem,
} from '@/components/charts';
import { Stack, Text } from '@/components/ui';
import { spacing } from '@/designTokens/spacing';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { downloadCsv, getClampedChartHeight, getNiceTicks } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import {
  BudgetWaterfallTooltip,
  formatBillions,
  getBudgetChartTitle,
  getBudgetFillColor,
  makeBudgetTickFormatter,
} from './budgetChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

interface ProgramBudgetItem {
  baseline: number;
  difference: number;
  reform: number;
}

export default function BudgetaryImpactByProgramSubPage({ output }: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const variables = metadata.variables;
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Check if detailed_budget exists (UK only feature)
  if (!output.detailed_budget || typeof output.detailed_budget !== 'object') {
    return (
      <Stack gap={spacing.md}>
        <Text size="lg" fw={500}>
          Detailed budgetary impact by program is not available for this report.
        </Text>
      </Stack>
    );
  }

  // Extract data
  const budgetaryImpact = output.budget.budgetary_impact;
  const detailedBudget = output.detailed_budget as Record<string, ProgramBudgetItem>;

  // Filter programs with non-zero difference and get labels
  const programs = Object.entries(detailedBudget)
    .filter(([, values]) => values.difference !== 0)
    .map(([key, values]) => ({
      key,
      label: variables[key]?.label || key,
      value: values.difference / 1e9,
    }));

  // If no programs with changes, show message
  if (programs.length === 0) {
    return (
      <Stack gap={spacing.md}>
        <Text size="lg" fw={500}>
          This reform has no impact on individual programs.
        </Text>
      </Stack>
    );
  }

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = [
      ['Program', 'Baseline', 'Reform', 'Difference'],
      ...programs.map((p) => {
        const item = detailedBudget[p.key];
        return [
          p.label,
          item.baseline.toString(),
          item.reform.toString(),
          item.difference.toString(),
        ];
      }),
    ];
    downloadCsv(csvData, 'budgetary-impact-by-program.csv');
  };

  // Generate hover message
  const hoverMessage = (label: string, valueBn: number) => {
    const actualValue = valueBn * 1e9;
    const obj =
      label === 'Total' ? 'the budget deficit' : `the ${label} program's budgetary impact`;
    const change = label === 'Total' ? -actualValue : actualValue;
    return absoluteChangeMessage('This reform', obj, change, 0, (v) =>
      formatBillions(v, countryId)
    );
  };

  // Build waterfall items: individual programs + total
  const items: WaterfallItem[] = [
    ...programs.map((p) => ({ name: p.label, value: p.value })),
    { name: 'Total', value: budgetaryImpact / 1e9, isTotal: true },
  ];

  const data = computeWaterfallData(items, (v) => formatBillions(v * 1e9, countryId));

  // Attach hover text to each datum for the tooltip
  const dataWithHover = data.map((d) => ({
    ...d,
    hoverText: hoverMessage(d.name, d.value),
  }));

  const yDomain = getWaterfallDomain(data);
  const yTicks = getNiceTicks(yDomain);
  const symbol = currencySymbol(countryId);
  const tickFormatter = makeBudgetTickFormatter(symbol, yDomain);

  return (
    <ChartContainer
      title={getBudgetChartTitle(budgetaryImpact, countryId, metadata)}
      onDownloadCsv={handleDownloadCsv}
    >
      <WaterfallChart
        data={dataWithHover}
        yDomain={yDomain}
        yTicks={yTicks}
        height={chartHeight}
        yAxisLabel="Budgetary impact (bn)"
        yTickFormatter={tickFormatter}
        fillColor={(d) => getBudgetFillColor(d, budgetaryImpact)}
        tooltipContent={<BudgetWaterfallTooltip />}
      />
    </ChartContainer>
  );
}
