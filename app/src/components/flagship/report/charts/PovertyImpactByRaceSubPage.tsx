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
import { categoryAxisProps } from '@/components/flagship/report/charts/categoryAxis';
import {
  rateChangeMessage,
  rateChangeTitle,
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
import { getPovertyByRaceCsvRows } from '@/pages/report-output/poverty-impact/povertyChartUtils';
import type { RootState } from '@/store';
import { getClampedChartHeight, getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

/** Margins around the plot; value labels stay inside it, so the top needs little. */
const CHART_MARGIN = { top: 12, right: 20, bottom: 20 };

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
  compact?: boolean;
}

export default function PovertyImpactByRaceSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
  compact = false,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  type RaceData = Record<string, { baseline: number; reform: number }>;
  const raceImpact: RaceData = (output.poverty_by_race as any)?.poverty || {};
  const allImpact = output.poverty.poverty;

  // Get all race keys dynamically
  const raceKeys = Object.keys(raceImpact).filter((key) => key !== 'all');
  // Each group's change; none for a group with no one in poverty before.
  const raceChanges = raceKeys.map((key) =>
    relativeChange(raceImpact[key].reform, raceImpact[key].baseline)
  );
  const totalPovertyChange = relativeChange(allImpact.all.reform, allImpact.all.baseline);

  const povertyChanges = [...raceChanges, totalPovertyChange];
  const povertyLabels = [
    ...raceKeys.map((key) => key.charAt(0).toUpperCase() + key.slice(1)),
    'All',
  ];
  const labelToKey: Record<string, string> = {
    ...Object.fromEntries(povertyLabels.slice(0, -1).map((label, i) => [label, raceKeys[i]])),
    All: 'all',
  };

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    const obj = `the percentage of ${x === 'All' ? 'people' : x.toLowerCase()} in poverty`;
    const key = labelToKey[x];
    const baseline = x === 'All' ? allImpact.all.baseline : raceImpact[key].baseline;
    const reform = x === 'All' ? allImpact.all.reform : raceImpact[key].reform;
    return rateChangeMessage(obj, baseline, reform, countryId, formatPer);
  };

  // Generate chart title
  const getChartTitle = () => {
    const region = regionName(metadata);
    const { baseline, reform } = allImpact.all;
    return rateChangeTitle(
      'the poverty rate',
      baseline,
      reform,
      countryId,
      region ? ` in ${region}` : ''
    );
  };

  // Recharts data
  const chartData = povertyLabels.map((label, i) => ({
    name: label,
    ...relativeBar(povertyChanges[i], formatPer),
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
  // Every group keeps its label on a narrow screen, wrapped to its slot.

  // Enough decimals that a 0.25% step does not read as 0.3%.
  const tickDigits = Math.max(1, tickDecimals(yTicks.map((v) => v * 100)));
  const yTickFormatter = (v: number) => `${(v * 100).toFixed(tickDigits)}%`;
  const axisTitle = fitAxisTitle(
    compact
      ? ['Poverty change (%)', 'Change (%)']
      : ['Relative change in poverty rate', 'Poverty change (%)', 'Change (%)'],
    plotHeight
  );
  const yAxis = getYAxisLayout(yTicks, !!axisTitle, yTickFormatter);

  // Description text
  const povertyMeasure =
    countryId === 'uk'
      ? 'absolute poverty before housing costs'
      : 'the Supplemental Poverty Measure';
  const unitTerm = countryId === 'uk' ? 'resource units' : 'households';
  const description = `PolicyEngine reports the impact to ${povertyMeasure}. The poverty rate is the population share in ${unitTerm} with net income (after taxes and transfers) below their poverty threshold.`;

  const barChart = (
    <BarChart data={chartData} margin={{ ...CHART_MARGIN, left: yAxis.marginLeft }}>
      {probe}
      <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
      <XAxis dataKey="name" {...categoryAxisProps(povertyLabels, plotWidth)} />
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

  const descriptionText = (
    <Text size="sm" c="dimmed">
      {description}
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
          <ChartExplanation compact={compact}>{descriptionText}</ChartExplanation>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename="poverty-impact-by-race.svg"
      csvFilename="poverty-impact-by-race.csv"
      csvData={getPovertyByRaceCsvRows(output)}
    >
      <Stack gap="sm">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {barChart}
        </ResponsiveContainer>
        <ChartWatermark />
        {descriptionText}
      </Stack>
    </ChartContainer>
  );
}
