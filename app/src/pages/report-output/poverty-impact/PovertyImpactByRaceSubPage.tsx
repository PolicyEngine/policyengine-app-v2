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
import { formatNumber, formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
  chartHeight?: number;
  fillHeight?: boolean;
}

/** CSV for Poverty impact by race. Dynamic race keys. */
export function buildPovertyByRaceCsv(output: SocietyWideReportOutput): string[][] {
  type RaceData = Record<string, { baseline: number; reform: number }>;
  const raceImpact: RaceData = (output.poverty_by_race as any)?.poverty || {};
  const allImpact = output.poverty.poverty;
  const header = ['Race', 'Baseline rate (%)', 'Reform rate (%)', 'Relative change (%)'];
  const rows: string[][] = [header];
  for (const key of Object.keys(raceImpact).filter((k) => k !== 'all')) {
    const b = raceImpact[key];
    const rel = b.baseline === 0 ? 0 : b.reform / b.baseline - 1;
    rows.push([
      key.charAt(0).toUpperCase() + key.slice(1),
      (b.baseline * 100).toFixed(2),
      (b.reform * 100).toFixed(2),
      (rel * 100).toFixed(2),
    ]);
  }
  const all = allImpact.all;
  const rel = all.baseline === 0 ? 0 : all.reform / all.baseline - 1;
  rows.push([
    'All',
    (all.baseline * 100).toFixed(2),
    (all.reform * 100).toFixed(2),
    (rel * 100).toFixed(2),
  ]);
  return rows;
}

export default function PovertyImpactByRaceSubPage({
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
  type RaceData = Record<string, { baseline: number; reform: number }>;
  const raceImpact: RaceData = (output.poverty_by_race as any)?.poverty || {};
  const allImpact = output.poverty.poverty;

  // Get all race keys dynamically
  const raceKeys = Object.keys(raceImpact).filter((key) => key !== 'all');
  const raceChanges = raceKeys.map((key) => {
    const data = raceImpact[key];
    return data.reform / data.baseline - 1;
  });
  const totalPovertyChange = allImpact.all.reform / allImpact.all.baseline - 1;

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
    const change = reform / baseline - 1;
    return relativeChangeMessage('This reform', obj, change, 0.001, countryId, {
      baseline,
      reform,
      formatter: formatPer,
    });
  };

  // Generate chart title
  const getChartTitle = () => {
    const baseline = allImpact.all.baseline;
    const reform = allImpact.all.reform;
    const relativeChange = reform / baseline - 1;
    const absoluteChange = Math.round(Math.abs(reform - baseline) * 1000) / 10;
    const objectTerm = 'the poverty rate';
    const relTerm = formatPercent(Math.abs(relativeChange), countryId, {
      maximumFractionDigits: 1,
    });
    const absTerm = formatNumber(absoluteChange, countryId, {
      maximumFractionDigits: 2,
    });
    const term2 = `${relTerm} (${absTerm}pp)`;
    const signTerm = relativeChange > 0 ? 'increase' : 'decrease';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (absTerm === '0') {
      return `This reform would have no effect on ${objectTerm}${regionPhrase}`;
    }
    return `This reform would ${signTerm} ${objectTerm}${regionPhrase} by ${term2}`;
  };

  // Recharts data
  const chartData = povertyLabels.map((label, i) => ({
    name: label,
    value: povertyChanges[i],
    label: (povertyChanges[i] >= 0 ? '+' : '') + formatPer(povertyChanges[i]),
    hoverText: hoverMessage(label),
  }));

  const values = chartData.map((d) => d.value);
  const yDomain: [number, number] = [Math.min(0, ...values), Math.max(0, ...values)];
  const yTicks = getNiceTicks(yDomain);

  const yTickFormatter = (v: number) => `${(v * 100).toFixed(1)}%`;
  const yAxis = getYAxisLayout(yTicks, true, yTickFormatter);

  // Description text
  const povertyMeasure =
    countryId === 'uk'
      ? 'absolute poverty before housing costs'
      : 'the Supplemental Poverty Measure';
  const unitTerm = countryId === 'uk' ? 'resource units' : 'households';
  const description = `PolicyEngine reports the impact to ${povertyMeasure}. The poverty rate is the population share in ${unitTerm} with net income (after taxes and transfers) below their poverty threshold.`;

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
          value="Relative change in poverty rate"
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
          {descriptionText}
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      title={getChartTitle()}
      downloadFilename="poverty-impact-by-race.svg"
      csvData={() => buildPovertyByRaceCsv(output)}
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
