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

export default function DeepPovertyImpactByGenderSubPage({ output }: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  const genderImpact = output.poverty_by_gender?.deep_poverty || {
    male: { baseline: 0, reform: 0 },
    female: { baseline: 0, reform: 0 },
  };
  const allImpact = output.poverty.deep_poverty;

  // Calculate changes for each gender
  const malePovertyChange = genderImpact.male.reform / genderImpact.male.baseline - 1;
  const femalePovertyChange = genderImpact.female.reform / genderImpact.female.baseline - 1;
  const totalPovertyChange = allImpact.all.reform / allImpact.all.baseline - 1;

  const povertyChanges = [malePovertyChange, femalePovertyChange, totalPovertyChange];
  const povertyLabels = ['Male', 'Female', 'All'];
  const labelToKey: Record<string, 'male' | 'female' | 'all'> = {
    Male: 'male',
    Female: 'female',
    All: 'all',
  };

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    const genderMap: Record<string, string> = { male: 'men', female: 'women' };
    const obj = `the percentage of ${
      x === 'All' ? 'people' : genderMap[x.toLowerCase()]
    } in deep poverty`;
    const key = labelToKey[x];
    const baseline =
      x === 'All' ? allImpact.all.baseline : genderImpact[key as 'male' | 'female'].baseline;
    const reform =
      x === 'All' ? allImpact.all.reform : genderImpact[key as 'male' | 'female'].reform;
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
    const objectTerm = 'the deep poverty rate';
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
    const header = ['Gender', 'Baseline', 'Reform', 'Change'];
    const data = [
      header,
      ...povertyLabels.map((label) => {
        const key = labelToKey[label];
        const baseline =
          label === 'All'
            ? allImpact.all.baseline
            : genderImpact[key as 'male' | 'female'].baseline;
        const reform =
          label === 'All' ? allImpact.all.reform : genderImpact[key as 'male' | 'female'].reform;
        const change = reform / baseline - 1;
        return [label, baseline.toString(), reform.toString(), change.toString()];
      }),
    ];
    downloadCsv(data, 'deep-poverty-impact-by-gender.csv');
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
  const description = `PolicyEngine reports the impact to ${povertyMeasure}. The deep poverty rate is the population share in ${unitTerm} with net income (after taxes and transfers) below half their poverty threshold.`;

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap="sm">
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
                value="Relative change in deep poverty rate"
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
