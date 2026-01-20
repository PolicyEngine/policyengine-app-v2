import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdMetadataContext } from '@/hooks/useMetadata';
import type { Household } from '@/types/ingredients/Household';
import {
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_LAYOUT,
  getClampedChartHeight,
} from '@/utils/chartUtils';
import { currencySymbol, localeCode } from '@/utils/formatters';
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
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadataContext = useHouseholdMetadataContext();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  const variable = metadataContext.variables[variableName];
  if (!variable) {
    return <div>Variable not found</div>;
  }

  // Get variation data (401-point array)
  const yValues = getValueFromHousehold(variableName, year, null, baselineVariation, metadataContext);

  if (!Array.isArray(yValues)) {
    return <div>No variation data available</div>;
  }

  // Get current value at actual earnings
  const currentValue = getValueFromHousehold(
    variableName,
    year,
    null,
    baseline,
    metadataContext
  ) as number;

  // Get current earnings to show marker position
  const currentEarnings = getValueFromHousehold(
    'employment_income',
    year,
    null,
    baseline,
    metadataContext
  ) as number;

  // X-axis is earnings range
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
  const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);

  const symbol = currencySymbol(countryId);
  const chartData = [
    {
      x: xValues,
      y: yValues,
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: { color: colors.primary[500], width: 2 },
      name: 'Baseline',
      hovertemplate: `<b>Earnings: %{x:${symbol},.0f}</b><br>%{y}<extra></extra>`,
    },
    {
      x: [currentEarnings],
      y: [currentValue],
      type: 'scatter' as const,
      mode: 'markers' as const,
      marker: { color: colors.primary[500], size: 10 },
      name: 'Current',
      hovertemplate: `<b>Your current position</b><br>Earnings: %{x:${symbol},.0f}<br>%{y}<extra></extra>`,
    },
  ];

  const layout = {
    ...DEFAULT_CHART_LAYOUT,
    xaxis: {
      title: { text: 'Employment income' },
      tickprefix: currencySymbol(countryId),
      tickformat: ',.0f',
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
      style={{ width: '100%', height: chartHeight }}
    />
  );
}
