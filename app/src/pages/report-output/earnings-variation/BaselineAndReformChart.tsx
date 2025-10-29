import { useState } from 'react';
import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Radio, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { colors } from '@/designTokens';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { DEFAULT_CHART_CONFIG, DEFAULT_CHART_LAYOUT } from '@/utils/chartUtils';
import { localeCode } from '@/utils/formatters';
import { getValueFromHousehold } from '@/utils/householdValues';

interface Props {
  baseline: Household;
  baselineVariation: Household;
  reform: Household;
  reformVariation: Household;
  variableName: string;
  year: string;
}

type ViewMode = 'both' | 'absolute' | 'relative';

/**
 * Chart showing baseline vs reform with 3 view modes:
 * 1. Both lines side-by-side
 * 2. Absolute difference (reform - baseline)
 * 3. Relative difference ((reform - baseline) / baseline)
 */
export default function BaselineAndReformChart({
  baseline,
  baselineVariation,
  reform: _reform,
  reformVariation,
  variableName,
  year,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const mobile = useMediaQuery('(max-width: 768px)');
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  const variable = metadata.variables[variableName];
  if (!variable) {
    return <div>Variable not found</div>;
  }

  // Get variation data (401-point arrays)
  const baselineYValues = getValueFromHousehold(
    variableName,
    year,
    null,
    baselineVariation,
    metadata
  );
  const reformYValues = getValueFromHousehold(variableName, year, null, reformVariation, metadata);

  if (!Array.isArray(baselineYValues) || !Array.isArray(reformYValues)) {
    return <div>No variation data available</div>;
  }

  // Get current earnings for marker
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

  // Calculate differences
  const absoluteDiff = baselineYValues.map((b, i) => reformYValues[i] - b);
  const relativeDiff = baselineYValues.map((b, i) =>
    b !== 0 ? (reformYValues[i] - b) / Math.abs(b) : 0
  );

  // Render different charts based on view mode
  const renderChart = () => {
    if (viewMode === 'both') {
      const chartData = [
        {
          x: xValues,
          y: baselineYValues,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: colors.gray[600], width: 2 },
          name: 'Baseline',
          hovertemplate: '<b>Baseline</b><br>Earnings: %{x:$,.0f}<br>Value: %{y}<extra></extra>',
        },
        {
          x: xValues,
          y: reformYValues,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: colors.primary[500], width: 2 },
          name: 'Reform',
          hovertemplate: '<b>Reform</b><br>Earnings: %{x:$,.0f}<br>Value: %{y}<extra></extra>',
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
          config={{ ...DEFAULT_CHART_CONFIG, locale: localeCode(countryId) }}
          style={{ width: '100%' }}
        />
      );
    }

    if (viewMode === 'absolute') {
      const chartData = [
        {
          x: xValues,
          y: absoluteDiff,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: colors.primary[500], width: 2 },
          fill: 'tozeroy' as const,
          fillcolor: colors.primary[100],
          name: 'Absolute change',
          hovertemplate: '<b>Earnings: %{x:$,.0f}</b><br>Change: %{y}<extra></extra>',
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
          title: { text: `Change in ${variable.label}` },
          fixedrange: true,
        },
        showlegend: false,
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
          config={{ ...DEFAULT_CHART_CONFIG, locale: localeCode(countryId) }}
          style={{ width: '100%' }}
        />
      );
    }

    // viewMode === 'relative'
    const chartData = [
      {
        x: xValues,
        y: relativeDiff,
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: { color: colors.primary[500], width: 2 },
        fill: 'tozeroy' as const,
        fillcolor: colors.primary[100],
        name: 'Relative change',
        hovertemplate: '<b>Earnings: %{x:$,.0f}</b><br>Change: %{y:.1%}<extra></extra>',
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
        title: { text: `% change in ${variable.label}` },
        tickformat: '.1%',
        fixedrange: true,
      },
      showlegend: false,
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
        config={{ ...DEFAULT_CHART_CONFIG, locale: localeCode(countryId) }}
        style={{ width: '100%' }}
      />
    );
  };

  return (
    <Stack gap={spacing.md}>
      <Radio.Group value={viewMode} onChange={(value) => setViewMode(value as ViewMode)}>
        <Stack gap={spacing.xs}>
          <Radio value="both" label="Baseline and Reform" />
          <Radio value="absolute" label="Absolute Change" />
          <Radio value="relative" label="Relative Change" />
        </Stack>
      </Radio.Group>

      {renderChart()}
    </Stack>
  );
}
