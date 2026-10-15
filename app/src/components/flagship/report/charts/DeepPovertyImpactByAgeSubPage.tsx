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
import { tooltipText } from '@/libs/flagship/tooltipText';
import { getPovertyByAgeCsvRows } from '@/pages/report-output/poverty-impact/povertyChartUtils';
import type { RootState } from '@/store';
import { getClampedChartHeight, getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

/** Margins around the plot; value labels stay inside it, so the top needs little. */
const CHART_MARGIN = { top: 12, right: 20, bottom: 20 };
/** The short name a compact card shows, and any chart where the full one does not fit. */
const AGE_SHORT_NAMES: Record<string, string> = { 'Working-age adults': 'Adults' };

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
  compact?: boolean;
}

export default function DeepPovertyImpactByAgeSubPage({
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
  const deepPovertyImpact = output.poverty.deep_poverty;

  const povertyLabels = ['Children', 'Working-age adults', 'Seniors', 'All'];
  const labelToKey: Record<string, keyof typeof deepPovertyImpact> = {
    Children: 'child',
    'Working-age adults': 'adult',
    Seniors: 'senior',
    All: 'all',
  };
  // Each age group's change; none for a group with no one in deep poverty before.
  const povertyChanges = povertyLabels.map((label) => {
    const { baseline, reform } = deepPovertyImpact[labelToKey[label]];
    return relativeChange(reform, baseline);
  });

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    const obj = `the percentage of ${x === 'All' ? 'people' : x.toLowerCase()} in deep poverty`;
    const { baseline, reform } = deepPovertyImpact[labelToKey[x]];
    return rateChangeMessage(obj, baseline, reform, countryId, formatPer);
  };

  // Generate chart title
  const getChartTitle = () => {
    const region = regionName(metadata);
    const { baseline, reform } = deepPovertyImpact.all;
    return rateChangeTitle(
      'the deep poverty rate',
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
    hoverText: tooltipText(hoverMessage(label)),
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
  const yTickFormatter = (v: number) => `${(v * 100).toFixed(tickDigits)}%`;
  const axisTitle = fitAxisTitle(
    compact
      ? ['Deep poverty change (%)', 'Change (%)']
      : ['Relative change in deep poverty rate', 'Deep poverty change (%)', 'Change (%)'],
    plotHeight
  );
  const yAxis = getYAxisLayout(yTicks, !!axisTitle, yTickFormatter);

  // Description text
  const povertyMeasure =
    countryId === 'uk'
      ? 'absolute poverty before housing costs'
      : 'the Supplemental Poverty Measure';
  const unitTerm = countryId === 'uk' ? 'resource units' : 'households';
  const description = `PolicyEngine reports the impact to ${povertyMeasure}. The deep poverty rate is the population share in ${unitTerm} with net income (after taxes and transfers) below half their poverty threshold.`;

  const barChart = (
    <BarChart data={chartData} margin={{ ...CHART_MARGIN, left: yAxis.marginLeft }}>
      {probe}
      <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
      <XAxis
        dataKey="name"
        {...categoryAxisProps(povertyLabels, plotWidth, {
          shortNames: AGE_SHORT_NAMES,
          preferShort: compact,
        })}
      />
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
      <ReferenceLine y={0} stroke={colors.gray[600]} strokeWidth={1} />
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
      downloadFilename="deep-poverty-impact-by-age.svg"
      csvFilename="deep-poverty-impact-by-age.csv"
      csvData={getPovertyByAgeCsvRows(output, 'deep_poverty')}
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
