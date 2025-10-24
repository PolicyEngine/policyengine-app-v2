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
import { DEFAULT_CHART_CONFIG, downloadCsv } from '@/utils/chartUtils';
import { formatPercent, localeCode, ordinal } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

// Category definitions and styling
const CATEGORIES = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
] as const;

const COLOR_MAP: Record<string, string> = {
  'Gain more than 5%': colors.primary[700],
  'Gain less than 5%': colors.primary[300],
  'No change': colors.gray[200],
  'Lose less than 5%': colors.gray[400],
  'Lose more than 5%': colors.gray[600],
};

const HOVER_TEXT_MAP: Record<string, string> = {
  'Gain more than 5%': 'gain more than 5% of',
  'Gain less than 5%': 'gain less than 5% of',
  'No change': 'neither gain nor lose',
  'Lose less than 5%': 'lose less than 5% of',
  'Lose more than 5%': 'lose more than 5% of',
};

const LEGEND_TEXT_MAP: Record<string, string> = {
  'Gain more than 5%': 'Gain more than 5%',
  'Gain less than 5%': 'Gain less than 5%',
  'No change': 'No change',
  'Lose less than 5%': 'Loss less than 5%',
  'Lose more than 5%': 'Loss more than 5%',
};

export default function WinnersLosersWealthDecileSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data
  const deciles = output.intra_wealth_decile.deciles;
  const all = output.intra_wealth_decile.all;
  const decileNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Generate hover message using wordwrap utility pattern
  const wordWrap = (text: string, width: number = 50): string => {
    // Simple word wrap - split by spaces and join with <br> when line gets too long
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      if (`${currentLine} ${word}`.length > width) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.join('<br>');
  };

  const hoverMessage = (x: number, y: string, category: string) => {
    const term1 =
      y === 'All'
        ? 'Of all households,'
        : `Of households in the ${ordinal(y as any)} wealth decile,`;
    const term2 = formatPercent(x, countryId, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const msg = `${term1} this reform would cause ${term2} of people to ${HOVER_TEXT_MAP[category]} their net income.`;
    return wordWrap(msg, 50);
  };

  // Generate chart title
  const getChartTitle = () => {
    const totalAhead = all['Gain more than 5%'] + all['Gain less than 5%'];
    const totalBehind = all['Lose more than 5%'] + all['Lose less than 5%'];
    const percent = (n: number) => formatPercent(n, countryId, { maximumFractionDigits: 0 });
    const totalAheadTerm = percent(totalAhead);
    const totalBehindTerm = percent(totalBehind);
    const objectTerm = 'the net income';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (totalAhead > 0 && totalBehind > 0) {
      return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase} and decrease it for ${totalBehindTerm}`;
    }
    if (totalAhead > 0) {
      return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase}`;
    }
    if (totalBehind > 0) {
      return `This reform would decrease ${objectTerm} for ${totalBehindTerm} of the population${regionPhrase}`;
    }
    return `This reform would have no effect on ${objectTerm} for the population${regionPhrase}`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const header = ['Wealth decile', ...CATEGORIES];
    const rows = [
      ...decileNumbers.map((d) => [
        d.toString(),
        ...CATEGORIES.map((cat) => deciles[d][cat].toString()),
      ]),
      ['All', ...CATEGORIES.map((cat) => all[cat].toString())],
    ];
    downloadCsv([header, ...rows], 'winners-losers-wealth-decile.csv');
  };

  // Prepare data for stacked bar chart
  const chartData = CATEGORIES.map((category) => ({
    x: [...decileNumbers.map((d) => d.toString()), 'All'],
    y: [...decileNumbers.map((d) => deciles[d][category]), all[category]],
    type: 'bar' as const,
    name: LEGEND_TEXT_MAP[category],
    marker: {
      color: COLOR_MAP[category],
    },
    customdata: [
      ...decileNumbers.map((d) => hoverMessage(deciles[d][category], d.toString(), category)),
      hoverMessage(all[category], 'All', category),
    ] as any,
    hovertemplate: '%{customdata}<extra></extra>',
  }));

  const layout = {
    height: mobile ? 400 : 600,
    barmode: 'stack' as const,
    xaxis: {
      title: { text: 'Wealth decile' },
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Population share' },
      tickformat: ',.0%',
      fixedrange: true,
    },
    legend: {
      orientation: mobile ? ('h' as const) : ('v' as const),
      yanchor: 'top',
      y: mobile ? -0.2 : 1,
      xanchor: mobile ? 'center' : 'left',
      x: mobile ? 0.5 : 1.02,
    },
    margin: {
      t: 0,
      b: mobile ? 120 : 80,
      r: mobile ? 0 : 200,
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
        The chart shows the distribution of winners and losers from the reform, grouped by wealth
        decile. Wealth deciles contain an equal number of people (ranked by wealth).
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
