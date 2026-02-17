import { useState } from 'react';
import type { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Group, Radio, Stack, Text } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { convertParametersToPolicyJson } from '@/adapters/conversionHelpers';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import { useHouseholdMetadataContext } from '@/hooks/useMetadata';
import { useReportYear } from '@/hooks/useReportYear';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_LAYOUT,
  getClampedChartHeight,
} from '@/utils/chartUtils';
import { currencySymbol, localeCode } from '@/utils/formatters';
import { getValueFromHousehold } from '@/utils/householdValues';
import LoadingPage from '../LoadingPage';

interface Props {
  baseline: Household;
  reform: Household | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
}

type ViewMode = 'both' | 'difference';

/**
 * Marginal Tax Rates page
 * Shows MTR across earnings range with special Y-axis clipping to -200% to +200%
 * Hardcoded to marginal_tax_rate variable (no selector)
 */
export default function MarginalTaxRatesSubPage({
  baseline,
  reform,
  simulations,
  policies,
  userPolicies: _userPolicies,
  households: _households,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const mobile = useMediaQuery('(max-width: 768px)');
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const metadataContext = useHouseholdMetadataContext();
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Early return if no report year available (shouldn't happen in report output context)
  if (!reportYear) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error: Report year not available</Text>
      </Stack>
    );
  }

  // Get policy data for variations
  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);

  // Convert policies to API format for calculate-full endpoint
  const baselinePolicyData = baselinePolicy
    ? convertParametersToPolicyJson(baselinePolicy.parameters || [])
    : {};
  const reformPolicyData = reformPolicy
    ? convertParametersToPolicyJson(reformPolicy.parameters || [])
    : {};

  // Fetch baseline variation
  const {
    data: baselineVariation,
    isLoading: baselineLoading,
    error: baselineError,
  } = useHouseholdVariation({
    householdId: simulations[0]?.populationId || 'baseline',
    policyId: simulations[0]?.policyId || 'baseline-policy',
    policyData: baselinePolicyData,
    year: reportYear,
    countryId,
    enabled: !!simulations[0]?.populationId && !!baselinePolicy,
  });

  // Fetch reform variation (if reform exists)
  const {
    data: reformVariation,
    isLoading: reformLoading,
    error: reformError,
  } = useHouseholdVariation({
    householdId: simulations[1]?.populationId || 'reform',
    policyId: simulations[1]?.policyId || 'reform-policy',
    policyData: reformPolicyData,
    year: reportYear,
    countryId,
    enabled: !!reform && !!simulations[1]?.populationId && !!reformPolicy,
  });

  // Show loading if either query is still loading
  const isLoading = baselineLoading || (reform && reformLoading);

  if (isLoading) {
    return <LoadingPage message="Loading marginal tax rates..." />;
  }

  if (baselineError) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error loading baseline variation: {baselineError.message}</Text>
      </Stack>
    );
  }

  if (reform && reformError) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error loading reform variation: {reformError.message}</Text>
      </Stack>
    );
  }

  // Verify baseline data exists and has required structure
  if (!baselineVariation || !baselineVariation.householdData?.people) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">No baseline variation data available</Text>
      </Stack>
    );
  }

  // If reform exists, verify reform data has required structure
  if (reform && reformVariation && !reformVariation.householdData?.people) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Invalid reform variation data</Text>
      </Stack>
    );
  }

  // Get MTR data (401-point arrays)
  // Use first person's MTR (matches V1 behavior) - MTR should not be aggregated across people
  const firstPersonName = Object.keys(baselineVariation.householdData?.people || {})[0];

  const baselineMTR = getValueFromHousehold(
    'marginal_tax_rate',
    reportYear,
    firstPersonName,
    baselineVariation,
    metadataContext
  );

  const reformMTR =
    reform && reformVariation
      ? getValueFromHousehold(
          'marginal_tax_rate',
          reportYear,
          firstPersonName,
          reformVariation,
          metadataContext
        )
      : null;

  if (!Array.isArray(baselineMTR)) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">No marginal tax rate data available</Text>
      </Stack>
    );
  }

  // Clip values to -200% to +200% range (per V1 implementation)
  const clipMTR = (values: number[]) => values.map((v) => Math.max(-2, Math.min(2, v)));

  const baselineMTRClipped = clipMTR(baselineMTR);
  const reformMTRClipped = reformMTR ? clipMTR(reformMTR as number[]) : null;

  // Get current earnings for marker (first person only)
  const firstPersonNameBaseline = Object.keys(baseline.householdData?.people || {})[0];

  const currentEarnings = getValueFromHousehold(
    'employment_income',
    reportYear,
    firstPersonNameBaseline,
    baseline,
    metadataContext
  ) as number;

  // Get current MTR (first person only)
  const currentMTR = getValueFromHousehold(
    'marginal_tax_rate',
    reportYear,
    firstPersonNameBaseline,
    baseline,
    metadataContext
  ) as number;

  // X-axis is earnings range
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
  const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);

  // Calculate difference if reform exists
  const mtrDifference = reformMTRClipped
    ? baselineMTRClipped.map((b, i) => reformMTRClipped[i] - b)
    : null;

  const renderChart = () => {
    if (!reform || !reformMTRClipped || viewMode === 'both') {
      const symbol = currencySymbol(countryId);
      const chartData: any[] = [
        {
          x: xValues,
          y: baselineMTRClipped,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: colors.gray[600], width: 2 },
          name: 'Baseline',
          hovertemplate: `<b>Earnings: %{x:${symbol},.0f}</b><br>MTR: %{y:.1%}<extra></extra>`,
        },
      ];

      if (reform && reformMTRClipped) {
        chartData.push({
          x: xValues,
          y: reformMTRClipped,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: colors.primary[500], width: 2 },
          name: 'Reform',
          hovertemplate: `<b>Earnings: %{x:${symbol},.0f}</b><br>MTR: %{y:.1%}<extra></extra>`,
        });
      } else {
        // Add current MTR marker for single mode
        chartData.push({
          x: [currentEarnings],
          y: [Math.max(-2, Math.min(2, currentMTR))],
          type: 'scatter' as const,
          mode: 'markers' as const,
          marker: { color: colors.primary[500], size: 10 },
          name: 'Current',
          hovertemplate: `<b>Your current position</b><br>Earnings: %{x:${symbol},.0f}<br>MTR: %{y:.1%}<extra></extra>`,
        });
      }

      const layout = {
        ...DEFAULT_CHART_LAYOUT,
        xaxis: {
          title: { text: 'Employment income' },
          tickprefix: currencySymbol(countryId),
          tickformat: ',.0f',
          fixedrange: true,
        },
        yaxis: {
          title: { text: 'Marginal tax rate' },
          tickformat: '.0%',
          range: [-2, 2],
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
          style={{ width: '100%', height: chartHeight }}
        />
      );
    }

    // Difference view
    // This branch is only reachable when reform exists and mtrDifference is not null
    if (!mtrDifference) {
      return null;
    }

    const symbol = currencySymbol(countryId);
    const chartData = [
      {
        x: xValues,
        y: mtrDifference,
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: { color: colors.primary[500], width: 2 },
        fill: 'tozeroy' as const,
        fillcolor: colors.primary.alpha[60],
        name: 'MTR Difference',
        hovertemplate: `<b>Earnings: %{x:${symbol},.0f}</b><br>Change: %{y:.1%}<extra></extra>`,
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
        title: { text: 'Change in marginal tax rate' },
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
        style={{ width: '100%', height: chartHeight }}
      />
    );
  };

  return (
    <Stack gap={spacing.lg}>
      <Text size="sm" c="dimmed">
        Marginal tax rates show the percentage of the next dollar earned that goes to taxes. Values
        are clipped to the range -200% to +200% for display purposes.
      </Text>

      {reform && (
        <Radio.Group value={viewMode} onChange={(value) => setViewMode(value as ViewMode)}>
          <Group gap={spacing.md}>
            <Radio value="both" label="Baseline and Reform" />
            <Radio value="difference" label="Difference" />
          </Group>
        </Radio.Group>
      )}

      {renderChart()}
    </Stack>
  );
}
