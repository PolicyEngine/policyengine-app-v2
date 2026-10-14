import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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
import {
  rateChangeMessage,
  relativeBar,
  relativeChange,
} from '@/components/flagship/report/charts/relativeChange';
import { ReportBarLabel } from '@/components/flagship/report/charts/ReportBarLabel';
import { usePlotSize } from '@/components/flagship/report/charts/usePlotSize';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens/colors';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import { getInequalityCsvRows } from '@/pages/report-output/inequality-impact/inequalityChartUtils';
import type { RootState } from '@/store';
import { getClampedChartHeight, getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

/** Margins around the plot; value labels stay inside it, so the top needs little. */
const CHART_MARGIN = { top: 12, right: 20, bottom: 20 };

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
  compact?: boolean;
  trimAxisZeros?: boolean;
}

export default function InequalityImpactSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
  compact = false,
  trimAxisZeros = false,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  const giniImpact = output.inequality.gini;
  const top10Impact = output.inequality.top_10_pct_share;
  const top1Impact = output.inequality.top_1_pct_share;

  const labels = ['Gini index', 'Top 10% share', 'Top 1% share'];
  // Each measure's change; none for a measure that is zero before.
  const metricChanges = [giniImpact, top10Impact, top1Impact].map(({ baseline, reform }) =>
    relativeChange(reform, baseline)
  );

  // Calculate precision for display
  const yvaluePrecision = Math.max(
    1,
    precision(
      metricChanges.filter((change): change is number => change !== null),
      100
    )
  );

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: yvaluePrecision,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    let obj: string;
    let baseline: number;
    let reform: number;
    let formatter: (n: number) => string;

    if (x === 'Gini index') {
      obj = 'the Gini index of net income';
      baseline = giniImpact.baseline;
      reform = giniImpact.reform;
      formatter = (n) => n.toFixed(3);
    } else if (x === 'Top 10% share') {
      obj = 'the share of total net income held by people in the top 10% of households';
      baseline = top10Impact.baseline;
      reform = top10Impact.reform;
      formatter = formatPer;
    } else {
      obj = 'the share of total net income held by people in the top 1% of households';
      baseline = top1Impact.baseline;
      reform = top1Impact.reform;
      formatter = formatPer;
    }

    return rateChangeMessage(obj, baseline, reform, countryId, formatter);
  };

  // Generate chart title
  const getChartTitle = () => {
    const signTerm = metricChanges.every((change) => change !== null && change > 0)
      ? 'increase'
      : metricChanges.every((change) => change !== null && change < 0)
        ? 'decrease'
        : 'have an ambiguous effect on';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';
    return `This reform would ${signTerm} income inequality${regionPhrase}`;
  };

  // Recharts data
  const chartData = labels.map((label, i) => ({
    name: label,
    ...relativeBar(metricChanges[i], formatPer),
    hoverText: hoverMessage(label),
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

  // Enough decimals to write every tick exactly.
  const tickDigits = tickDecimals(yTicks.map((v) => v * 100));
  const yTickFormatter = (v: number) => {
    const rounded = (v * 100).toFixed(tickDigits);
    return `${trimAxisZeros ? Number(rounded) : rounded}%`;
  };
  const axisTitle = fitAxisTitle(['Relative change', 'Change (%)'], plotHeight);
  const yAxis = getYAxisLayout(yTicks, !!axisTitle, yTickFormatter);

  const barChart = (
    <BarChart data={chartData} margin={{ ...CHART_MARGIN, left: yAxis.marginLeft }}>
      {probe}
      <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
      <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} />
      <YAxis
        ticks={yTicks}
        domain={yDomain}
        tickFormatter={yTickFormatter}
        tick={RECHARTS_FONT_STYLE}
        tickLine={false}
        width={yAxis.yAxisWidth}
      >
        {axisTitle && (
          <Label
            value={axisTitle}
            angle={-90}
            position="center"
            dx={yAxis.labelDx}
            style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
          />
        )}
      </YAxis>
      <Tooltip content={<ImpactTooltip />} />
      <Bar dataKey="value" label={<ReportBarLabel data={chartData} layout={layout} />}>
        {chartData.map((entry, index) => (
          <Cell key={index} fill={entry.value < 0 ? colors.primary[500] : colors.gray[600]} />
        ))}
      </Bar>
    </BarChart>
  );

  const inequalityDescription = (
    <Text size="sm" c="dimmed">
      PolicyEngine reports income inequality based on the distribution of net income after taxes and
      transfers.
    </Text>
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
          <ChartExplanation compact={compact}>{inequalityDescription}</ChartExplanation>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename="inequality-impact.svg"
      csvFilename="inequality-impact.csv"
      csvData={getInequalityCsvRows(output)}
    >
      <Stack gap="sm">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {barChart}
        </ResponsiveContainer>
        <ChartWatermark />
        {inequalityDescription}
      </Stack>
    </ChartContainer>
  );
}
