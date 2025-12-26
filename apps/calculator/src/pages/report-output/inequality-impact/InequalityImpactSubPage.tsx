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
import { formatPercent, localeCode, precision } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function InequalityImpactSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Extract data
  const giniImpact = output.inequality.gini;
  const top10Impact = output.inequality.top_10_pct_share;
  const top1Impact = output.inequality.top_1_pct_share;

  const labels = ['Gini index', 'Top 10% share', 'Top 1% share'];
  const metricChanges = [
    giniImpact.reform / giniImpact.baseline - 1,
    top10Impact.reform / top10Impact.baseline - 1,
    top1Impact.reform / top1Impact.baseline - 1,
  ];

  // Calculate precision for display
  const yvaluePrecision = Math.max(1, precision(metricChanges, 100));
  const ytickPrecision = precision(metricChanges.concat(0), 10);

  const formatPer = (n: number) =>
    formatPercent(n, countryId, {
      minimumFractionDigits: yvaluePrecision,
    });

  // Generate hover message
  const hoverMessage = (x: string) => {
    let obj: string;
    let baseline: number;
    let reform: number;
    let formatter: (n: number) => string;

    if (x === 'Gini index') {
      obj = 'the Gini index of net income';
      baseline = giniImpact.baseline;
      reform = giniImpact.reform;
      formatter = (n) => n.toFixed(3);
    } else if (x === 'Top 10% share') {
      obj = 'the share of total net income held by people in the top 10% of households';
      baseline = top10Impact.baseline;
      reform = top10Impact.reform;
      formatter = formatPer;
    } else {
      obj = 'the share of total net income held by people in the top 1% of households';
      baseline = top1Impact.baseline;
      reform = top1Impact.reform;
      formatter = formatPer;
    }

    const change = reform / baseline - 1;
    return relativeChangeMessage('This reform', obj, change, 0.001, countryId, {
      baseline,
      reform,
      formatter,
    });
  };

  // Generate chart title
  const getChartTitle = () => {
    // Impact is ambiguous if all three metrics are not the same sign (sign can be
    // -ive, zero or +ive). Impact is positive if all three metrics are +ive.
    // Impact is negative if all three metrics are -ive.
    const signTerm =
      metricChanges[0] > 0 && metricChanges[1] > 0 && metricChanges[2] > 0
        ? 'increase'
        : metricChanges[0] < 0 && metricChanges[1] < 0 && metricChanges[2] < 0
          ? 'decrease'
          : 'have an ambiguous effect on';
    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';
    return `This reform would ${signTerm} income inequality${regionPhrase}`;
  };

  // CSV export handler
  const handleDownloadCsv = () => {
    const header = ['Metric', 'Baseline', 'Reform', 'Change'];
    const baselineValues = [giniImpact.baseline, top10Impact.baseline, top1Impact.baseline];
    const reformValues = [giniImpact.reform, top10Impact.reform, top1Impact.reform];
    const data = [
      header,
      ...labels.map((label, index) => {
        const baseline = baselineValues[index];
        const reform = reformValues[index];
        const change = reform / baseline - 1;
        return [label, baseline.toString(), reform.toString(), change.toString()];
      }),
    ];
    downloadCsv(data, 'inequality-impact.csv');
  };

  // Chart configuration
  const chartData = [
    {
      x: labels,
      y: metricChanges,
      type: 'bar' as const,
      marker: {
        color: metricChanges.map((value) => (value < 0 ? colors.primary[500] : colors.gray[600])),
      },
      text: metricChanges.map((value) => (value >= 0 ? '+' : '') + formatPer(value)) as any,
      textangle: 0,
      customdata: labels.map(hoverMessage) as any,
      hovertemplate: '<b>%{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    xaxis: {
      title: { text: '' },
    },
    yaxis: {
      title: { text: 'Relative change' },
      tickformat: `,.${ytickPrecision}%`,
      fixedrange: true,
    },
    showlegend: false,
    uniformtext: {
      mode: 'hide',
      minsize: 12,
    },
    margin: {
      t: 0,
      b: 100,
      r: 0,
    },
  } as Partial<Layout>;

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
          PolicyEngine reports income inequality based on the distribution of net income after taxes
          and transfers.
        </Text>
      </Stack>
    </ChartContainer>
  );
}
