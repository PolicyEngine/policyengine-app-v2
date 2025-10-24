import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { relativeChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv } from '@/utils/chartUtils';
import { formatPercent, localeCode, ordinal, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function DistributionalImpactWealthRelativeSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data - object with keys "1", "2", ..., "10"
  const decileRelative = output.wealth_decile.relative;

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
    const obj = `the income of households in the ${ordinal(Number(x))} wealth decile`;
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

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = [
      ['Wealth decile', 'Relative change'],
      ...Object.entries(decileRelative).map(([decile, relativeChange]) => [
        decile,
        relativeChange.toString(),
      ]),
    ];
    downloadCsv(csvData, 'distributional-impact-wealth-relative.csv');
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
    height: mobile ? 300 : 500,
    xaxis: {
      title: { text: 'Wealth decile' },
      tickvals: Object.keys(decileRelative),
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Relative change in net income' },
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
      b: 80,
      r: 0,
    },
  } as Partial<Layout>;

  return (
    <Stack gap={spacing.md}>
      <Group justify="space-between" align="center">
        <Text
          size="lg"
          fw={500}
          style={{ marginBottom: 20, width: '100%', wordWrap: 'break-word' }}
        >
          {getChartTitle()}
        </Text>
        <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
          Download CSV
        </Button>
      </Group>

      <Text size="sm" c="dimmed">
        PolicyEngine reports net income as the income a household takes home in a year, after taxes
        and transfers. Wealth deciles contain an equal number of people (ranked by wealth).
      </Text>

      <Box>
        <Plot
          data={chartData}
          layout={layout}
          config={{
            ...DEFAULT_CHART_CONFIG,
            locale: localeCode(countryId),
          }}
          style={{ width: '100%' }}
        />
      </Box>
    </Stack>
  );
}
