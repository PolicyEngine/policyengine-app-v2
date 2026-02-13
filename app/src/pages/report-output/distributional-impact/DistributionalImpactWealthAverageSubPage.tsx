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
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import {
  downloadCsv,
  getClampedChartHeight,
  RECHARTS_FONT_STYLE,
  RECHARTS_WATERMARK,
} from '@/utils/chartUtils';
import { currencySymbol, formatCurrency, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function DistributionalImpactWealthAverageSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data - object with keys "1", "2", ..., "10"
  const decileAverage = output.wealth_decile?.average || {};

  // Convert to arrays for plotting
  const xArray = Object.keys(decileAverage);
  const yArray = Object.values(decileAverage);

  // Calculate precision for value display
  let yvaluePrecision = precision(yArray, 1);
  if (yvaluePrecision > 0) {
    yvaluePrecision = Math.max(2, yvaluePrecision);
  }

  // Formatter for currency display
  const formatCur = (y: number) =>
    formatCurrency(y, countryId, {
      minimumFractionDigits: yvaluePrecision,
      maximumFractionDigits: yvaluePrecision,
    });

  // Generate hover message
  const hoverMessage = (x: string, y: number) =>
    absoluteChangeMessage(
      'This reform',
      `the income of households in the ${ordinal(Number(x))} wealth decile`,
      y,
      0,
      formatCur
    );

  // Generate chart title
  const getChartTitle = () => {
    const averageChange = -output.budget.budgetary_impact / output.budget.households;
    const term1 = 'the net income of households';
    const term2 = formatCurrency(Math.abs(averageChange), countryId, {
      maximumFractionDigits: 0,
    });
    const signTerm = averageChange > 0 ? 'increase' : 'decrease';

    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (averageChange === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase} on average`;
    }
    return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = Object.entries(decileAverage).map(([key, value]) => [
      `Decile ${key}`,
      value.toString(),
    ]);
    downloadCsv(csvData, 'distributional-impact-wealth-average.csv');
  };

  // Transform data for Recharts
  const chartData = xArray.map((x, i) => ({
    name: x,
    value: yArray[i],
    label: formatCur(yArray[i]),
    hoverText: hoverMessage(x, yArray[i]),
  }));

  const prefix = currencySymbol(countryId);

  function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) {
      return null;
    }
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '8px 12px',
          maxWidth: 300,
        }}
      >
        <p style={{ fontWeight: 600, margin: 0 }}>Decile {data.name}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{data.hoverText}</p>
      </div>
    );
  }

  function BarLabel({ x, y, width, value, index }: any) {
    const entry = chartData[index];
    if (!entry) {
      return null;
    }
    return (
      <text
        x={x + width / 2}
        y={value >= 0 ? y - 4 : y + 16}
        textAnchor="middle"
        fontSize={12}
        fill={colors.gray[700]}
      >
        {entry.label}
      </text>
    );
  }

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} tickLine={false}>
              <Label
                value="Wealth decile"
                position="bottom"
                offset={10}
                style={RECHARTS_FONT_STYLE}
              />
            </XAxis>
            <YAxis
              tick={RECHARTS_FONT_STYLE}
              tickLine={false}
              tickFormatter={(v: number) => `${prefix}${v.toLocaleString()}`}
            >
              <Label
                value="Absolute change in net income"
                angle={-90}
                position="insideLeft"
                offset={0}
                style={{ ...RECHARTS_FONT_STYLE, textAnchor: 'middle' }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" label={<BarLabel />} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.value < 0 ? colors.gray[600] : colors.primary[500]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <img
          src={RECHARTS_WATERMARK.src}
          alt=""
          style={{
            display: 'block',
            marginLeft: 'auto',
            width: RECHARTS_WATERMARK.width,
            opacity: RECHARTS_WATERMARK.opacity,
          }}
        />

        <Text size="sm" c="dimmed">
          PolicyEngine reports net income as the income a household takes home in a year, after
          taxes and transfers. Wealth deciles contain an equal number of people (ranked by wealth).
        </Text>
      </Stack>
    </ChartContainer>
  );
}
