import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem, Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
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
import { getClampedChartHeight, getNiceTicks, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
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

function MTRTooltip({ active, payload, label, symbol }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: 600, margin: 0 }}>
        Earnings: {symbol}
        {Number(label).toLocaleString()}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: 13, color: p.stroke }}>
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
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  // Early return if no report year available (shouldn't happen in report output context)
  if (!reportYear) {
    return (
      <Stack gap="md">
        <Text c="red">Error: Report year not available</Text>
      </Stack>
    );
  }

  // Get policy data for variations
  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);

  // Convert policies to API format
  const baselinePolicyData = baselinePolicy
    ? PolicyAdapter.toCreationPayload(baselinePolicy).data
    : {};
  const reformPolicyData = reformPolicy ? PolicyAdapter.toCreationPayload(reformPolicy).data : {};

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

  // Verify baseline data exists and has required structure
  if (!baselineVariation || !baselineVariation.householdData?.people) {
    return (
      <Stack gap="md">
        <Text c="red">No baseline variation data available</Text>
      </Stack>
    );
  }

  // If reform exists, verify reform data has required structure
  if (reform && reformVariation && !reformVariation.householdData?.people) {
    return (
      <Stack gap="md">
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
    metadata
  );

  const reformMTR =
    reform && reformVariation
      ? getValueFromHousehold(
          'marginal_tax_rate',
          reportYear,
          firstPersonName,
          reformVariation,
          metadata
        )
      : null;

  if (!Array.isArray(baselineMTR)) {
    return (
      <Stack gap="md">
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
    metadata
  ) as number;

  // Get current MTR (first person only)
  const currentMTR = getValueFromHousehold(
    'marginal_tax_rate',
    reportYear,
    firstPersonNameBaseline,
    baseline,
    metadata
  ) as number;

  // X-axis is earnings range
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
  const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);

  // Calculate difference if reform exists
  const mtrDifference = reformMTRClipped
    ? baselineMTRClipped.map((b, i) => reformMTRClipped[i] - b)
    : null;

  const symbol = currencySymbol(countryId);

  const chartData = xValues.map((x, i) => ({
    earnings: x,
    baseline: baselineMTRClipped[i],
    ...(reformMTRClipped && { reform: reformMTRClipped[i] }),
    ...(mtrDifference && { difference: mtrDifference[i] }),
  }));

  const xTicks = getNiceTicks([0, maxEarnings]);
  const mtrTicks = getNiceTicks([-2, 2]);
  const diffValues = mtrDifference ? mtrDifference.filter((v) => v !== undefined) : [0];
  const diffTicks = getNiceTicks([Math.min(0, ...diffValues), Math.max(0, ...diffValues)]);

  const renderChart = () => {
    if (!reform || !reformMTRClipped || viewMode === 'both') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 80, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="earnings"
              ticks={xTicks}
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
              ticks={mtrTicks}
              tick={RECHARTS_FONT_STYLE}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            >
              <Label
                value="Marginal tax rate"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            </YAxis>
            <Tooltip content={<MTRTooltip symbol={symbol} />} />
            <Legend verticalAlign="top" align="left" />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke={colors.gray[600]}
              strokeWidth={2}
              dot={false}
            />
            {reform && reformMTRClipped && (
              <Line
                type="monotone"
                dataKey="reform"
                name="Reform"
                stroke={colors.primary[500]}
                strokeWidth={2}
                dot={false}
              />
            )}
            {!reform && (
              <ReferenceDot
                x={currentEarnings}
                y={Math.max(-2, Math.min(2, currentMTR))}
                r={5}
                fill={colors.primary[500]}
                stroke={colors.primary[500]}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Difference view
    // This branch is only reachable when reform exists and mtrDifference is not null
    if (!mtrDifference) {
      return null;
    }

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 80, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
            ticks={xTicks}
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
            ticks={diffTicks}
            domain={[diffTicks[0], diffTicks[diffTicks.length - 1]]}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          >
            <Label
              value="Change in marginal tax rate"
              angle={-90}
              position="insideLeft"
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
