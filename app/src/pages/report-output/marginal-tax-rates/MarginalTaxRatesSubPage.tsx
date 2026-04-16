import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { ChartWatermark, TOOLTIP_STYLE } from '@/components/charts';
import { Group, RadioGroup, RadioGroupItem, Spinner, Stack, Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReportYear } from '@/hooks/useReportYear';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  getClampedChartHeight,
  getNiceTicks,
  getYAxisLayout,
  RECHARTS_FONT_STYLE,
} from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';
import {
  buildHouseholdVariationEarningsAxis,
  getHouseholdVariationIndexForEarnings,
  getHouseholdVariationMaxEarnings,
} from '@/utils/householdVariationAxes';
import { getValueFromHousehold } from '@/utils/householdValues';

interface Props {
  baseline: Household;
  reform: Household | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
  baselineVariation?: Household | null;
  reformVariation?: Household | null;
}

type ViewMode = 'both' | 'difference';
function MTRTooltip({ active, payload, label, symbol }: any) {

  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>
        Earnings: {symbol}
        {Number(label).toLocaleString()}
      </p>
      {payload.map((p: any) => (
        <p
          key={p.name}
          style={{ margin: '2px 0', fontSize: typography.fontSize.sm, color: p.stroke }}
        >
          {p.name}: {(Number(p.value) * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

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
  baselineVariation: providedBaselineVariation = null,
  reformVariation: providedReformVariation = null,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const normalizedReportYear = reportYear ?? '';
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);
  const baselineFocusPersonName = useMemo(
    () => getHeadOfHouseholdPersonName(baseline, normalizedReportYear),
    [baseline, normalizedReportYear]
  );
  const reformFocusPersonName = useMemo(
    () => (reform ? getHeadOfHouseholdPersonName(reform, normalizedReportYear) : null),
    [normalizedReportYear, reform]
  );

  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);
  const baselinePolicyData = useMemo(
    () => (baselinePolicy ? PolicyAdapter.toCreationPayload(baselinePolicy).data : {}),
    [baselinePolicy]
  );
  const reformPolicyData = useMemo(
    () => (reformPolicy ? PolicyAdapter.toCreationPayload(reformPolicy).data : {}),
    [reformPolicy]
  );
  const shouldFetchInternally = !providedBaselineVariation;

  const {
    data: baselineVariation,
    isLoading: baselineLoading,
    error: baselineError,
  } = useHouseholdVariation({
    householdId: simulations[0]?.populationId || 'baseline',
    policyId: simulations[0]?.policyId || 'baseline-policy',
    policyData: baselinePolicyData,
    year: normalizedReportYear,
    countryId,
    personName: baselineFocusPersonName,
    enabled:
      shouldFetchInternally && !!reportYear && !!simulations[0]?.populationId && !!baselinePolicy,
  });

  const {
    data: reformVariation,
    isLoading: reformLoading,
    error: reformError,
  } = useHouseholdVariation({
    householdId: simulations[1]?.populationId || 'reform',
    policyId: simulations[1]?.policyId || 'reform-policy',
    policyData: reformPolicyData,
    year: normalizedReportYear,
    countryId,
    personName: reformFocusPersonName ?? baselineFocusPersonName,
    enabled:
      shouldFetchInternally &&
      !!reportYear &&
      !!reform &&
      !!simulations[1]?.populationId &&
      !!reformPolicy,
  });

  const resolvedBaselineVariation = providedBaselineVariation ?? baselineVariation ?? null;
  const resolvedReformVariation = providedReformVariation ?? reformVariation ?? null;
  const chartSeries = useMemo(() => {
    if (
      !reportYear ||
      !resolvedBaselineVariation?.householdData?.people ||
      (reform && resolvedReformVariation && !resolvedReformVariation.householdData?.people)
    ) {
      return null;
    }

    const clipMTR = (values: number[]) => values.map((value) => Math.max(-2, Math.min(2, value)));
    const resolvedFocusPersonName =
      baselineFocusPersonName ??
      getHeadOfHouseholdPersonName(resolvedBaselineVariation, normalizedReportYear);
    const baselineMTR = getValueFromHousehold(
      'marginal_tax_rate',
      normalizedReportYear,
      resolvedFocusPersonName,
      resolvedBaselineVariation,
      metadata
    );
    const reformMTR =
      reform && resolvedReformVariation
        ? getValueFromHousehold(
            'marginal_tax_rate',
            normalizedReportYear,
            resolvedFocusPersonName,
            resolvedReformVariation,
            metadata
          )
        : null;

    if (!Array.isArray(baselineMTR)) {
      return null;
    }

    const baselineMTRClipped = clipMTR(baselineMTR);
    const reformMTRClipped = Array.isArray(reformMTR) ? clipMTR(reformMTR) : null;
    const currentEarnings = getValueFromHousehold(
      'employment_income',
      normalizedReportYear,
      resolvedFocusPersonName,
      baseline,
      metadata
    ) as number;
    const exactCurrentBaselineMTR = getValueFromHousehold(
      'marginal_tax_rate',
      normalizedReportYear,
      resolvedFocusPersonName,
      baseline,
      metadata
    );
    const exactCurrentReformMTR =
      reform && resolvedReformVariation
        ? getValueFromHousehold(
            'marginal_tax_rate',
            normalizedReportYear,
            resolvedFocusPersonName,
            reform,
            metadata
          )
        : null;
    const maxEarnings = getHouseholdVariationMaxEarnings(currentEarnings, countryId);
    const xValues = buildHouseholdVariationEarningsAxis(maxEarnings);
    const currentIndex = getHouseholdVariationIndexForEarnings(currentEarnings, maxEarnings);
    const mtrDifference = reformMTRClipped
      ? baselineMTRClipped.map((baseValue, index) => reformMTRClipped[index] - baseValue)
      : null;
    const chartData = xValues.map((earnings, index) => ({
      earnings,
      baseline: baselineMTRClipped[index],
      ...(reformMTRClipped && { reform: reformMTRClipped[index] }),
      ...(mtrDifference && { difference: mtrDifference[index] }),
    }));
    const diffValues = mtrDifference ? mtrDifference.filter((value) => value !== undefined) : [0];

    return {
      chartData,
      currentEarnings,
      currentBaselineMTR:
        typeof exactCurrentBaselineMTR === 'number'
          ? Math.max(-2, Math.min(2, exactCurrentBaselineMTR))
          : (baselineMTRClipped[currentIndex] ?? 0),
      currentReformMTR:
        typeof exactCurrentReformMTR === 'number'
          ? Math.max(-2, Math.min(2, exactCurrentReformMTR))
          : reformMTRClipped && reformMTRClipped[currentIndex] !== undefined
            ? reformMTRClipped[currentIndex]
            : null,
      diffTicks: getNiceTicks([Math.min(0, ...diffValues), Math.max(0, ...diffValues)]),
      maxEarnings,
      mtrDifference,
      mtrTicks: getNiceTicks([-2, 2]),
      reformMTRClipped,
      xTicks: getNiceTicks([0, maxEarnings]),
    };
  }, [
    baseline,
    countryId,
    metadata,
    normalizedReportYear,
    reform,
    reportYear,
    resolvedBaselineVariation,
    resolvedReformVariation,
  ]);

  const isLoading = shouldFetchInternally && (baselineLoading || (reform && reformLoading));

  if (!reportYear) {
    return (
      <Stack gap="md">
        <Text c="red">Error: Report year not available</Text>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Group className="tw:gap-sm tw:items-center">
        <Spinner size="sm" />
        <Text className="tw:text-sm">Loading marginal tax rates...</Text>
      </Group>
    );
  }

  if (baselineError) {
    return (
      <Stack gap="md">
        <Text c="red">Error loading baseline variation: {baselineError.message}</Text>
      </Stack>
    );
  }

  if (reform && reformError) {
    return (
      <Stack gap="md">
        <Text c="red">Error loading reform variation: {reformError.message}</Text>
      </Stack>
    );
  }

  if (!resolvedBaselineVariation || !resolvedBaselineVariation.householdData?.people) {
    return (
      <Stack gap="md">
        <Text c="red">No baseline variation data available</Text>
      </Stack>
    );
  }

  if (reform && resolvedReformVariation && !resolvedReformVariation.householdData?.people) {
    return (
      <Stack gap="md">
        <Text c="red">Invalid reform variation data</Text>
      </Stack>
    );
  }

  if (!chartSeries) {
    return (
      <Stack gap="md">
        <Text c="red">No marginal tax rate data available</Text>
      </Stack>
    );
  }

  const symbol = currencySymbol(countryId);
  const formatMTR = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatMTRTick = (value: number) => `${(value * 100).toFixed(0)}%`;
  const mtrYAxis = getYAxisLayout(chartSeries.mtrTicks, true, formatMTRTick);
  const diffYAxis = getYAxisLayout(chartSeries.diffTicks, true, formatMTR);
  const bothChartMargin = { top: 20, right: 20, bottom: 80, left: mtrYAxis.marginLeft };
  const diffChartMargin = { top: 20, right: 20, bottom: 80, left: diffYAxis.marginLeft };

  const renderChart = () => {
    if (!reform || !chartSeries.reformMTRClipped || viewMode === 'both') {
      const baselineStroke =
        reform && chartSeries.reformMTRClipped ? colors.gray[600] : colors.primary[500];
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartSeries.chartData} margin={bothChartMargin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="earnings"
              type="number"
              domain={[0, chartSeries.maxEarnings]}
              ticks={chartSeries.xTicks}
              tick={RECHARTS_FONT_STYLE}
              tickFormatter={(v: number) => `${symbol}${v.toLocaleString()}`}
            >
              <Label
                value="Employment income"
                position="bottom"
                offset={20}
                style={RECHARTS_FONT_STYLE}
              />
            </XAxis>
            <YAxis
              domain={[-2, 2]}
              ticks={chartSeries.mtrTicks}
              tick={RECHARTS_FONT_STYLE}
              tickFormatter={formatMTRTick}
              width={mtrYAxis.yAxisWidth}
            >
              <Label
                value="Marginal tax rate"
                angle={-90}
                position="center"
                dx={mtrYAxis.labelDx}
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            </YAxis>
            <Tooltip content={<MTRTooltip symbol={symbol} />} />
            <Legend verticalAlign="top" align="left" />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke={baselineStroke}
              strokeWidth={2}
              dot={false}
            />
            {reform && chartSeries.reformMTRClipped && (
              <Line
                type="monotone"
                dataKey="reform"
                name="Reform"
                stroke={colors.primary[500]}
                strokeWidth={2}
                dot={false}
              />
            )}
            <ReferenceDot
              x={chartSeries.currentEarnings}
              y={chartSeries.currentBaselineMTR}
              r={5}
              fill={baselineStroke}
              stroke={colors.background.primary}
              strokeWidth={2}
              ifOverflow="visible"
            />
            {reform && chartSeries.currentReformMTR !== null && (
              <ReferenceDot
                x={chartSeries.currentEarnings}
                y={chartSeries.currentReformMTR}
                r={5}
                fill={colors.primary[500]}
                stroke={colors.background.primary}
                strokeWidth={2}
                ifOverflow="visible"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (!chartSeries.mtrDifference) {
      return null;
    }

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={chartSeries.chartData} margin={diffChartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
            type="number"
            domain={[0, chartSeries.maxEarnings]}
            ticks={chartSeries.xTicks}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(v: number) => `${symbol}${v.toLocaleString()}`}
          >
            <Label
              value="Employment income"
              position="bottom"
              offset={20}
              style={RECHARTS_FONT_STYLE}
            />
          </XAxis>
          <YAxis
            ticks={chartSeries.diffTicks}
            domain={[
              chartSeries.diffTicks[0],
              chartSeries.diffTicks[chartSeries.diffTicks.length - 1],
            ]}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={formatMTR}
            width={diffYAxis.yAxisWidth}
          >
            <Label
              value="Change in marginal tax rate"
              angle={-90}
              position="center"
              dx={diffYAxis.labelDx}
              style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
            />
          </YAxis>
          <Tooltip content={<MTRTooltip symbol={symbol} />} />
          <Area
            type="monotone"
            dataKey="difference"
            name="MTR Difference"
            stroke={colors.primary[500]}
            fill={colors.primary[500]}
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        Marginal tax rates show the percentage of the next dollar earned that goes to taxes. Values
        are clipped to the range -200% to +200% for display purposes.
      </Text>

      {reform && (
        <RadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <div className="tw:flex tw:gap-md tw:items-center">
            <div className="tw:flex tw:items-center tw:gap-xs">
              <RadioGroupItem value="both" id="mtr-both" />
              <label htmlFor="mtr-both">Baseline and reform</label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-xs">
              <RadioGroupItem value="difference" id="mtr-difference" />
              <label htmlFor="mtr-difference">Difference</label>
            </div>
          </div>
        </RadioGroup>
      )}

      <div style={{ width: '100%', position: 'relative' }}>
        {renderChart()}
        <ChartWatermark />
      </div>
    </Stack>
  );
}
