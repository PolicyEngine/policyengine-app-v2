import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegionsList } from '@/hooks/useStaticMetadata';
import { relativeChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';
import { formatPercent, localeCode, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function DistributionalImpactIncomeRelativeSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const regions = useRegionsList(countryId);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data - object with keys "1", "2", ..., "10"
  const decileRelative = output.decile.relative;

  // Convert to arrays for plotting
  const xArray = Object.keys(decileRelative);
  const yArray = Object.values(decileRelative);

  // Calculate precision for value display
  const yvaluePrecision = Math.max(1, precision(yArray, 100));
  const ytickPrecision = precision(yArray.concat(0), 10);

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

    const region = regionName(regions);
    const regionPhrase = region ? ` in ${region}` : '';

    if (relativeChange === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase} on average`;
    }
    return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = [
      ['Income decile', 'Relative change'],
      ...Object.entries(decileRelative).map(([decile, relativeChange]) => [
        decile,
        relativeChange.toString(),
      ]),
    ];
    downloadCsv(csvData, 'distributional-impact-income-relative.csv');
  };

  // Chart configuration
  const chartData = [
    {
      x: xArray,
      y: yArray,
      type: 'bar' as const,
      marker: {
        color: yArray.map((value) => (value < 0 ? colors.gray[600] : colors.primary[500])),
      },
      text: yArray.map((value) => (value >= 0 ? '+' : '') + formatPer(value)) as any,
      textangle: 0,
      customdata: xArray.map((x, i) => hoverMessage(x, yArray[i])) as any,
      hovertemplate: '<b>Decile %{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    xaxis: {
      title: { text: 'Income decile' },
      tickvals: Object.keys(decileRelative),
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Relative change in household income' },
      tickformat: `+,.${ytickPrecision}%`,
      fixedrange: true,
    },
    showlegend: false,
    uniformtext: {
      mode: 'hide' as const,
      minsize: 8,
    },
    margin: {
      t: 0,
      b: 80,
      l: 80,
      r: 20,
    },
  } as Partial<Layout>;

  // Description text
  const description = (
    <Text size="sm" c="dimmed">
      PolicyEngine sorts households into ten equally-populated groups according to their baseline{' '}
      {countryId === 'uk' ? 'equivalised' : 'equivalized'} household net income.
    </Text>
  );

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

        {description}
      </Stack>
    </ChartContainer>
  );
}
