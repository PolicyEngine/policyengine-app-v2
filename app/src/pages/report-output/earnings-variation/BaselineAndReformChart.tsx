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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartWatermark, TOOLTIP_STYLE } from '@/components/charts';
import { RadioGroup, RadioGroupItem, Stack } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { getClampedChartHeight, getNiceTicks, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
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

function EarningsTooltip({ active, payload, label, symbol }: any) {
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
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function PercentTooltip({ active, payload, label, symbol }: any) {
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
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);
  const variable = metadata.variables[variableName];

  const chartSeries = useMemo(() => {
    const baselineYValues = getValueFromHousehold(
      variableName,
      year,
      null,
      baselineVariation,
      metadata
    );
    const reformYValues = getValueFromHousehold(
      variableName,
      year,
      null,
      reformVariation,
      metadata
    );

    if (!Array.isArray(baselineYValues) || !Array.isArray(reformYValues)) {
      return null;
    }

    const firstPersonName = Object.keys(baseline.householdData?.people || {})[0];
    const currentEarnings = getValueFromHousehold(
      'employment_income',
      year,
      firstPersonName,
      baseline,
      metadata
    ) as number;

    const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
    const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);
    const absoluteDiff = baselineYValues.map(
      (baseValue, index) => reformYValues[index] - baseValue
    );
    const relativeDiff = baselineYValues.map((baseValue, index) =>
      baseValue !== 0 ? (reformYValues[index] - baseValue) / Math.abs(baseValue) : 0
    );
    const chartData = xValues.map((earnings, index) => ({
      earnings,
      baseline: baselineYValues[index],
      reform: reformYValues[index],
      absoluteDiff: absoluteDiff[index],
      relativeDiff: relativeDiff[index],
    }));
    const allBothValues = [...baselineYValues, ...reformYValues];

    return {
      absoluteDiff,
      absDiffTicks: getNiceTicks([Math.min(...absoluteDiff), Math.max(...absoluteDiff)]),
      baselineYValues,
      bothYTicks: getNiceTicks([Math.min(...allBothValues), Math.max(...allBothValues)]),
      chartData,
      maxEarnings,
      relDiffTicks: getNiceTicks([Math.min(...relativeDiff), Math.max(...relativeDiff)]),
      reformYValues,
      relativeDiff,
      xTicks: getNiceTicks([0, maxEarnings]),
    };
  }, [baseline, baselineVariation, countryId, metadata, reformVariation, variableName, year]);

  if (!variable) {
    return <div>Variable not found</div>;
  }

  if (!chartSeries) {
    return <div>No variation data available</div>;
  }

  const symbol = currencySymbol(countryId);

  const renderChart = () => {
    if (viewMode === 'both') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart
            data={chartSeries.chartData}
            margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="earnings"
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
              ticks={chartSeries.bothYTicks}
              domain={[
                chartSeries.bothYTicks[0],
                chartSeries.bothYTicks[chartSeries.bothYTicks.length - 1],
              ]}
              tick={RECHARTS_FONT_STYLE}
            >
              <Label
                value={variable.label}
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            </YAxis>
            <Tooltip content={<EarningsTooltip symbol={symbol} />} />
            <Legend verticalAlign="top" align="left" />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke={colors.gray[600]}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="reform"
              name="Reform"
              stroke={colors.primary[500]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (viewMode === 'absolute') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart
            data={chartSeries.chartData}
            margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="earnings"
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
              ticks={chartSeries.absDiffTicks}
              domain={[
                chartSeries.absDiffTicks[0],
                chartSeries.absDiffTicks[chartSeries.absDiffTicks.length - 1],
              ]}
              tick={RECHARTS_FONT_STYLE}
            >
              <Label
                value={`Change in ${variable.label}`}
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            </YAxis>
            <Tooltip content={<EarningsTooltip symbol={symbol} />} />
            <Area
              type="monotone"
              dataKey="absoluteDiff"
              name="Absolute change"
              stroke={colors.primary[500]}
              fill={colors.primary[500]}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart
          data={chartSeries.chartData}
          margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
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
            ticks={chartSeries.relDiffTicks}
            domain={[
              chartSeries.relDiffTicks[0],
              chartSeries.relDiffTicks[chartSeries.relDiffTicks.length - 1],
            ]}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          >
            <Label
              value={`% change in ${variable.label}`}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
            />
          </YAxis>
          <Tooltip content={<PercentTooltip symbol={symbol} />} />
          <Area
            type="monotone"
            dataKey="relativeDiff"
            name="Relative change"
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
    <Stack gap="md">
      <RadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <div className="tw:flex tw:gap-md tw:items-center">
          <div className="tw:flex tw:items-center tw:gap-xs">
            <RadioGroupItem value="both" id="ev-both" />
            <label htmlFor="ev-both">Baseline and reform</label>
          </div>
          <div className="tw:flex tw:items-center tw:gap-xs">
            <RadioGroupItem value="absolute" id="ev-absolute" />
            <label htmlFor="ev-absolute">Absolute change</label>
          </div>
          <div className="tw:flex tw:items-center tw:gap-xs">
            <RadioGroupItem value="relative" id="ev-relative" />
            <label htmlFor="ev-relative">Relative change</label>
          </div>
        </div>
      </RadioGroup>

      <div style={{ width: '100%', position: 'relative' }}>
        {renderChart()}
        <ChartWatermark />
      </div>
    </Stack>
  );
}
