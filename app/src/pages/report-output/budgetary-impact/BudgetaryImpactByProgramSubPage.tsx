import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { ChartWatermark, TOOLTIP_STYLE } from '@/components/charts';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import { absoluteChangeMessage } from '@/utils/chartMessages';
import { downloadCsv, getClampedChartHeight, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { currencySymbol, formatCurrencyAbbr } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface Props {
  output: SocietyWideReportOutput;
}

interface ProgramBudgetItem {
  baseline: number;
  difference: number;
  reform: number;
}

interface WaterfallDatum {
  name: string;
  invisible: number;
  visible: number;
  value: number;
  label: string;
  hoverText: string;
  isTotal: boolean;
  fill: string;
}

function WaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const data = payload[0].payload as WaterfallDatum;
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 300 }}>
      <p style={{ fontWeight: 600, margin: 0 }}>{data.name}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{data.hoverText}</p>
    </div>
  );
}

function WaterfallBarLabel({ x, y, width, height, index, data }: any) {
  const entry: WaterfallDatum | undefined = data?.[index];
  if (!entry || x === undefined || y === undefined || width === undefined) {
    return null;
  }
  const labelY = y + height / 2;
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fill="#fff"
      fontWeight={500}
    >
      {entry.label}
    </text>
  );
}

export default function BudgetaryImpactByProgramSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const variables = metadata.variables;
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
  Object.entries(detailedBudget).forEach(([programKey, programValues]) => {
    if (programValues.difference !== 0) {
      const programLabel = variables[programKey]?.label || programKey;
      programs.push({
        key: programKey,
        label: programLabel,
        value: programValues.difference / 1e9, // Convert to billions
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

    const region = regionName(metadata);
    const regionPhrase = region ? ` in ${region}` : '';

    if (budgetaryImpact === 0) {
      return `This reform would have no effect on ${term1}${regionPhrase}`;
    }
    return `This reform would ${signTerm} ${term2}${regionPhrase}`;
  };

  // Build waterfall chart data
  const chartData: WaterfallDatum[] = [];
  let runningTotal = 0;

  for (let i = 0; i < valuesWithTotal.length; i++) {
    const isTotal = i === valuesWithTotal.length - 1;
    const value = valuesWithTotal[i];
    const isPositive = value >= 0;

    let invisible: number;
    if (isTotal) {
      invisible = isPositive ? 0 : value;
    } else {
      invisible = isPositive ? runningTotal : runningTotal + value;
    }

    const fill = isTotal
      ? budgetaryImpact < 0
        ? colors.gray[600]
        : colors.primary[500]
      : isPositive
        ? colors.primary[500]
        : colors.gray[600];

    chartData.push({
      name: labelsWithTotal[i],
      invisible,
      visible: Math.abs(value),
      value,
      label: formatCur(value * 1e9),
      hoverText: hoverMessage(labelsWithTotal[i], value),
      isTotal,
      fill,
    });

    if (!isTotal) {
      runningTotal += value;
    }
  }

  const symbol = currencySymbol(countryId);

  return (
    <ChartContainer title={getChartTitle()} onDownloadCsv={handleDownloadCsv}>
      <Stack gap={spacing.sm}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} />
            <YAxis
              tick={RECHARTS_FONT_STYLE}
              tickFormatter={(v: number) => `${symbol}${v.toFixed(1)}`}
            >
              <Label
                value="Budgetary impact (bn)"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            </YAxis>
            <Tooltip content={<WaterfallTooltip />} />
            <Bar
              dataKey="invisible"
              stackId="waterfall"
              fill="transparent"
              isAnimationActive={false}
            />
            <Bar
              dataKey="visible"
              stackId="waterfall"
              isAnimationActive={false}
              label={<WaterfallBarLabel data={chartData} />}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartWatermark />
      </Stack>
    </ChartContainer>
  );
}
