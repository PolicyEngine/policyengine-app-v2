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
import { formatPercent, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
}

/**
 * Build a CSV-ready table for the relative distributional impact by income decile.
 * Columns: Decile, Relative change (%).
 */
export function buildDistributionalRelativeCsv(output: SocietyWideReportOutput): string[][] {
  const decileRelative = output.decile.relative;
  const rows: string[][] = [['Decile', 'Relative change (%)']];
  Object.keys(decileRelative)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((decile) => {
      rows.push([decile, (decileRelative[decile] * 100).toFixed(2)]);
    });
  return rows;
}

export default function DistributionalImpactIncomeRelativeSubPage({
  output,
  chartHeight: chartHeightProp,
  fillHeight = false,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = chartHeightProp ?? getClampedChartHeight(viewportHeight, mobile);

  // Extract data - object with keys "1", "2", ..., "10"
  const decileRelative = output.decile.relative;

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
    const obj = `the income of households in the ${ordinal(Number(x))} decile`;
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
    label: (yArray[i] >= 0 ? '+' : '') + formatPer(yArray[i]),
    hoverText: hoverMessage(x, yArray[i]),
  }));

  const values = chartData.map((d) => d.value);
  const yDomain: [number, number] = [Math.min(0, ...values), Math.max(0, ...values)];
  const yTicks = getNiceTicks(yDomain);

  const yTickFormatter = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
  const yAxis = getYAxisLayout(yTicks, true, yTickFormatter);

  // Description text
  const description = (
    <Text size="sm" c="dimmed">
      PolicyEngine sorts households into ten equally-populated groups according to their baseline{' '}
      {countryId === 'uk' ? 'equivalised' : 'equivalized'} household net income.
    </Text>
  );

  const barChart = (
    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: yAxis.marginLeft }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} tickLine={false}>
        <Label value="Income decile" position="bottom" offset={10} style={RECHARTS_FONT_STYLE} />
      </XAxis>
      <YAxis
        ticks={yTicks}
        domain={[yTicks[0], yTicks[yTicks.length - 1]]}
        tick={RECHARTS_FONT_STYLE}
        tickLine={false}
        tickFormatter={yTickFormatter}
        width={yAxis.yAxisWidth}
      >
        <Label
          value="Relative change in household income"
          angle={-90}
          position="center"
          dx={yAxis.labelDx}
          style={{ ...RECHARTS_FONT_STYLE, textAnchor: 'middle' }}
        />
      </YAxis>
      <ReferenceLine y={0} stroke={colors.gray[600]} strokeWidth={1} />
      <Tooltip content={<ImpactTooltip />} />
      <Bar dataKey="value" label={<ImpactBarLabel data={chartData} />} isAnimationActive={false}>
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
          {description}
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename="distributional-impact-income-relative.svg"
      csvData={() => buildDistributionalRelativeCsv(output)}
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
