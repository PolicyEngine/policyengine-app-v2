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
import { ChartWatermark, ImpactBarLabel, ImpactTooltip } from '@/components/charts';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens/colors';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { RootState } from '@/store';
import { relativeChangeMessage } from '@/utils/chartMessages';
import {
  getClampedChartHeight,
  getNiceTicks,
  getYAxisLayout,
  RECHARTS_FONT_STYLE,
} from '@/utils/chartUtils';
import { formatPercent, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
}

export default function InequalityImpactSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
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
  const metricChanges = [
    giniImpact.reform / giniImpact.baseline - 1,
    top10Impact.reform / top10Impact.baseline - 1,
    top1Impact.reform / top1Impact.baseline - 1,
  ];

  // Calculate precision for display
  const yvaluePrecision = Math.max(1, precision(metricChanges, 100));
  const ytickPrecision = precision(metricChanges.concat(0), 10);

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

    const change = reform / baseline - 1;
    return relativeChangeMessage('This reform', obj, change, 0.001, countryId, {
      baseline,
      reform,
      formatter,
    });
  };

  // Generate chart title
  const getChartTitle = () => {
    const signTerm =
      metricChanges[0] > 0 && metricChanges[1] > 0 && metricChanges[2] > 0
        ? 'increase'
        : metricChanges[0] < 0 && metricChanges[1] < 0 && metricChanges[2] < 0
          ? 'decrease'
          : 'have an ambiguous effect on';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';
    return `This reform would ${signTerm} income inequality${regionPhrase}`;
  };

  // Recharts data
  const chartData = labels.map((label, i) => ({
    name: label,
    value: metricChanges[i],
    label: (metricChanges[i] >= 0 ? '+' : '') + formatPer(metricChanges[i]),
    hoverText: hoverMessage(label),
  }));

  const values = chartData.map((d) => d.value);
  const yDomain: [number, number] = [Math.min(0, ...values), Math.max(0, ...values)];
  const yTicks = getNiceTicks(yDomain);

  const yTickFormatter = (v: number) => `${(v * 100).toFixed(ytickPrecision)}%`;
  const yAxis = getYAxisLayout(yTicks, true, yTickFormatter);

  const barChart = (
    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: yAxis.marginLeft }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} />
      <YAxis
        ticks={yTicks}
        domain={[yTicks[0], yTicks[yTicks.length - 1]]}
        tickFormatter={yTickFormatter}
        tick={RECHARTS_FONT_STYLE}
        tickLine={false}
        width={yAxis.yAxisWidth}
      >
        <Label
          value="Relative change"
          angle={-90}
          position="center"
          dx={yAxis.labelDx}
          style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
        />
      </YAxis>
      <Tooltip content={<ImpactTooltip />} />
      <Bar dataKey="value" label={<ImpactBarLabel data={chartData} />}>
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
          {inequalityDescription}
        </div>
      </div>
    );
  }

  return (
    <ChartContainer title={getChartTitle()} downloadFilename="inequality-impact.svg">
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
