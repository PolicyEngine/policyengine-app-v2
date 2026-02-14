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
import { Stack } from '@mantine/core';
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

interface WaterfallDatum {
  name: string;
  /** Invisible bar base (transparent, stacks below visible) */
  invisible: number;
  /** Visible bar height (always positive) */
  visible: number;
  /** Actual value (signed) for labels/tooltips */
  value: number;
  /** Pre-formatted label for display on bar */
  label: string;
  /** Hover text */
  hoverText: string;
  /** Whether this is the total bar */
  isTotal: boolean;
  /** Fill color for the bar */
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

/**
 * Custom bar label that renders the formatted value inside/above the bar
 */
function WaterfallBarLabel({ x, y, width, height, index, data }: any) {
  const entry: WaterfallDatum | undefined = data?.[index];
  if (!entry || x === undefined || y === undefined || width === undefined) {
    return null;
  }
  // Place label in the center of the visible bar
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

export default function BudgetaryImpactSubPage({ output }: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

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

  // Build waterfall chart data
  // Each bar has an invisible base + visible portion
  const chartData: WaterfallDatum[] = [];
  let runningTotal = 0;

  for (let i = 0; i < values.length; i++) {
    const isTotal = i === values.length - 1 && values.length > 1;
    const value = values[i];
    const isPositive = value >= 0;

    let invisible: number;
    if (isTotal) {
      // Total bar starts from zero
      invisible = isPositive ? 0 : value;
    } else {
      // Relative bars start from running total
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
      name: labels[i],
      invisible,
      visible: Math.abs(value),
      value,
      label: formatCur(value * 1e9),
      hoverText: hoverMessage(labels[i], value),
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
            {/* Invisible base bar (transparent) */}
            <Bar
              dataKey="invisible"
              stackId="waterfall"
              fill="transparent"
              isAnimationActive={false}
            />
            {/* Visible bar with per-cell coloring */}
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
