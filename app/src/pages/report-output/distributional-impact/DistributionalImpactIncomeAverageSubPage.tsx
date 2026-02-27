import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { ChartContainer } from '@/components/ChartContainer';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegionsList } from '@/hooks/useStaticMetadata';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';
import { getDecileImpacts, getDerivedBudget } from '@/utils/economicImpactAccessors';
import { currencySymbol, formatCurrency, localeCode, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: EconomicImpactResponse;
}

export default function DistributionalImpactIncomeAverageSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const regions = useRegionsList(countryId);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data from v2 API response
  const decileData = getDecileImpacts(output);
  const xArray = decileData.map((d) => d.decile.toString());
  const yArray = decileData.map((d) => d.absolute_change ?? 0);

  // Calculate precision for value display
  let yvaluePrecision = precision(yArray, 1);
  if (yvaluePrecision > 0) {
    yvaluePrecision = Math.max(2, yvaluePrecision);
  }
  const ytickPrecision = precision(yArray.concat(0), 1);

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
      `the income of households in the ${ordinal(Number(x))} decile`,
      y,
      0,
      formatCur
    );

  // Generate chart title
  const getChartTitle = () => {
    const budget = getDerivedBudget(output);
    const averageChange = -budget.budgetaryImpact / budget.households;
    const term1 = 'the net income of households';
    const term2 = formatCurrency(Math.abs(averageChange), countryId, {
      maximumFractionDigits: 0,
    });
    const signTerm = averageChange > 0 ? 'increase' : 'decrease';

    const region = regionName(regions);
    const regionPhrase = region ? ` in ${region}` : '';

    if (averageChange === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase} on average`;
    }
    return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = decileData.map((d) => [
      `Decile ${d.decile}`,
      (d.absolute_change ?? 0).toString(),
    ]);
    downloadCsv(csvData, 'distributional-impact-income-average.csv');
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
      text: yArray.map(formatCur) as any,
      textangle: 0,
      customdata: xArray.map((x, i) => hoverMessage(x, yArray[i])) as any,
      hovertemplate: '<b>Decile %{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    xaxis: {
      title: { text: 'Income decile' },
      tickvals: decileData.map((d) => d.decile.toString()),
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Absolute change in household income' },
      tickprefix: currencySymbol(countryId),
      tickformat: `,.${ytickPrecision}f`,
      fixedrange: true,
    },
    showlegend: false,
    uniformtext: {
      mode: 'hide' as const,
      minsize: mobile ? 4 : 8,
    },
    margin: {
      t: 0,
      b: 80,
      l: 60,
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
