import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { relativeChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';
import { formatNumber, formatPercent, localeCode, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function PovertyImpactByAgeSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  const povertyImpact = output.poverty.poverty;

  // Calculate changes for each age group
  const childPovertyChange = povertyImpact.child.reform / povertyImpact.child.baseline - 1;
  const adultPovertyChange = povertyImpact.adult.reform / povertyImpact.adult.baseline - 1;
  const seniorPovertyChange = povertyImpact.senior.reform / povertyImpact.senior.baseline - 1;
  const totalPovertyChange = povertyImpact.all.reform / povertyImpact.all.baseline - 1;

  const povertyChanges = [
    childPovertyChange,
    adultPovertyChange,
    seniorPovertyChange,
    totalPovertyChange,
  ];
  const povertyLabels = ['Children', 'Working-age adults', 'Seniors', 'All'];
  const labelToKey: Record<string, keyof typeof povertyImpact> = {
    Children: 'child',
    'Working-age adults': 'adult',
    Seniors: 'senior',
    All: 'all',
  };

  // Calculate precision for display
  const yvaluePrecision = Math.max(1, precision(povertyChanges, 100));
  const ytickPrecision = precision(povertyChanges.concat(0), 10);

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: yvaluePrecision,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    const obj = `the percentage of ${x === 'All' ? 'people' : x.toLowerCase()} in poverty`;
    const baseline = povertyImpact[labelToKey[x]].baseline;
    const reform = povertyImpact[labelToKey[x]].reform;
    const change = reform / baseline - 1;
    return relativeChangeMessage('This reform', obj, change, 0.001, countryId, {
      baseline,
      reform,
      formatter: formatPer,
    });
  };

  // Generate chart title
  const getChartTitle = () => {
    const baseline = povertyImpact.all.baseline;
    const reform = povertyImpact.all.reform;
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
    const header = ['Age group', 'Baseline', 'Reform', 'Change'];
    const data = [
      header,
      ...povertyLabels.map((label) => {
        const baseline = povertyImpact[labelToKey[label]].baseline;
        const reform = povertyImpact[labelToKey[label]].reform;
        const change = reform / baseline - 1;
        return [label, baseline.toString(), reform.toString(), change.toString()];
      }),
    ];
    downloadCsv(data, 'poverty-impact-by-age.csv');
  };

  // Chart configuration
  const chartData = [
    {
      x: povertyLabels,
      y: povertyChanges,
      type: 'bar' as const,
      marker: {
        color: povertyChanges.map((value) => (value < 0 ? colors.primary[500] : colors.gray[600])),
      },
      text: povertyChanges.map((value) => (value >= 0 ? '+' : '') + formatPer(value)) as any,
      textangle: 0,
      customdata: povertyLabels.map(hoverMessage) as any,
      hovertemplate: '<b>%{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    yaxis: {
      title: { text: 'Relative change in poverty rate' },
      tickformat: `+,.${ytickPrecision}%`,
      fixedrange: true,
    },
    showlegend: false,
    uniformtext: {
      mode: 'hide',
      minsize: 8,
    },
    margin: {
      t: 0,
      b: 100,
      r: 0,
    },
  } as Partial<Layout>;

  // Description text
  const getDescription = () => {
    const term1 = 'The poverty rate is ';
    const term2 = `the population share in ${
      countryId === 'uk' ? 'resource units' : 'households'
    } with `;
    const term3 = 'net income (after taxes and transfers) below their poverty threshold.';
    const more = term1 + term2 + term3;

    if (countryId === 'uk') {
      return `PolicyEngine reports the impact to absolute poverty before housing costs. ${more}`;
    }
    return `PolicyEngine reports the impact to the Supplemental Poverty Measure. ${more}`;
  };

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <Plot
          data={chartData}
          layout={layout}
          config={{
            ...DEFAULT_CHART_CONFIG,
            locale: localeCode(countryId),
          }}
          style={{ width: '100%', height: chartHeight }}
        />

        <Text size="sm" c="dimmed">
          {getDescription()}
        </Text>
      </Stack>
    </ChartContainer>
  );
}
