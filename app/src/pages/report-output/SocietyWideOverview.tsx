import { useEffect, useMemo, useState } from 'react';
import {
  IconChartBar,
  IconCoin,
  IconHome,
  IconMap,
  IconScale,
  IconUsers,
} from '@tabler/icons-react';
import Plot from 'react-plotly.js';
import { Box, Group, Progress, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DashboardCard from '@/components/report/DashboardCard';
import MetricCard from '@/components/report/MetricCard';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
import { currencySymbol } from '@/utils/formatters';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import DistributionalImpactIncomeAverageSubPage from './distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from './distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from './distributional-impact/WinnersLosersIncomeDecileSubPage';
import InequalityImpactSubPage from './inequality-impact/InequalityImpactSubPage';
import DeepPovertyImpactByAgeSubPage from './poverty-impact/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from './poverty-impact/DeepPovertyImpactByGenderSubPage';
import PovertyImpactByAgeSubPage from './poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from './poverty-impact/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from './poverty-impact/PovertyImpactByRaceSubPage';

interface SocietyWideOverviewProps {
  output: SocietyWideReportOutput;
  showCongressionalCard?: boolean;
}

// Fixed size for icon containers to ensure square aspect ratio
const HERO_ICON_SIZE = 48;
const SECONDARY_ICON_SIZE = 36;

const GRID_GAP = 16;

// Expanded card chart heights — derived from the layout:
//
//   Expanded card outer: SHRUNKEN_CARD_HEIGHT × 2 + GRID_GAP = 416px
//   Card border: 2px (1px each side)
//   Card padding (spacing.lg = 16px): 32px → content area = 382px
//
//   Controls row (height: 31px, matching SegmentedControl xs rendered height
//   of ~30.6px — see SegmentedControl.css: root padding 4px + label padding
//   2px + font 12px × 1.55 line-height + label padding 2px + root padding 4px)
//   + marginBottom 8px = 39px total
//
//   → expandedContent area = 382 − 39 = 343px (secondary cards)
//   → expandedContent area = 374 − 39 = 335px (budget card, spacing.xl = 20px)
//
//   ChartContainer chrome: title row (~28px) + gap (8px) + Box padding (24px)
//   + Box border (2px) = 62px.  Secondary charts also have a description line
//   (~19px) and an inner gap (8px) = 27px extra inside the Box.
//
//   Target Box content height ≈ 279 for all chart cards:
//     Budget  (no description):  chartHeight = 279
//     Secondary (with desc+gap): chartHeight = 279 − 27 = 252
//
const CONTROLS_ROW_H = 39; // 31 (SC xs height) + 8 (marginBottom)
const BUDGET_CHART_H = 279;
const SECONDARY_CHART_H = 252;

// Poverty segmented control types and options
type PovertyDepth = 'regular' | 'deep';
type PovertyBreakdown = 'by-age' | 'by-gender' | 'by-race';

const POVERTY_DEPTH_OPTIONS = [
  { label: 'Regular poverty', value: 'regular' as PovertyDepth },
  { label: 'Deep poverty', value: 'deep' as PovertyDepth },
];

function getBreakdownOptions(
  depth: PovertyDepth,
  countryId: string
): Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> {
  const options: Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> = [
    { label: 'By age', value: 'by-age' },
    { label: 'By gender', value: 'by-gender' },
  ];
  if (countryId === 'us') {
    options.push({
      label: 'By race',
      value: 'by-race',
      disabled: depth === 'deep',
    });
  }
  return options;
}

const segmentedControlStyles = {
  root: {
    background: colors.gray[100],
    borderRadius: spacing.radius.md,
  },
  indicator: {
    background: colors.white,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};


type DecileMode = 'absolute' | 'relative';
const DECILE_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as DecileMode },
  { label: 'Relative', value: 'relative' as DecileMode },
];

// Mini chart config for shrunken decile card
const MINI_CHART_HEIGHT = 90;
const MINI_CHART_CONFIG = { displayModeBar: false, responsive: true, staticPlot: true };

type CongressionalMode = 'absolute' | 'relative';
const CONGRESSIONAL_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as CongressionalMode },
  { label: 'Relative', value: 'relative' as CongressionalMode },
];

type CardKey = 'budget' | 'decile' | 'poverty' | 'winners' | 'inequality' | 'congressional';

/**
 * Congressional district card content — must be rendered inside a
 * CongressionalDistrictDataProvider. Auto-starts fetching on mount.
 */
function CongressionalDistrictCard({
  output,
  mode,
  zIndex,
  gridGap,
  header,
  onToggleMode,
}: {
  output: SocietyWideReportOutput;
  mode: 'expanded' | 'shrunken';
  zIndex: number;
  gridGap: number;
  header: React.ReactNode;
  onToggleMode: () => void;
}) {
  const {
    stateResponses,
    completedCount,
    totalStates,
    hasStarted,
    isLoading,
    labelLookup,
    stateCode,
    startFetch,
  } = useCongressionalDistrictData();
  const [congressionalMode, setCongressionalMode] = useState<CongressionalMode>('absolute');

  // Auto-start fetch on mount
  useEffect(() => {
    if (!hasStarted) {
      startFetch();
    }
  }, [hasStarted, startFetch]);

  // Check if output already has district data (from nationwide calculation)
  const existingDistricts = useMemo(() => {
    if (!('congressional_district_impact' in output)) {
      return null;
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData?.districts) {
      return null;
    }
    return districtData.districts;
  }, [output]);

  // Build map data from context (progressive fill as states complete)
  const contextMapData = useMemo(() => {
    if (stateResponses.size === 0) {
      return [];
    }
    const points: Array<{ geoId: string; label: string; value: number }> = [];
    stateResponses.forEach((stateData) => {
      stateData.districts.forEach((district) => {
        points.push({
          geoId: district.district,
          label: labelLookup.get(district.district) ?? `District ${district.district}`,
          value:
            congressionalMode === 'absolute'
              ? district.average_household_income_change
              : district.relative_household_income_change,
        });
      });
    });
    return points;
  }, [stateResponses, labelLookup, congressionalMode]);

  // Use pre-computed data if available, otherwise progressive context data
  const mapData = useMemo(() => {
    if (existingDistricts) {
      return existingDistricts.map((item) => ({
        geoId: item.district,
        label: labelLookup.get(item.district) ?? `District ${item.district}`,
        value:
          congressionalMode === 'absolute'
            ? item.average_household_income_change
            : item.relative_household_income_change,
      }));
    }
    return contextMapData;
  }, [existingDistricts, contextMapData, labelLookup, congressionalMode]);

  // Map config based on absolute vs relative mode
  const mapConfig = useMemo(
    () => ({
      colorScale: {
        colors: DIVERGING_GRAY_TEAL.colors,
        tickFormat: congressionalMode === 'absolute' ? '$,.0f' : '.1%',
        symmetric: true,
      },
      formatValue: (value: number) =>
        congressionalMode === 'absolute'
          ? formatParameterValue(value, 'currency-USD', {
              decimalPlaces: 0,
              includeSymbol: true,
            })
          : formatParameterValue(value, '/1', { decimalPlaces: 1 }),
    }),
    [congressionalMode]
  );

  // Count districts gaining and losing (from whichever data source is available)
  const { gainingCount, losingCount } = useMemo(() => {
    let gaining = 0;
    let losing = 0;
    if (existingDistricts) {
      for (const d of existingDistricts) {
        if (d.average_household_income_change > 0) {
          gaining++;
        } else if (d.average_household_income_change < 0) {
          losing++;
        }
      }
    } else {
      stateResponses.forEach((stateData) => {
        for (const d of stateData.districts) {
          if (d.average_household_income_change > 0) {
            gaining++;
          } else if (d.average_household_income_change < 0) {
            losing++;
          }
        }
      });
    }
    return { gainingCount: gaining, losingCount: losing };
  }, [existingDistricts, stateResponses]);

  const dataReady = existingDistricts || (!isLoading && hasStarted);
  const progressPercent = totalStates > 0 ? Math.round((completedCount / totalStates) * 100) : 0;

  return (
    <DashboardCard
      mode={mode}
      zIndex={zIndex}
      expandDirection="up-right"
      gridGap={gridGap}
      colSpan={2}
      expandedRows={3}
      shrunkenHeader={header}
      shrunkenBody={
        <Group gap={spacing.lg} align="center" style={{ height: '100%' }}>
          {/* Left half: placeholder for hex choropleth map */}
          <Box style={{ flex: 1 }}>
            {/* TODO: Add small hexagonal choropleth map component */}
            <Box
              style={{
                height: 100,
                background: colors.gray[100],
                borderRadius: spacing.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xs" c={colors.text.tertiary}>
                Map placeholder
              </Text>
            </Box>
          </Box>

          {/* Right half: loading state or gain/lose counts */}
          <Box style={{ flex: 1 }}>
            {!dataReady ? (
              <Stack gap={spacing.sm}>
                <Text size="sm" c={colors.text.secondary}>
                  Loading ({completedCount} of {totalStates} states)...
                </Text>
                <Progress value={progressPercent} size="sm" />
              </Stack>
            ) : (
              <Group gap={spacing.sm} grow>
                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                  <MetricCard
                    label="Districts gaining"
                    value={gainingCount.toString()}
                    trend="positive"
                  />
                </Box>
                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                  <MetricCard
                    label="Districts losing"
                    value={losingCount.toString()}
                    trend="negative"
                  />
                </Box>
              </Group>
            )}
          </Box>
        </Group>
      }
      expandedControls={
        <SegmentedControl
          value={congressionalMode}
          onChange={(value) => setCongressionalMode(value as CongressionalMode)}
          size="xs"
          data={CONGRESSIONAL_MODE_OPTIONS}
          styles={segmentedControlStyles}
        />
      }
      expandedContent={
        <USDistrictChoroplethMap
          data={mapData}
          config={mapConfig}
          focusState={stateCode ?? undefined}
        />
      }
      onToggleMode={onToggleMode}
    />
  );
}

export default function SocietyWideOverview({ output, showCongressionalCard }: SocietyWideOverviewProps) {
  const countryId = useCurrentCountry();
  const symbol = currencySymbol(countryId);
  const [expandedCard, setExpandedCard] = useState<CardKey | null>(null);
  const [decileMode, setDecileMode] = useState<DecileMode>('absolute');
  const [povertyDepth, setPovertyDepth] = useState<PovertyDepth>('regular');
  const [povertyBreakdown, setPovertyBreakdown] = useState<PovertyBreakdown>('by-age');
  const breakdownOptions = getBreakdownOptions(povertyDepth, countryId);

  const handleDepthChange = (value: string) => {
    const newDepth = value as PovertyDepth;
    setPovertyDepth(newDepth);
    const options = getBreakdownOptions(newDepth, countryId);
    const currentOption = options.find((o) => o.value === povertyBreakdown);
    if (!currentOption || currentOption.disabled) {
      setPovertyBreakdown(options[0].value);
    }
  };

  const toggle = (key: CardKey) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  };

  const modeOf = (key: CardKey) => (expandedCard === key ? 'expanded' : 'shrunken');
  const zOf = (key: CardKey) => (expandedCard === key ? 10 : 1);

  // Calculate budgetary impact
  const budgetaryImpact = output.budget.budgetary_impact;

  // Federal and state breakdowns (US only)
  const stateTaxImpact = output.budget.state_tax_revenue_impact;
  const federalTaxImpact = output.budget.tax_revenue_impact - stateTaxImpact;
  const spendingImpact = output.budget.benefit_spending_impact;

  const formatImpact = (value: number) => {
    if (value === 0) {
      return 'No change';
    }
    const abs = Math.abs(value);
    if (abs < 1e6) {
      return `<${symbol}1 million`;
    }
    const formatted = formatBudgetaryImpact(abs);
    return `${symbol}${formatted.display}${formatted.label ? ` ${formatted.label}` : ''}`;
  };

  const budgetIsPositive = budgetaryImpact > 0;
  const budgetValue = formatImpact(budgetaryImpact);
  const budgetSubtext =
    budgetaryImpact === 0
      ? 'This policy has no impact on the budget'
      : budgetIsPositive
        ? 'in additional government revenue'
        : 'in additional government spending';

  const trendOf = (value: number): 'positive' | 'negative' | 'neutral' =>
    value === 0 ? 'neutral' : value > 0 ? 'positive' : 'negative';

  const subtextOf = (value: number, category: string) =>
    value === 0
      ? `No change in ${category}`
      : value > 0
        ? `in additional ${category}`
        : `in reduced ${category}`;

  // Calculate poverty rate change
  const povertyOverview = output.poverty.poverty.all;
  const povertyRateChange =
    povertyOverview.baseline === 0
      ? 0
      : (povertyOverview.reform - povertyOverview.baseline) / povertyOverview.baseline;
  const povertyAbsChange = Math.abs(povertyRateChange) * 100;
  const povertyValue = povertyRateChange === 0 ? 'No change' : `${povertyAbsChange.toFixed(1)}%`;
  const povertyTrend =
    povertyRateChange === 0 ? 'neutral' : povertyRateChange < 0 ? 'positive' : 'negative';
  const povertySubtext =
    povertyRateChange === 0
      ? 'Poverty rate unchanged'
      : povertyRateChange < 0
        ? 'decrease in poverty rate'
        : 'increase in poverty rate';

  // Calculate child poverty rate change
  const childPovertyOverview = output.poverty.poverty.child;
  const childPovertyRateChange =
    childPovertyOverview.baseline === 0
      ? 0
      : (childPovertyOverview.reform - childPovertyOverview.baseline) /
        childPovertyOverview.baseline;
  const childPovertyAbsChange = Math.abs(childPovertyRateChange) * 100;
  const childPovertyValue =
    childPovertyRateChange === 0 ? 'No change' : `${childPovertyAbsChange.toFixed(1)}%`;
  const childPovertyTrend: 'positive' | 'negative' | 'neutral' =
    childPovertyRateChange === 0
      ? 'neutral'
      : childPovertyRateChange < 0
        ? 'positive'
        : 'negative';
  const childPovertySubtext =
    childPovertyRateChange === 0
      ? 'Child poverty rate unchanged'
      : childPovertyRateChange < 0
        ? 'decrease in child poverty rate'
        : 'increase in child poverty rate';

  // Calculate Gini index change
  const giniOverview = output.inequality.gini;
  const giniRateChange =
    giniOverview.baseline === 0
      ? 0
      : (giniOverview.reform - giniOverview.baseline) / giniOverview.baseline;
  const giniAbsChange = Math.abs(giniRateChange) * 100;
  const giniValue = giniRateChange === 0 ? 'No change' : `${giniAbsChange.toFixed(1)}%`;
  const giniTrend: 'positive' | 'negative' | 'neutral' =
    giniRateChange === 0 ? 'neutral' : giniRateChange < 0 ? 'positive' : 'negative';
  const giniSubtext =
    giniRateChange === 0
      ? 'Gini index unchanged'
      : giniRateChange < 0
        ? 'decrease in Gini index'
        : 'increase in Gini index';

  // Calculate Top 1% share change
  const top1Overview = output.inequality.top_1_pct_share;
  const top1RateChange =
    top1Overview.baseline === 0
      ? 0
      : (top1Overview.reform - top1Overview.baseline) / top1Overview.baseline;
  const top1AbsChange = Math.abs(top1RateChange) * 100;
  const top1Value = top1RateChange === 0 ? 'No change' : `${top1AbsChange.toFixed(1)}%`;
  const top1Trend: 'positive' | 'negative' | 'neutral' =
    top1RateChange === 0 ? 'neutral' : top1RateChange < 0 ? 'positive' : 'negative';
  const top1Subtext =
    top1RateChange === 0
      ? 'Top 1% share unchanged'
      : top1RateChange < 0
        ? 'decrease in top 1% share'
        : 'increase in top 1% share';

  // Poverty chart switcher for expanded mode
  const povertyChart = (() => {
    if (povertyDepth === 'regular') {
      if (povertyBreakdown === 'by-age') {
        return <PovertyImpactByAgeSubPage output={output} chartHeight={SECONDARY_CHART_H} />;
      }
      if (povertyBreakdown === 'by-gender') {
        return <PovertyImpactByGenderSubPage output={output} chartHeight={SECONDARY_CHART_H} />;
      }
      if (povertyBreakdown === 'by-race') {
        return <PovertyImpactByRaceSubPage output={output} chartHeight={SECONDARY_CHART_H} />;
      }
    }
    if (povertyBreakdown === 'by-age') {
      return <DeepPovertyImpactByAgeSubPage output={output} chartHeight={SECONDARY_CHART_H} />;
    }
    if (povertyBreakdown === 'by-gender') {
      return <DeepPovertyImpactByGenderSubPage output={output} chartHeight={SECONDARY_CHART_H} />;
    }
    return null;
  })();

  // Decile impact mini chart data (absolute)
  const decileKeys = Object.keys(output.decile.average).sort((a, b) => Number(a) - Number(b));
  const decileAbsValues = decileKeys.map((d) => output.decile.average[d]);

  // Calculate winners and losers
  const decileOverview = output.intra_decile.all;
  const winnersPercent = decileOverview['Gain more than 5%'] + decileOverview['Gain less than 5%'];
  const losersPercent = decileOverview['Lose more than 5%'] + decileOverview['Lose less than 5%'];
  const unchangedPercent = decileOverview['No change'];

  // Reusable card header: icon + uppercase label
  const cardHeader = (
    IconComponent: React.ComponentType<{ size: number; color: string; stroke: number }>,
    labelText: string,
    hero = false
  ) => (
    <Group gap={hero ? spacing.lg : spacing.md} align="center">
      <Box
        style={{
          width: hero ? HERO_ICON_SIZE : SECONDARY_ICON_SIZE,
          height: hero ? HERO_ICON_SIZE : SECONDARY_ICON_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hero ? colors.primary[100] : colors.gray[100],
          borderRadius: hero ? spacing.sm : spacing.xs,
          flexShrink: 0,
        }}
      >
        <IconComponent
          size={hero ? 28 : 20}
          color={hero ? colors.primary[700] : colors.gray[600]}
          stroke={1.5}
        />
      </Box>
      <Text
        size={hero ? 'sm' : 'xs'}
        fw={typography.fontWeight.medium}
        c={colors.text.secondary}
        tt="uppercase"
        style={{ letterSpacing: '0.05em' }}
      >
        {labelText}
      </Text>
    </Group>
  );

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={GRID_GAP}>
      {/* Budgetary Impact — full width hero */}
      <DashboardCard
        mode={modeOf('budget')}
        zIndex={zOf('budget')}
        expandDirection="down-right"
        gridGap={GRID_GAP}
        colSpan={2}
        shrunkenBackground={`linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`}
        shrunkenBorderColor={colors.primary[100]}
        padding={spacing.xl}
        shrunkenHeader={cardHeader(IconCoin, 'Budgetary impact', true)}
        shrunkenBody={
          <Group gap={spacing.lg} align="flex-start">
            <Box style={{ flex: 1 }}>
              <MetricCard
                value={budgetValue}
                subtext={budgetSubtext}
                trend={
                  budgetaryImpact === 0 ? 'neutral' : budgetIsPositive ? 'positive' : 'negative'
                }
                hero
              />
            </Box>
            {countryId === 'us' && (
              <Group gap={spacing.xl} align="flex-start" style={{ flexShrink: 0 }}>
                <MetricCard
                  label="Federal tax revenue"
                  value={formatImpact(federalTaxImpact)}
                  subtext={subtextOf(federalTaxImpact, 'federal tax revenue')}
                  trend={trendOf(federalTaxImpact)}
                />
                <MetricCard
                  label="State and local tax revenue"
                  value={formatImpact(stateTaxImpact)}
                  subtext={subtextOf(stateTaxImpact, 'state tax revenue')}
                  trend={trendOf(stateTaxImpact)}
                />
                <MetricCard
                  label="Benefit spending"
                  value={formatImpact(spendingImpact)}
                  subtext={subtextOf(spendingImpact, 'benefit spending')}
                  trend={trendOf(-spendingImpact)}
                />
              </Group>
            )}
          </Group>
        }
        expandedContent={<BudgetaryImpactSubPage output={output} chartHeight={BUDGET_CHART_H} />}
        onToggleMode={() => toggle('budget')}
      />

      {/* Decile Impacts */}
      <DashboardCard
        mode={modeOf('decile')}
        zIndex={zOf('decile')}
        expandDirection="down-right"
        gridGap={GRID_GAP}
        shrunkenHeader={cardHeader(IconChartBar, 'Decile impacts')}
        shrunkenBody={
          <Box>
            <Plot
              data={[
                {
                  x: decileKeys,
                  y: decileAbsValues,
                  type: 'bar' as const,
                  marker: {
                    color: decileAbsValues.map((v) =>
                      v >= 0 ? colors.primary[500] : colors.gray[600]
                    ),
                  },
                },
              ]}
              layout={{
                margin: { t: 5, b: 20, l: 35, r: 5 },
                showlegend: false,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                  fixedrange: true,
                  tickvals: decileKeys,
                  ticktext: decileKeys,
                  dtick: 1,
                  tickfont: { color: colors.text.secondary },
                },
                yaxis: {
                  fixedrange: true,
                  tickprefix: symbol,
                  tickformat: ',.0f',
                  tickfont: { color: colors.text.secondary },
                },
              }}
              config={MINI_CHART_CONFIG}
              style={{ width: '100%', height: MINI_CHART_HEIGHT }}
            />
            <Group gap={spacing.xs} style={{ marginTop: -2 }}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: colors.primary[500],
                  flexShrink: 0,
                }}
              />
              <Text size="xs" c={colors.text.secondary}>
                Absolute impacts by decile
              </Text>
            </Group>
          </Box>
        }
        expandedControls={
          <SegmentedControl
            value={decileMode}
            onChange={(value) => setDecileMode(value as DecileMode)}
            size="xs"
            data={DECILE_MODE_OPTIONS}
            styles={segmentedControlStyles}
          />
        }
        expandedContent={
          decileMode === 'absolute' ? (
            <DistributionalImpactIncomeAverageSubPage
              output={output}
              chartHeight={SECONDARY_CHART_H}
            />
          ) : (
            <DistributionalImpactIncomeRelativeSubPage
              output={output}
              chartHeight={SECONDARY_CHART_H}
            />
          )
        }
        onToggleMode={() => toggle('decile')}
      />

      {/* Winners and Losers */}
      <DashboardCard
        mode={modeOf('winners')}
        zIndex={zOf('winners')}
        expandDirection="down-left"
        gridGap={GRID_GAP}
        shrunkenHeader={cardHeader(IconUsers, 'Winners and losers')}
        shrunkenBody={
          <Box>
            {/* Distribution Bar */}
            <Box
              style={{
                display: 'flex',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: colors.gray[200],
              }}
            >
              <Box
                style={{
                  width: `${winnersPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.primary[500],
                  transition: 'width 0.3s ease',
                }}
              />
              <Box
                style={{
                  width: `${unchangedPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.gray[300],
                  transition: 'width 0.3s ease',
                }}
              />
              <Box
                style={{
                  width: `${losersPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.gray[500],
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>

            {/* Legend */}
            <Group gap={spacing.lg} mt={spacing.sm} wrap="wrap">
              <Group gap={spacing.xs}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: colors.primary[500],
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" c={colors.text.secondary}>
                  Gain: {(winnersPercent * 100).toFixed(1)}%
                </Text>
              </Group>
              <Group gap={spacing.xs}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: colors.gray[300],
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" c={colors.text.secondary}>
                  No change: {(unchangedPercent * 100).toFixed(1)}%
                </Text>
              </Group>
              <Group gap={spacing.xs}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: colors.gray[500],
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" c={colors.text.secondary}>
                  Lose: {(losersPercent * 100).toFixed(1)}%
                </Text>
              </Group>
            </Group>
          </Box>
        }
        expandedContent={
          <WinnersLosersIncomeDecileSubPage output={output} chartHeight={SECONDARY_CHART_H} />
        }
        onToggleMode={() => toggle('winners')}
      />

      {/* Poverty Impact */}
      <DashboardCard
        mode={modeOf('poverty')}
        zIndex={zOf('poverty')}
        expandDirection="down-right"
        gridGap={GRID_GAP}
        shrunkenHeader={cardHeader(IconHome, 'Poverty impact')}
        shrunkenBody={
          <Group gap={spacing.sm} grow>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <MetricCard
                label="Overall"
                value={povertyValue}
                subtext={povertySubtext}
                trend={povertyTrend as 'positive' | 'negative' | 'neutral'}
                invertArrow
              />
            </Box>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <MetricCard
                label="Child"
                value={childPovertyValue}
                subtext={childPovertySubtext}
                trend={childPovertyTrend}
                invertArrow
              />
            </Box>
          </Group>
        }
        expandedControls={
          <>
            <SegmentedControl
              value={povertyDepth}
              onChange={handleDepthChange}
              size="xs"
              data={POVERTY_DEPTH_OPTIONS}
              styles={segmentedControlStyles}
            />
            <SegmentedControl
              value={povertyBreakdown}
              onChange={(value) => setPovertyBreakdown(value as PovertyBreakdown)}
              size="xs"
              data={breakdownOptions}
              styles={segmentedControlStyles}
            />
          </>
        }
        expandedContent={povertyChart}
        onToggleMode={() => toggle('poverty')}
      />

      {/* Inequality Impact */}
      <DashboardCard
        mode={modeOf('inequality')}
        zIndex={zOf('inequality')}
        expandDirection="down-left"
        gridGap={GRID_GAP}
        shrunkenHeader={cardHeader(IconScale, 'Inequality impact')}
        shrunkenBody={
          <Group gap={spacing.sm} grow>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <MetricCard
                label="Gini index"
                value={giniValue}
                subtext={giniSubtext}
                trend={giniTrend}
                invertArrow
              />
            </Box>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <MetricCard
                label="Top 1% share"
                value={top1Value}
                subtext={top1Subtext}
                trend={top1Trend}
                invertArrow
              />
            </Box>
          </Group>
        }
        expandedContent={
          <InequalityImpactSubPage output={output} chartHeight={SECONDARY_CHART_H} />
        }
        onToggleMode={() => toggle('inequality')}
      />

      {/* Congressional District Impact — US only, full width */}
      {showCongressionalCard && (
        <CongressionalDistrictCard
          output={output}
          mode={modeOf('congressional')}
          zIndex={zOf('congressional')}
          gridGap={GRID_GAP}
          header={cardHeader(IconMap, 'Congressional district impact')}
          onToggleMode={() => toggle('congressional')}
        />
      )}
    </SimpleGrid>
  );
}
