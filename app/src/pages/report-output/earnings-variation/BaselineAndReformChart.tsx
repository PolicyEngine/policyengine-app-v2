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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Group, Radio, Stack } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { ChartWatermark, TOOLTIP_STYLE } from '@/components/charts';
import { colors } from '@/designTokens';
import { spacing } from '@/designTokens/spacing';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
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
      <p style={{ fontWeight: 600, margin: 0 }}>
        Earnings: {symbol}
        {Number(label).toLocaleString()}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: 13, color: p.stroke }}>
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
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

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

  const symbol = currencySymbol(countryId);

  const chartData = xValues.map((x, i) => ({
    earnings: x,
    baseline: baselineYValues[i],
    reform: reformYValues[i],
    absoluteDiff: absoluteDiff[i],
    relativeDiff: relativeDiff[i],
  }));

  const xTicks = getNiceTicks([0, maxEarnings]);
  const allBothValues = [...baselineYValues, ...reformYValues];
  const bothYTicks = getNiceTicks([Math.min(...allBothValues), Math.max(...allBothValues)]);
  const absDiffTicks = getNiceTicks([Math.min(...absoluteDiff), Math.max(...absoluteDiff)]);
  const relDiffTicks = getNiceTicks([Math.min(...relativeDiff), Math.max(...relativeDiff)]);

  // Render different charts based on view mode
  const renderChart = () => {
    if (viewMode === 'both') {
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
              ticks={bothYTicks}
              domain={[bothYTicks[0], bothYTicks[bothYTicks.length - 1]]}
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
              ticks={absDiffTicks}
              domain={[absDiffTicks[0], absDiffTicks[absDiffTicks.length - 1]]}
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

    // viewMode === 'relative'
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
            ticks={relDiffTicks}
            domain={[relDiffTicks[0], relDiffTicks[relDiffTicks.length - 1]]}
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
    <Stack gap={spacing.md}>
      <Radio.Group value={viewMode} onChange={(value) => setViewMode(value as ViewMode)}>
        <Group gap={spacing.md}>
          <Radio value="both" label="Baseline and Reform" />
          <Radio value="absolute" label="Absolute Change" />
          <Radio value="relative" label="Relative Change" />
        </Group>
      </Radio.Group>

      <div style={{ width: '100%', position: 'relative' }}>
        {renderChart()}
        <ChartWatermark />
      </div>
    </Stack>
  );
}
