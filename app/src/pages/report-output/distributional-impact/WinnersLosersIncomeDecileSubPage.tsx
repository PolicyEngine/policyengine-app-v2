import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
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
  'Gain less than 5%': colors.primary.alpha[60],
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

export default function WinnersLosersIncomeDecileSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data
  const deciles = output.intra_decile.deciles;
  const all = output.intra_decile.all;
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
      y === 'All' ? 'Of all households,' : `Of households in the ${ordinal(y as any)} decile,`;
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
    const header = [
      'Decile',
      'Gain more than 5%',
      'Gain less than 5%',
      'No change',
      'Lose less than 5%',
      'Lose more than 5%',
    ];
    const data = [
      header,
      ...decileNumbers.map((decile) => [
        decile.toString(),
        deciles['Gain more than 5%'][decile - 1].toString(),
        deciles['Gain less than 5%'][decile - 1].toString(),
        deciles['No change'][decile - 1].toString(),
        deciles['Lose less than 5%'][decile - 1].toString(),
        deciles['Lose more than 5%'][decile - 1].toString(),
      ]),
      [
        'All',
        all['Gain more than 5%'].toString(),
        all['Gain less than 5%'].toString(),
        all['No change'].toString(),
        all['Lose less than 5%'].toString(),
        all['Lose more than 5%'].toString(),
      ],
    ];
    downloadCsv(data, 'winners-losers-income-decile.csv');
  };

  // Generate trace for a specific type and category
  const createTrace = (type: 'all' | 'decile', category: string) => {
    const hoverTitle = (y: string | number) => (y === 'All' ? 'All households' : `Decile ${y}`);

    const xArray =
      type === 'all'
        ? [all[category as keyof typeof all]]
        : deciles[category as keyof typeof deciles];
    const yArray = type === 'all' ? ['All'] : decileNumbers;

    return {
      x: xArray,
      y: yArray,
      xaxis: type === 'all' ? 'x' : 'x2',
      yaxis: type === 'all' ? 'y' : 'y2',
      type: 'bar' as const,
      name: LEGEND_TEXT_MAP[category],
      legendgroup: category,
      showlegend: type === 'decile',
      marker: {
        color: COLOR_MAP[category],
      },
      orientation: 'h' as const,
      text: xArray.map((value: number) => `${(value * 100).toFixed(0)}%`) as any,
      textposition: 'inside' as const,
      textangle: 0,
      customdata: xArray.map((x: number, i: number) => ({
        title: hoverTitle(yArray[i]),
        msg: hoverMessage(x, yArray[i].toString(), category),
      })) as any,
      hovertemplate: '<b>%{customdata.title}</b><br><br>%{customdata.msg}<extra></extra>',
    };
  };

  // Generate all traces (cartesian product of types and categories)
  const chartData = [];
  for (const type of ['all', 'decile'] as const) {
    for (const category of CATEGORIES) {
      chartData.push(createTrace(type, category));
    }
  }

  const layout = {
    height: mobile ? 300 : 450,
    barmode: 'stack',
    grid: {
      rows: 2,
      columns: 1,
    },
    yaxis: {
      title: { text: '' },
      tickvals: ['All'],
      domain: [0.91, 1] as [number, number],
    },
    xaxis: {
      title: { text: '' },
      tickformat: '.0%',
      anchor: 'y',
      matches: 'x2',
      showgrid: false,
      showticklabels: false,
      fixedrange: true,
    },
    xaxis2: {
      title: { text: 'Population share' },
      tickformat: '.0%',
      anchor: 'y2',
      fixedrange: true,
    },
    yaxis2: {
      title: { text: 'Income decile' },
      tickvals: decileNumbers,
      anchor: 'x2',
      domain: [0, 0.85] as [number, number],
    },
    showlegend: true,
    legend: {
      title: {
        text: 'Change in income<br />',
      },
      tracegroupgap: 10,
    },
    uniformtext: {
      mode: 'hide',
      minsize: mobile ? 7 : 10,
    },
    margin: {
      t: 0,
      b: 80,
      l: 40,
      r: 0,
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
          style={{ width: '100%', marginBottom: mobile ? 0 : 50 }}
        />

        {description}
      </Stack>
    </ChartContainer>
  );
}
