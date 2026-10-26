import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { ChartWatermark, ImpactTooltip } from '@/components/charts';
import ChartExplanation from '@/components/flagship/report/ChartExplanation';
import {
  fitAxisTitle,
  fixedPlotHeight,
  getValueBarLayout,
  tickDecimals,
} from '@/components/flagship/report/charts/barLayout';
import { ReportBarLabel } from '@/components/flagship/report/charts/ReportBarLabel';
import { usePlotSize } from '@/components/flagship/report/charts/usePlotSize';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens/colors';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import { tooltipText } from '@/libs/flagship/tooltipText';
import {
  getDecileRelativeCsvRows,
  type DecileBreakdown,
} from '@/pages/report-output/distributional-impact/distributionalChartUtils';
import type { RootState } from '@/store';
import { relativeChangeMessage } from '@/utils/chartMessages';
import { getClampedChartHeight, getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

/** Margins around the plot; value labels stay inside it, so the top needs little. */
const CHART_MARGIN = { top: 12, right: 20, bottom: 30 };

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
  compact?: boolean;
  /** Households ranked by wealth rather than income: the UK's wealth deciles. */
  breakdown?: DecileBreakdown;
}

export default function DistributionalImpactIncomeRelativeSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
  compact = false,
  breakdown = 'income',
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  // Extract data - object with keys "1", "2", ..., "10"
  const wealth = breakdown === 'wealth';
  const decileRelative = (wealth ? output.wealth_decile?.relative : output.decile.relative) ?? {};

  // Convert to arrays for plotting
  const xArray = Object.keys(decileRelative);
  const yArray = Object.values(decileRelative);

  // Calculate precision for value display
  const yvaluePrecision = Math.max(1, precision(yArray, 100));

  // Formatter for percentage display
  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: yvaluePrecision,
    });

  // Generate hover message
  const hoverMessage = (x: string, y: number) => {
    const obj = `the income of households in the ${ordinal(Number(x))}${wealth ? ' wealth' : ''} decile`;
    return relativeChangeMessage('This reform', obj, y, 0.001, countryId);
  };

  // Generate chart title
  const getChartTitle = () => {
    const relativeChange = -output.budget.budgetary_impact / output.budget.baseline_net_income;
    const term1 = 'the net income of households';
    const term2 = formatPercent(Math.abs(relativeChange), countryId, {
      maximumFractionDigits: 1,
    });
    const signTerm = relativeChange > 0 ? 'increase' : 'decrease';

    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (relativeChange === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase} on average`;
    }
    return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
  };

  // Transform data for Recharts
  const chartData = xArray.map((x, i) => ({
    name: x,
    value: yArray[i],
    label: (yArray[i] > 0 ? '+' : '') + formatPer(yArray[i]),
    hoverText: tooltipText(hoverMessage(x, yArray[i])),
  }));

  const { plotWidth, plotHeight, probe } = usePlotSize(
    fillHeight ? undefined : fixedPlotHeight(chartHeight, CHART_MARGIN)
  );
  const layout = getValueBarLayout(
    chartData.map((d) => d.value),
    chartData.map((d) => d.label),
    { width: plotWidth, height: plotHeight }
  );
  const { domain: yDomain, ticks: yTicks } = layout;

  // Enough decimals that a 0.25% step does not read as 0.3%.
  const tickDigits = Math.max(1, tickDecimals(yTicks.map((v) => v * 100)));
  const yTickFormatter = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(tickDigits)}%`;
  const axisTitle = fitAxisTitle(
    compact
      ? ['Income change (%)', 'Change (%)']
      : ['Relative change in household income', 'Income change (%)', 'Change (%)'],
    plotHeight
  );
  const yAxis = getYAxisLayout(yTicks, !!axisTitle, yTickFormatter);

  // Description text
  const description = wealth ? (
    <Text size="sm" c="dimmed">
      PolicyEngine reports net income as the income a household takes home in a year, after taxes
      and transfers. Wealth deciles contain an equal number of people (ranked by wealth).
    </Text>
  ) : (
    <Text size="sm" c="dimmed">
      PolicyEngine sorts households into ten equally-populated groups according to their baseline{' '}
      {countryId === 'uk' ? 'equivalised' : 'equivalized'} household net income.
    </Text>
  );

  const barChart = (
    <BarChart data={chartData} margin={{ ...CHART_MARGIN, left: yAxis.marginLeft }}>
      {probe}
      <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
      <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} tickLine={false}>
        <Label
          value={wealth ? 'Wealth decile' : 'Income decile'}
          position="bottom"
          offset={10}
          style={RECHARTS_FONT_STYLE}
        />
      </XAxis>
      <YAxis
        ticks={yTicks}
        domain={yDomain}
        tick={RECHARTS_FONT_STYLE}
        tickLine={false}
        tickFormatter={yTickFormatter}
        width={yAxis.yAxisWidth}
      >
        {axisTitle && (
          <Label
            value={axisTitle}
            angle={-90}
            position="center"
            dx={yAxis.labelDx}
            style={{ ...RECHARTS_FONT_STYLE, textAnchor: 'middle' }}
          />
        )}
      </YAxis>
      <ReferenceLine y={0} stroke={colors.gray[600]} strokeWidth={1} />
      <Tooltip content={<ImpactTooltip />} />
      <Bar
        dataKey="value"
        label={<ReportBarLabel data={chartData} layout={layout} />}
        isAnimationActive={false}
      >
        {chartData.map((entry, index) => (
          <Cell key={index} fill={entry.value < 0 ? colors.gray[600] : colors.primary[500]} />
        ))}
      </Bar>
    </BarChart>
  );

  if (fillHeight) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            {barChart}
          </ResponsiveContainer>
        </div>
        <div style={{ flexShrink: 0 }}>
          <ChartWatermark />
          <ChartExplanation compact={compact}>{description}</ChartExplanation>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename={`distributional-impact-${breakdown}-relative.svg`}
      csvFilename={`distributional-impact-${breakdown}-relative.csv`}
      csvData={getDecileRelativeCsvRows(output, breakdown)}
    >
      <Stack gap="sm">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {barChart}
        </ResponsiveContainer>
        <ChartWatermark />
        {description}
      </Stack>
    </ChartContainer>
  );
}
