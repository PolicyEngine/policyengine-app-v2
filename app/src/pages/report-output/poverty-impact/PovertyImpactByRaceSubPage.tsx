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
import { ChartWatermark, ImpactBarLabel, ImpactTooltip } from '@/components/charts';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { relativeChangeMessage } from '@/utils/chartMessages';
import {
  downloadCsv,
  getClampedChartHeight,
  getNiceTicks,
  RECHARTS_FONT_STYLE,
} from '@/utils/chartUtils';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function PovertyImpactByRaceSubPage({ output }: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

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

  // CSV export handler
  const handleDownloadCsv = () => {
    const header = ['Race/Ethnicity', 'Baseline', 'Reform', 'Change'];
    const data = [
      header,
      ...povertyLabels.map((label) => {
        const key = labelToKey[label];
        const baseline = label === 'All' ? allImpact.all.baseline : raceImpact[key].baseline;
        const reform = label === 'All' ? allImpact.all.reform : raceImpact[key].reform;
        const change = reform / baseline - 1;
        return [label, baseline.toString(), reform.toString(), change.toString()];
      }),
    ];
    downloadCsv(data, 'poverty-impact-by-race.csv');
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

  // Description text
  const povertyMeasure =
    countryId === 'uk'
      ? 'absolute poverty before housing costs'
      : 'the Supplemental Poverty Measure';
  const unitTerm = countryId === 'uk' ? 'resource units' : 'households';
  const description = `PolicyEngine reports the impact to ${povertyMeasure}. The poverty rate is the population share in ${unitTerm} with net income (after taxes and transfers) below their poverty threshold.`;

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} />
            <YAxis
              ticks={yTicks}
              domain={[yTicks[0], yTicks[yTicks.length - 1]]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              tick={RECHARTS_FONT_STYLE}
            >
              <Label
                value="Relative change in poverty rate"
                angle={-90}
                position="insideLeft"
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
        </ResponsiveContainer>
        <ChartWatermark />

        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
    </ChartContainer>
  );
}
