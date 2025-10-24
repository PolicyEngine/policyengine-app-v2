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
import { formatCurrencyAbbr, formatPercent, localeCode, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function CliffImpactSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data - cliff_impact can be null if not computed
  const cliffImpact = output.cliff_impact;

  // Handle null case
  if (!cliffImpact || !cliffImpact.baseline || !cliffImpact.reform) {
    return (
      <Stack gap={spacing.md}>
        <Text size="lg" fw={500}>
          Cliff impact data not available
        </Text>
        <Text size="sm" c="dimmed">
          Cliff impact analysis is not available for this reform. This may occur if the calculation
          is still processing or if the data is not yet available.
        </Text>
      </Stack>
    );
  }

  // Calculate changes with rounding (matching v1 logic)
  const cliffShareChange =
    Math.round((cliffImpact.reform.cliff_share / cliffImpact.baseline.cliff_share - 1) * 10000) /
    10000;
  const cliffGapChange =
    Math.round((cliffImpact.reform.cliff_gap / cliffImpact.baseline.cliff_gap - 1) * 1000) / 1000;

  const xArray = ['Cliff rate', 'Cliff gap'];
  const yArray = [cliffShareChange, cliffGapChange];

  // Calculate precision for display
  const yvaluePrecision = Math.max(1, precision(yArray, 100));
  const ytickPrecision = precision(yArray.concat(0), 10);

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: yvaluePrecision,
    });

  const formatCur = (n: number) =>
    formatCurrencyAbbr(n, countryId, {
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    const baseline =
      x === 'Cliff rate' ? cliffImpact.baseline.cliff_share : cliffImpact.baseline.cliff_gap;
    const reform =
      x === 'Cliff rate' ? cliffImpact.reform.cliff_share : cliffImpact.reform.cliff_gap;
    const change = reform / baseline - 1;
    const formatter = x === 'Cliff rate' ? formatPer : formatCur;
    const tolerance = 0.0001;
    const baselineReformTerm = ` from ${formatter(baseline)} to ${formatter(reform)}`;
    const objectTerm = x.toLowerCase();
    const signTerm =
      change > tolerance
        ? `increase ${objectTerm} by ${formatPer(change) + baselineReformTerm}`
        : change > 0
          ? `increase ${objectTerm} by less than ${formatPer(tolerance)}`
          : change < -tolerance
            ? `decrease ${objectTerm} by ${formatPer(-change) + baselineReformTerm}`
            : change < 0
              ? `decrease ${objectTerm} by less than ${formatPer(tolerance)}`
              : `have no effect on ${objectTerm}`;
    return `This reform would ${signTerm}`;
  };

  // Generate chart title
  const getChartTitle = () => {
    const signTerm =
      cliffShareChange === 0 && cliffGapChange === 0
        ? "wouldn't affect cliffs"
        : cliffShareChange >= 0 && cliffGapChange >= 0
          ? 'would make cliffs more prevalent'
          : cliffShareChange <= 0 && cliffGapChange <= 0
            ? 'would make cliffs less prevalent'
            : 'would have an ambiguous effect on cliffs';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';
    return `This reform ${signTerm}${regionPhrase}`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const header = ['Metric', 'Baseline', 'Reform', 'Change'];
    const data = [
      header,
      [
        'Cliff rate',
        cliffImpact.baseline.cliff_share.toString(),
        cliffImpact.reform.cliff_share.toString(),
        cliffShareChange.toString(),
      ],
      [
        'Cliff gap',
        cliffImpact.baseline.cliff_gap.toString(),
        cliffImpact.reform.cliff_gap.toString(),
        cliffGapChange.toString(),
      ],
    ];
    downloadCsv(data, 'cliff-impact.csv');
  };

  // Get currency symbol
  const getCurrency = () => {
    return countryId === 'uk' ? '£' : '$';
  };

  // Chart configuration
  const chartData = [
    {
      x: xArray,
      y: yArray,
      type: 'bar' as const,
      marker: {
        color: [
          cliffShareChange > 0 ? colors.gray[600] : colors.primary[500],
          cliffGapChange > 0 ? colors.gray[600] : colors.primary[500],
        ],
      },
      text: [
        (cliffShareChange >= 0 ? '+' : '') + formatPer(cliffShareChange),
        (cliffGapChange >= 0 ? '+' : '') + formatPer(cliffGapChange),
      ],
      textposition: 'auto' as const,
      textangle: 0,
      customdata: xArray.map(hoverMessage),
      hovertemplate: '<b>%{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ] as any;

  const layout = {
    height: mobile ? 300 : 450,
    yaxis: {
      title: { text: 'Relative change' },
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
        The cliff rate is the share of households whose net income falls if each adult earned an
        additional {getCurrency()}1,000. The cliff gap is the sum of the losses incurred by all
        households on a cliff if their income rose in this way.{' '}
        <a
          href="https://policyengine.org/us/research/how-would-reforms-affect-cliffs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read more about how PolicyEngine models the effect of reforms on cliffs.
        </a>
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
