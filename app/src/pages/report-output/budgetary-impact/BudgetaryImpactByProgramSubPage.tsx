import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { CURRENT_YEAR } from '@/constants';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegionsList } from '@/hooks/useStaticMetadata';
import { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { DEFAULT_CHART_CONFIG, downloadCsv, getClampedChartHeight } from '@/utils/chartUtils';
import { currencySymbol, formatCurrencyAbbr, localeCode } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

interface ProgramBudgetItem {
  baseline: number;
  difference: number;
  reform: number;
}

export default function BudgetaryImpactByProgramSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const currentYear = parseInt(CURRENT_YEAR, 10);
  const regions = useRegionsList(countryId, currentYear);
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Check if detailed_budget exists (UK only feature)
  if (!output.detailed_budget || typeof output.detailed_budget !== 'object') {
    return (
      <Stack gap={spacing.md}>
        <Text size="lg" fw={500}>
          Detailed budgetary impact by program is not available for this report.
        </Text>
      </Stack>
    );
  }

  // Extract data
  const budgetaryImpact = output.budget.budgetary_impact;
  const detailedBudget = output.detailed_budget as Record<string, ProgramBudgetItem>;

  // Filter programs with non-zero difference and get labels
  const programs: Array<{ key: string; label: string; value: number }> = [];
  Object.entries(detailedBudget).forEach(([programKey, values]) => {
    if (values.difference !== 0) {
      const programLabel = variables[programKey]?.label || programKey;
      programs.push({
        key: programKey,
        label: programLabel,
        value: values.difference / 1e9, // Convert to billions
      });
    }
  });

  // If no programs with changes, show message
  if (programs.length === 0) {
    return (
      <Stack gap={spacing.md}>
        <Text size="lg" fw={500}>
          This reform has no impact on individual programs.
        </Text>
      </Stack>
    );
  }

  // Extract labels and values
  const labels = programs.map((p) => p.label);
  const values = programs.map((p) => p.value);

  // Add Total bar
  const labelsWithTotal = labels.concat(['Total']);
  const valuesWithTotal = values.concat([budgetaryImpact / 1e9]);

  // CSV export handler
  const handleDownloadCsv = () => {
    const csvData = [
      ['Program', 'Baseline', 'Reform', 'Difference'],
      ...programs.map((p) => {
        const item = detailedBudget[p.key];
        return [
          p.label,
          item.baseline.toString(),
          item.reform.toString(),
          item.difference.toString(),
        ];
      }),
    ];
    downloadCsv(csvData, 'budgetary-impact-by-program.csv');
  };

  // Format currency for display on bars
  const formatCur = (x: number) =>
    formatCurrencyAbbr(x, countryId, {
      maximumFractionDigits: 1,
    });

  // Generate hover message
  const hoverMessage = (label: string, yValue: number) => {
    const actualValue = yValue * 1e9;
    const obj =
      label === 'Total' ? 'the budget deficit' : `the ${label} program's budgetary impact`;
    const change = label === 'Total' ? -actualValue : actualValue;
    return absoluteChangeMessage('This reform', obj, change, 0, formatCur);
  };

  // Generate chart title
  const getChartTitle = () => {
    const term1 = 'the budget';
    const term2 = formatCurrencyAbbr(Math.abs(budgetaryImpact), countryId, {
      maximumFractionDigits: 1,
    });
    const signTerm = budgetaryImpact > 0 ? 'raise' : 'cost';

    const region = regionName(regions);
    const regionPhrase = region ? ` in ${region}` : '';

    if (budgetaryImpact === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase}`;
    }
    return `This reform would ${signTerm} ${term2}${regionPhrase}`;
  };

  // Chart configuration
  const chartData = [
    {
      x: labelsWithTotal,
      y: valuesWithTotal,
      type: 'waterfall' as const,
      orientation: 'v' as const,
      // 'relative' for all but the last, which is 'total'
      measure:
        valuesWithTotal.length > 1
          ? Array(valuesWithTotal.length - 1)
              .fill('relative')
              .concat(['total'])
          : undefined,
      text: valuesWithTotal.map((value) => formatCur(value * 1e9)) as any,
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
      customdata: labelsWithTotal.map((x, i) => hoverMessage(x, valuesWithTotal[i])) as any,
      hovertemplate: '<b>%{x}</b><br><br>%{customdata}<extra></extra>',
    },
  ];

  const layout = {
    xaxis: {
      title: { text: 'Program' },
      fixedrange: true,
    },
    yaxis: {
      title: { text: 'Budgetary impact (bn)' },
      tickprefix: currencySymbol(countryId),
      tickformat: ',.1f',
      fixedrange: true,
    },
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
      </Stack>
    </ChartContainer>
  );
}
