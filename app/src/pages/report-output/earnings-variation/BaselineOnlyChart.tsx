import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mantine/hooks';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { DEFAULT_CHART_CONFIG, DEFAULT_CHART_LAYOUT } from '@/utils/chartUtils';
import { localeCode } from '@/utils/formatters';
import { getValueFromHousehold } from '@/utils/householdValues';

interface Props {
  baseline: Household;
  baselineVariation: Household;
  variableName: string;
  year: string;
}

/**
 * Chart showing baseline values across earnings range
 * Single line with marker at current earnings position
 */
export default function BaselineOnlyChart({
  baseline,
  baselineVariation,
  variableName,
  year,
}: Props) {
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  const variable = metadata.variables[variableName];
  if (!variable) {
    return <div>Variable not found</div>;
  }

  // Get variation data (401-point array)
  const yValues = getValueFromHousehold(variableName, year, null, baselineVariation, metadata);

  if (!Array.isArray(yValues)) {
    return <div>No variation data available</div>;
  }

  // Get current value at actual earnings
  const currentValue = getValueFromHousehold(
    variableName,
    year,
    null,
    baseline,
    metadata
  ) as number;

  // Get current earnings to show marker position
  const currentEarnings = getValueFromHousehold(
    'employment_income',
    year,
    null,
    baseline,
    metadata
  ) as number;

  // X-axis is earnings range
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
  const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);

  const chartData = [
    {
      x: xValues,
      y: yValues,
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: { color: colors.primary[500], width: 2 },
      name: 'Baseline',
      hovertemplate: '<b>Earnings: %{x:$,.0f}</b><br>%{y}<extra></extra>',
    },
    {
      x: [currentEarnings],
      y: [currentValue],
      type: 'scatter' as const,
      mode: 'markers' as const,
      marker: { color: colors.primary[700], size: 10 },
      name: 'Current',
      hovertemplate: '<b>Your current position</b><br>Earnings: %{x:$,.0f}<br>%{y}<extra></extra>',
    },
  ];

  const layout = {
    ...DEFAULT_CHART_LAYOUT,
    height: mobile ? 300 : 500,
    xaxis: {
      title: { text: 'Employment income' },
      tickformat: '$,.0f',
      fixedrange: true,
    },
    yaxis: {
      title: { text: variable.label },
      fixedrange: true,
    },
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      xanchor: 'left' as const,
      yanchor: 'top' as const,
    },
    margin: {
      t: 20,
      b: 80,
      l: 80,
      r: 20,
    },
  } as Partial<Layout>;

  return (
    <Plot
      data={chartData}
      layout={layout}
      config={{
        ...DEFAULT_CHART_CONFIG,
        locale: localeCode(countryId),
      }}
      style={{ width: '100%' }}
    />
  );
}
