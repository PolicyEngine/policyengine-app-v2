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
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv } from '@/utils/chartUtils';
import { formatCurrencyAbbr, localeCode } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

export default function BudgetaryImpactSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Extract data
  const budgetaryImpact = output.budget.budgetary_impact;
  const spendingImpact = output.budget.benefit_spending_impact;
  const stateTaxImpact = output.budget.state_tax_revenue_impact;
  const taxImpact = output.budget.tax_revenue_impact - stateTaxImpact;

  // Labels - different for US vs other countries, and desktop vs mobile
  const desktopLabels = [
    'Federal tax revenues',
    'State and local income tax revenues',
    'Benefit spending',
    'Net impact',
  ];
  const mobileLabels = ['Federal taxes', 'State and local income taxes', 'Benefits', 'Net'];

  if (countryId !== 'us') {
    desktopLabels[0] = 'Tax revenues';
    mobileLabels[0] = 'Taxes';
  }

  const labelsBeforeFilter = mobile ? mobileLabels : desktopLabels;

  // Values in billions
  const valuesBeforeFilter = [
    taxImpact / 1e9,
    stateTaxImpact / 1e9,
    -spendingImpact / 1e9,
    budgetaryImpact / 1e9,
  ];

  // Filter out zero values
  const values = valuesBeforeFilter.filter((value) => value !== 0);
  const labels = labelsBeforeFilter.filter((_label, index) => valuesBeforeFilter[index] !== 0);

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = labels.map((label, i) => [label, values[i].toString()]);
    downloadCsv(csvData, 'budgetary-impact.csv');
  };

  // Format currency for display on bars
  const formatCur = (x: number) =>
    formatCurrencyAbbr(x, countryId, {
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (x: string, y: number) => {
    let yValue = y * 1e9;
    // If not tax revenues, negate
    if (!x.toLowerCase().includes('tax')) {
      yValue = -yValue;
    }
    const obj = x.toLowerCase().includes('tax')
      ? x.toLowerCase()
      : x.toLowerCase().includes('benefit')
        ? 'benefit spending'
        : 'the budget deficit';
    return absoluteChangeMessage('This reform', obj, yValue, 0, formatCur);
  };

  // Generate chart title
  const getChartTitle = () => {
    const term1 = 'the budget';
    const term2 = formatCurrencyAbbr(Math.abs(budgetaryImpact), countryId, {
      maximumFractionDigits: 1,
    });
    const signTerm = budgetaryImpact > 0 ? 'raise' : 'cost';

    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (budgetaryImpact === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase}`;
    }
    return `This reform would ${signTerm} ${term2}${regionPhrase}`;
  };

  // Chart configuration
  const chartData = [
    {
      x: labels,
      y: values,
      type: 'waterfall' as const,
      orientation: 'v' as const,
      // 'relative' for all but the last, which is 'total'
      measure:
        values.length > 1
          ? Array(values.length - 1)
              .fill('relative')
              .concat(['total'])
          : undefined,
      text: values.map((value) => formatCur(value * 1e9)) as any,
      textposition: 'inside' as const,
      increasing: { marker: { color: colors.primary[500] } },
      decreasing: { marker: { color: colors.gray[600] } },
      totals: {
        marker: {
          color: budgetaryImpact < 0 ? colors.gray[600] : colors.primary[500],
        },
      },
      connector: {
        line: {
          color: colors.gray[400],
          width: 2,
          dash: 'dot' as const,
        },
      },
      customdata: labels.map((x, i) => hoverMessage(x, values[i])) as any,
      hovertemplate: '<b>%{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    height: mobile ? 300 : 500,
    xaxis: {
      title: { text: '' },
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Budgetary impact (bn)' },
      tickformat: '$,.1f',
      fixedrange: true,
    },
    uniformtext: {
      mode: 'hide' as const,
      minsize: 12,
    },
    margin: {
      t: 0,
      b: 100,
      l: 80,
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
