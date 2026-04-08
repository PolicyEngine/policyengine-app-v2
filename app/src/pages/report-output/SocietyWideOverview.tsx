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
import { useSelector } from 'react-redux';
import { normalizeDistrictId } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DashboardCard from '@/components/report/DashboardCard';
import MetricCard from '@/components/report/MetricCard';
import { Group, Progress, SegmentedControl, Stack, Text } from '@/components/ui';
import { MapTypeToggle } from '@/components/visualization/choropleth/MapTypeToggle';
import type { MapVisualizationType } from '@/components/visualization/choropleth/types';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
import { currencySymbol, formatCurrencyAbbr } from '@/utils/formatters';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import { getBudgetChartTitle } from './budgetary-impact/budgetChartUtils';
import {
  getDistributionalAverageTitle,
  getDistributionalRelativeTitle,
  getWinnersLosersTitle,
} from './distributional-impact/distributionalChartUtils';
import DistributionalImpactIncomeAverageSubPage from './distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from './distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from './distributional-impact/WinnersLosersIncomeDecileSubPage';
import { getInequalityTitle } from './inequality-impact/inequalityChartUtils';
import InequalityImpactSubPage from './inequality-impact/InequalityImpactSubPage';
import DeepPovertyImpactByAgeSubPage from './poverty-impact/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from './poverty-impact/DeepPovertyImpactByGenderSubPage';
import { getDeepPovertyTitle, getPovertyTitle } from './poverty-impact/povertyChartUtils';
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

// Congressional map height (3 rows):
//   outer: 200×3 + 16×2 = 632, minus border(2) + padding(32) + controls(39) = 559
//   minus map Box border (2px) = 557
const CONGRESSIONAL_MAP_H = 557;

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

type DecileMode = 'absolute' | 'relative';
const DECILE_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as DecileMode },
  { label: 'Relative', value: 'relative' as DecileMode },
];

// Mini chart config for shrunken decile card
const MINI_CHART_HEIGHT = 90;
const MINI_CHART_CONFIG = { displayModeBar: false, responsive: true, staticPlot: true };

/**
 * Build tickvals/ticktext arrays for a currency y-axis where negative signs
 * appear to the left of the currency symbol: -$500 not $-500.
 * Generates ~4–5 nice ticks spanning the data range.
 */
function currencyTicks(
  values: number[],
  currSymbol: string,
  decimalPlaces = 0
): { tickvals: number[]; ticktext: string[] } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.abs(max) || 1;
  // Pick a nice step: 1, 2, 5, 10, 20, 50, …
  const rawStep = range / 4;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const candidates = [1, 2, 5, 10];
  const step = candidates.reduce((best, c) => {
    const s = c * mag;
    return Math.abs(s - rawStep) < Math.abs(best - rawStep) ? s : best;
  });
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 0.01; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10); // avoid FP noise
  }
  const fmt = (v: number) => {
    const abs = Math.abs(v).toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    if (v < 0) {
      return `-${currSymbol}${abs}`;
    }
    if (v > 0) {
      return `${currSymbol}${abs}`;
    }
    return `${currSymbol}0`;
  };
  return { tickvals: ticks, ticktext: ticks.map(fmt) };
}

type CongressionalMode = 'absolute' | 'relative' | 'winner-pct' | 'loser-pct';
const CONGRESSIONAL_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as CongressionalMode },
  { label: 'Relative', value: 'relative' as CongressionalMode },
  { label: 'Winner %', value: 'winner-pct' as CongressionalMode },
  { label: 'Loser %', value: 'loser-pct' as CongressionalMode },
];

const CONGRESSIONAL_WINNER_COLORS = [
  colors.background.tertiary,
  colors.primary[100],
  colors.primary[200],
  colors.primary[400],
  colors.primary[600],
];

const CONGRESSIONAL_LOSER_COLORS = [
  colors.background.tertiary,
  colors.gray[200],
  colors.gray[300],
  colors.gray[500],
  colors.gray[700],
];

type CardKey = 'budget' | 'decile' | 'poverty' | 'winners' | 'inequality' | 'congressional';

type RankedDistrict = { id: string; label: string; value: number };
type OutcomeMapPoint = { geoId: string; label: string; value: number };

export function buildOutcomeMapData(
  districts: Array<{ district: string; winner_percentage?: number; loser_percentage?: number }>,
  metric: 'winner' | 'loser',
  labelLookup: Map<string, string>
): { points: OutcomeMapPoint[]; missingCount: number } {
  const points: OutcomeMapPoint[] = [];
  let missingCount = 0;

  districts.forEach((district) => {
    const districtId = normalizeDistrictId(district.district);
    const value = metric === 'winner' ? district.winner_percentage : district.loser_percentage;

    if (typeof value !== 'number') {
      missingCount += 1;
      return;
    }

    points.push({
      geoId: districtId,
      label: labelLookup.get(districtId) ?? `District ${districtId}`,
      value,
    });
  });

  return { points, missingCount };
}

/**
 * Renders a column of 5 ranked districts with conditional section headers.
 * For the "top" column (descending order): gains header is "Biggest gains",
 * losses header is "Smallest losses".
 * For the "bottom" column (ascending order): losses header is "Biggest losses",
 * gains header is "Smallest gains".
 */
function DistrictRankColumn({
  items,
  gainHeader,
  lossHeader,
  formatValue,
}: {
  items: RankedDistrict[];
  gainHeader: string;
  lossHeader: string;
  formatValue: (v: number) => string;
}) {
  // Build sections: group consecutive items by sign, assigning headers
  const rows: Array<
    { type: 'header'; text: string } | { type: 'item'; district: RankedDistrict; rank: number }
  > = [];
  let lastSign: 'gain' | 'loss' | null = null;
  let rank = 1;
  for (const d of items) {
    const sign = d.value >= 0 ? 'gain' : 'loss';
    if (sign !== lastSign) {
      rows.push({ type: 'header', text: sign === 'gain' ? gainHeader : lossHeader });
      lastSign = sign;
    }
    rows.push({ type: 'item', district: d, rank });
    rank++;
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {rows.map((row, i) =>
        row.type === 'header' ? (
          <Text
            key={`h-${i}`}
            size="xs"
            fw={typography.fontWeight.medium}
            c={colors.text.secondary}
            className="tw:uppercase"
            style={{ letterSpacing: '0.05em', marginBottom: 2, marginTop: i > 0 ? 6 : 0 }}
          >
            {row.text}
          </Text>
        ) : (
          <div
            key={row.district.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              lineHeight: 1.5,
            }}
          >
            <Text
              size="sm"
              c={colors.text.tertiary}
              style={{ flexShrink: 0, minWidth: 18, textAlign: 'right' }}
            >
              {row.rank}.
            </Text>
            <Text
              size="sm"
              c={colors.text.secondary}
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {row.district.label}
            </Text>
            <Text
              size="sm"
              fw={typography.fontWeight.medium}
              c={row.district.value >= 0 ? colors.primary[600] : colors.gray[600]}
              style={{ flexShrink: 0 }}
            >
              {formatValue(row.district.value)}
            </Text>
          </div>
        )
      )}
    </div>
  );
}

function DistrictListColumn({
  items,
  header,
  formatValue,
}: {
  items: RankedDistrict[];
  header: string;
  formatValue: (v: number) => string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text
        size="xs"
        fw={typography.fontWeight.medium}
        c={colors.text.secondary}
        className="tw:uppercase"
        style={{ letterSpacing: '0.05em', marginBottom: 2 }}
      >
        {header}
      </Text>
      {items.map((district, index) => (
        <div
          key={district.id}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            lineHeight: 1.5,
          }}
        >
          <Text
            size="sm"
            c={colors.text.tertiary}
            style={{ flexShrink: 0, minWidth: 18, textAlign: 'right' }}
          >
            {index + 1}.
          </Text>
          <Text
            size="sm"
            c={colors.text.secondary}
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {district.label}
          </Text>
          <Text
            size="sm"
            fw={typography.fontWeight.medium}
            c={colors.text.primary}
            style={{ flexShrink: 0 }}
          >
            {formatValue(district.value)}
          </Text>
        </div>
      ))}
    </div>
  );
}

/**
 * Congressional district card content — must be rendered inside a
 * CongressionalDistrictDataProvider. Starts fetching once the report
 * output is available and no pre-computed district data exists.
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
    erroredStates,
  } = useCongressionalDistrictData();
  const [congressionalMode, setCongressionalMode] = useState<CongressionalMode>('absolute');
  const [mapVisualizationType, setMapVisualizationType] =
    useState<MapVisualizationType>('geographic');
  const isOutcomeMode = congressionalMode === 'winner-pct' || congressionalMode === 'loser-pct';
  const changeMetric = congressionalMode === 'relative' ? 'relative' : 'absolute';
  const outcomeMetric = congressionalMode === 'winner-pct' ? 'winner' : 'loser';

  // Check if output already has district data (from nationwide calculation)
  const existingDistricts = useMemo(() => {
    if (!('congressional_district_impact' in output)) {
      return null;
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData?.districts) {
      return null;
    }
    return districtData.districts.map((d) => ({
      ...d,
      district: normalizeDistrictId(d.district),
    }));
  }, [output]);

  // Auto-start fetch only when the report output is ready and no
  // pre-computed district data exists (avoids 51 redundant requests)
  useEffect(() => {
    if (!existingDistricts && !hasStarted) {
      startFetch();
    }
  }, [existingDistricts, hasStarted, startFetch]);

  // Build map data from context (progressive fill as states complete)
  const changeContextMapData = useMemo(() => {
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
            changeMetric === 'absolute'
              ? district.average_household_income_change
              : district.relative_household_income_change,
        });
      });
    });
    return points;
  }, [changeMetric, labelLookup, stateResponses]);

  // Use pre-computed data if available, otherwise progressive context data
  const changeMapData = useMemo(() => {
    if (existingDistricts) {
      return existingDistricts.map((item) => ({
        geoId: item.district,
        label: labelLookup.get(item.district) ?? `District ${item.district}`,
        value:
          changeMetric === 'absolute'
            ? item.average_household_income_change
            : item.relative_household_income_change,
      }));
    }
    return changeContextMapData;
  }, [changeContextMapData, changeMetric, existingDistricts, labelLookup]);

  const payloadOutcomeData = useMemo(() => {
    if (existingDistricts) {
      return buildOutcomeMapData(existingDistricts, outcomeMetric, labelLookup);
    }

    if (stateResponses.size === 0) {
      return { points: [], missingCount: 0 };
    }

    const districts: Array<{
      district: string;
      winner_percentage?: number;
      loser_percentage?: number;
    }> = [];
    stateResponses.forEach((stateData) => {
      stateData.districts.forEach((district) => {
        districts.push(district);
      });
    });
    return buildOutcomeMapData(districts, outcomeMetric, labelLookup);
  }, [existingDistricts, labelLookup, outcomeMetric, stateResponses]);

  const mapData = isOutcomeMode ? payloadOutcomeData.points : changeMapData;
  const outcomeDisplayData = payloadOutcomeData.points;

  // Map config based on absolute vs relative mode
  const mapConfig = useMemo(() => {
    if (congressionalMode === 'winner-pct') {
      return {
        colorScale: {
          colors: CONGRESSIONAL_WINNER_COLORS,
          tickFormat: '.1%',
          symmetric: false,
        },
        formatValue: (value: number) => formatParameterValue(value, '/1', { decimalPlaces: 1 }),
      };
    }

    if (congressionalMode === 'loser-pct') {
      return {
        colorScale: {
          colors: CONGRESSIONAL_LOSER_COLORS,
          tickFormat: '.1%',
          symmetric: false,
        },
        formatValue: (value: number) => formatParameterValue(value, '/1', { decimalPlaces: 1 }),
      };
    }

    return {
      colorScale: {
        colors: DIVERGING_GRAY_TEAL.colors,
        tickFormat: changeMetric === 'absolute' ? '$,.0f' : '.1%',
        symmetric: true,
      },
      formatValue: (value: number) =>
        changeMetric === 'absolute'
          ? formatParameterValue(value, 'currency-USD', {
              decimalPlaces: 0,
              includeSymbol: true,
            })
          : formatParameterValue(value, '/1', { decimalPlaces: 1 }),
    };
  }, [changeMetric, congressionalMode]);

  // Build sorted district list for top 5 / bottom 5 display.
  // Labels update automatically when labelLookup populates from metadata.
  const sortedDistricts = useMemo(() => {
    const all: Array<{ id: string; label: string; value: number }> = [];
    const toShortLabel = (districtId: string) => {
      const fullLabel = labelLookup.get(districtId) ?? districtId;
      return fullLabel.replace(/\s+congressional\s+district$/i, '');
    };
    if (isOutcomeMode) {
      for (const district of outcomeDisplayData) {
        all.push({
          id: district.geoId,
          label: toShortLabel(district.geoId),
          value: district.value,
        });
      }
    } else if (existingDistricts) {
      for (const d of existingDistricts) {
        all.push({
          id: d.district,
          label: toShortLabel(d.district),
          value:
            changeMetric === 'absolute'
              ? d.average_household_income_change
              : d.relative_household_income_change,
        });
      }
    } else {
      stateResponses.forEach((stateData) => {
        for (const d of stateData.districts) {
          all.push({
            id: d.district,
            label: toShortLabel(d.district),
            value:
              changeMetric === 'absolute'
                ? d.average_household_income_change
                : d.relative_household_income_change,
          });
        }
      });
    }
    all.sort((a, b) => b.value - a.value);
    return all;
  }, [
    changeMetric,
    existingDistricts,
    isOutcomeMode,
    labelLookup,
    outcomeDisplayData,
    stateResponses,
  ]);

  const top5 = sortedDistricts.slice(0, 5);
  const bottom5 = sortedDistricts.slice(-5).reverse();

  const rankingFormatValue = useMemo(() => {
    if (changeMetric === 'absolute' && !isOutcomeMode) {
      return (value: number) =>
        formatParameterValue(value, 'currency-USD', {
          decimalPlaces: 0,
          includeSymbol: true,
        });
    }

    return (value: number) => formatParameterValue(value, '/1', { decimalPlaces: 1 });
  }, [changeMetric, isOutcomeMode]);

  const signedHeaders = useMemo(
    () => ({
      topGain:
        changeMetric === 'absolute' ? 'Biggest gains (absolute)' : 'Biggest gains (relative)',
      topLoss:
        changeMetric === 'absolute' ? 'Smallest losses (absolute)' : 'Smallest losses (relative)',
      bottomGain:
        changeMetric === 'absolute' ? 'Smallest gains (absolute)' : 'Smallest gains (relative)',
      bottomLoss:
        changeMetric === 'absolute' ? 'Biggest losses (absolute)' : 'Biggest losses (relative)',
    }),
    [changeMetric]
  );

  const listHeaders = useMemo(
    () =>
      congressionalMode === 'winner-pct'
        ? { top: 'Highest winner share', bottom: 'Lowest winner share' }
        : { top: 'Highest loser share', bottom: 'Lowest loser share' },
    [congressionalMode]
  );

  // Detect errored districts from EITHER source:
  // 1. Pre-computed data: districts in labelLookup but missing from existingDistricts
  // 2. Progressive fetching: districts belonging to states in erroredStates
  const { errorDistrictCount, errorStateAbbrs } = useMemo(() => {
    if (existingDistricts) {
      const existingSet = new Set(existingDistricts.map((d) => d.district));
      const missingStates = new Set<string>();
      let count = 0;
      labelLookup.forEach((_label, districtId) => {
        if (!existingSet.has(districtId)) {
          count++;
          missingStates.add(districtId.split('-')[0]);
        }
      });
      return { errorDistrictCount: count, errorStateAbbrs: Array.from(missingStates) };
    }

    const abbrs = Array.from(erroredStates).map((code) =>
      code.replace(/^state\//, '').toUpperCase()
    );
    if (abbrs.length === 0) {
      return { errorDistrictCount: 0, errorStateAbbrs: abbrs };
    }
    const errorSet = new Set(abbrs);
    let count = 0;
    labelLookup.forEach((_label, districtId) => {
      if (errorSet.has(districtId.split('-')[0])) {
        count++;
      }
    });
    return { errorDistrictCount: count, errorStateAbbrs: abbrs };
  }, [existingDistricts, erroredStates, labelLookup]);

  const dataReady = Boolean(existingDistricts || (!isLoading && hasStarted));
  const progressCount = completedCount;
  const totalCount = totalStates;
  const progressLabel = 'states';
  const progressPercent = totalCount > 0 ? Math.round((progressCount / totalCount) * 100) : 0;
  const visibleErrorCount = isOutcomeMode
    ? errorDistrictCount + payloadOutcomeData.missingCount
    : errorDistrictCount;
  const mapErrorStates = errorStateAbbrs;

  return (
    <DashboardCard
      mode={mode}
      zIndex={zIndex}
      expandDirection="up-right"
      gridGap={gridGap}
      colSpan={2}
      shrunkenRows={2}
      expandedRows={3}
      shrunkenHeader={header}
      shrunkenBody={
        !dataReady ? (
          <Stack gap="sm">
            <Text size="sm" c={colors.text.secondary}>
              Loading ({progressCount} of {totalCount} {progressLabel})...
            </Text>
            <Progress value={progressPercent} />
            {visibleErrorCount > 0 && (
              <MetricCard
                label="Districts with errors"
                value={visibleErrorCount.toString()}
                trend="error"
              />
            )}
          </Stack>
        ) : mapData.length === 0 ? (
          <Stack gap="sm" align="center" justify="center" style={{ height: '100%' }}>
            <Text size="sm" c={colors.text.secondary}>
              No congressional district data available
            </Text>
            {visibleErrorCount > 0 && (
              <MetricCard
                label="Districts with errors"
                value={visibleErrorCount.toString()}
                trend="error"
              />
            )}
          </Stack>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: spacing.md,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: spacing.md,
            }}
          >
            {/* Left half: small hex choropleth map, zoomed in */}
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <div
                style={{
                  transform: stateCode ? 'scale(1)' : 'scale(1.35)',
                  transformOrigin: 'center center',
                  height: '100%',
                }}
              >
                <USDistrictChoroplethMap
                  data={mapData}
                  visualizationType="hex"
                  config={{
                    ...mapConfig,
                    height: 300,
                    showColorBar: false,
                  }}
                  focusState={stateCode ?? undefined}
                  errorStates={mapErrorStates}
                />
              </div>
            </div>
            {/* Right third: rankings stacked — winners on top */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md,
                overflow: 'hidden',
              }}
            >
              {isOutcomeMode ? (
                <>
                  <DistrictListColumn
                    items={top5}
                    header={listHeaders.top}
                    formatValue={rankingFormatValue}
                  />
                  <DistrictListColumn
                    items={bottom5}
                    header={listHeaders.bottom}
                    formatValue={rankingFormatValue}
                  />
                </>
              ) : (
                <>
                  <DistrictRankColumn
                    items={top5}
                    gainHeader={signedHeaders.topGain}
                    lossHeader={signedHeaders.topLoss}
                    formatValue={rankingFormatValue}
                  />
                  <DistrictRankColumn
                    items={bottom5}
                    gainHeader={signedHeaders.bottomGain}
                    lossHeader={signedHeaders.bottomLoss}
                    formatValue={rankingFormatValue}
                  />
                </>
              )}
            </div>
          </div>
        )
      }
      expandedControls={
        <>
          <MapTypeToggle value={mapVisualizationType} onChange={setMapVisualizationType} />
          <SegmentedControl
            value={congressionalMode}
            onValueChange={(value) => setCongressionalMode(value as CongressionalMode)}
            size="xs"
            options={CONGRESSIONAL_MODE_OPTIONS}
          />
        </>
      }
      expandedContent={
        <Stack gap="sm">
          {visibleErrorCount > 0 && (
            <Text size="sm" c={colors.text.secondary}>
              {isOutcomeMode
                ? `${visibleErrorCount} congressional districts are missing outcome data.`
                : `${visibleErrorCount} congressional districts could not be loaded.`}
            </Text>
          )}
          {mapData.length > 0 ? (
            <USDistrictChoroplethMap
              data={mapData}
              visualizationType={mapVisualizationType}
              config={{ ...mapConfig, height: CONGRESSIONAL_MAP_H }}
              focusState={stateCode ?? undefined}
              errorStates={mapErrorStates}
            />
          ) : (
            <Stack align="center" justify="center" style={{ height: CONGRESSIONAL_MAP_H }}>
              <Text c={colors.text.secondary}>
                {!dataReady
                  ? 'Loading congressional district data...'
                  : isOutcomeMode
                    ? 'No congressional district outcome data available'
                    : 'No congressional district data available'}
              </Text>
            </Stack>
          )}
        </Stack>
      }
      onToggleMode={onToggleMode}
    />
  );
}

export default function SocietyWideOverview({
  output,
  showCongressionalCard,
}: SocietyWideOverviewProps) {
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
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

  // Mini waterfall chart data for the shrunken budgetary card
  const budgetMiniLabelsAll =
    countryId === 'us'
      ? ['Federal taxes', 'State taxes', 'Benefits', 'Net']
      : ['Tax revenues', 'Benefits', 'Net'];
  const budgetMiniRawAll =
    countryId === 'us'
      ? [federalTaxImpact, stateTaxImpact, -spendingImpact, budgetaryImpact]
      : [output.budget.tax_revenue_impact, -spendingImpact, budgetaryImpact];
  // Choose magnitude based on the max absolute value
  const budgetMaxAbs = Math.max(...budgetMiniRawAll.map(Math.abs));
  const budgetMagnitude =
    budgetMaxAbs >= 1e9
      ? { divisor: 1e9, label: `${symbol}bn` }
      : budgetMaxAbs >= 1e6
        ? { divisor: 1e6, label: `${symbol}m` }
        : { divisor: 1e3, label: `${symbol}k` };
  const budgetMiniValuesAll = budgetMiniRawAll.map((v) => v / budgetMagnitude.divisor);
  const budgetMiniValues = budgetMiniValuesAll.filter((v) => v !== 0);
  const budgetMiniLabels = budgetMiniLabelsAll.filter((_, i) => budgetMiniValuesAll[i] !== 0);

  const budgetIsPositive = budgetaryImpact > 0;
  const budgetValue = formatImpact(budgetaryImpact);
  const budgetSubtext = getBudgetChartTitle(budgetaryImpact, countryId, metadata);

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
    childPovertyRateChange === 0 ? 'neutral' : childPovertyRateChange < 0 ? 'positive' : 'negative';
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
        return <PovertyImpactByAgeSubPage output={output} fillHeight />;
      }
      if (povertyBreakdown === 'by-gender') {
        return <PovertyImpactByGenderSubPage output={output} fillHeight />;
      }
      if (povertyBreakdown === 'by-race') {
        return <PovertyImpactByRaceSubPage output={output} fillHeight />;
      }
    }
    if (povertyBreakdown === 'by-age') {
      return <DeepPovertyImpactByAgeSubPage output={output} fillHeight />;
    }
    if (povertyBreakdown === 'by-gender') {
      return <DeepPovertyImpactByGenderSubPage output={output} fillHeight />;
    }
    return null;
  })();

  // Poverty SVG download filename depends on depth + breakdown
  const povertyDownloadFilename = (() => {
    const depthPrefix = povertyDepth === 'deep' ? 'deep-' : '';
    const breakdownSuffix =
      povertyBreakdown === 'by-age'
        ? 'by-age'
        : povertyBreakdown === 'by-gender'
          ? 'by-gender'
          : 'by-race';
    return `${depthPrefix}poverty-impact-${breakdownSuffix}.svg`;
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
    <Group gap={hero ? 'lg' : 'md'} align="center">
      <div
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
      </div>
      <Text
        size={hero ? 'sm' : 'xs'}
        fw={typography.fontWeight.medium}
        c={colors.text.secondary}
        className="tw:uppercase"
        style={{ letterSpacing: '0.05em' }}
      >
        {labelText}
      </Text>
    </Group>
  );

  return (
    <div className="tw:grid tw:grid-cols-2" style={{ gap: GRID_GAP }}>
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
          <div
            style={{
              display: 'flex',
              gap: spacing.xl,
              alignItems: 'flex-start',
              paddingLeft: '4%',
              paddingRight: '2%',
            }}
          >
            <div style={{ flex: '0 0 auto' }}>
              <MetricCard
                value={budgetValue}
                subtext={budgetSubtext}
                trend={
                  budgetaryImpact === 0 ? 'neutral' : budgetIsPositive ? 'positive' : 'negative'
                }
                hero
              />
            </div>
            {/* Spacer pushes chart toward right half */}
            <div style={{ flex: '1 1 10%' }} />
            <div style={{ flex: '0 1 55%', minWidth: 0 }}>
              <Plot
                data={
                  [
                    {
                      x: budgetMiniLabels,
                      y: budgetMiniValues,
                      type: 'waterfall',
                      orientation: 'v',
                      measure:
                        budgetMiniValues.length > 1
                          ? Array(budgetMiniValues.length - 1)
                              .fill('relative')
                              .concat(['total'])
                          : undefined,
                      text: budgetMiniValues.map((v) =>
                        formatCurrencyAbbr(v * budgetMagnitude.divisor, countryId, {
                          maximumFractionDigits: 1,
                        })
                      ),
                      textposition: 'inside',
                      increasing: { marker: { color: colors.primary[500] } },
                      decreasing: { marker: { color: colors.gray[600] } },
                      totals: {
                        marker: {
                          color: budgetaryImpact < 0 ? colors.gray[600] : colors.primary[700],
                        },
                      },
                      connector: {
                        line: { color: colors.gray[400], width: 1, dash: 'dot' },
                      },
                    },
                  ] as any
                }
                layout={
                  {
                    margin: { t: 5, b: 50, l: 55, r: 15 },
                    showlegend: false,
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: {
                      fixedrange: true,
                      tickfont: { size: 9, color: colors.text.secondary },
                    },
                    yaxis: {
                      fixedrange: true,
                      title: {
                        text: budgetMagnitude.label,
                        font: { size: 10, color: colors.text.secondary },
                        standoff: 5,
                      },
                      ...currencyTicks(budgetMiniValues, symbol, 1),
                      tickfont: { color: colors.text.secondary },
                    },
                    uniformtext: { mode: 'hide', minsize: 8 },
                  } as any
                }
                config={MINI_CHART_CONFIG}
                style={{ width: '100%', height: 120 }}
              />
            </div>
          </div>
        }
        expandedTitle={getBudgetChartTitle(output.budget.budgetary_impact, countryId, metadata)}
        downloadFilename="budgetary-impact.svg"
        expandedContent={<BudgetaryImpactSubPage output={output} fillHeight />}
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
          <div>
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
                margin: { t: 5, b: 20, l: 50, r: 5 },
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
                  ...currencyTicks(decileAbsValues, symbol),
                  tickfont: { color: colors.text.secondary },
                },
              }}
              config={MINI_CHART_CONFIG}
              style={{ width: '100%', height: MINI_CHART_HEIGHT }}
            />
          </div>
        }
        expandedControls={
          <SegmentedControl
            value={decileMode}
            onValueChange={(value) => setDecileMode(value as DecileMode)}
            size="xs"
            options={DECILE_MODE_OPTIONS}
          />
        }
        expandedTitle={
          decileMode === 'absolute'
            ? getDistributionalAverageTitle(output, countryId, metadata)
            : getDistributionalRelativeTitle(output, countryId, metadata)
        }
        downloadFilename={
          decileMode === 'absolute'
            ? 'distributional-impact-income-average.svg'
            : 'distributional-impact-income-relative.svg'
        }
        expandedContent={
          decileMode === 'absolute' ? (
            <DistributionalImpactIncomeAverageSubPage output={output} fillHeight />
          ) : (
            <DistributionalImpactIncomeRelativeSubPage output={output} fillHeight />
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
          <div>
            {/* Distribution Bar */}
            <div
              style={{
                display: 'flex',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: colors.gray[200],
              }}
            >
              <div
                style={{
                  width: `${winnersPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.primary[500],
                  transition: 'width 0.3s ease',
                }}
              />
              <div
                style={{
                  width: `${unchangedPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.gray[300],
                  transition: 'width 0.3s ease',
                }}
              />
              <div
                style={{
                  width: `${losersPercent * 100}%`,
                  height: '100%',
                  backgroundColor: colors.gray[500],
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Legend */}
            <Group gap="lg" wrap="wrap" style={{ marginTop: spacing.sm }}>
              <Group gap="xs">
                <div
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
              <Group gap="xs">
                <div
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
              <Group gap="xs">
                <div
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
          </div>
        }
        expandedTitle={getWinnersLosersTitle(output, countryId, metadata)}
        downloadFilename="winners-losers-income-decile.svg"
        expandedContent={<WinnersLosersIncomeDecileSubPage output={output} fillHeight />}
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
          <Group gap="sm" grow>
            <MetricCard
              label="Overall"
              value={povertyValue}
              subtext={povertySubtext}
              trend={povertyTrend as 'positive' | 'negative' | 'neutral'}
              invertArrow
              centered
            />
            <MetricCard
              label="Child"
              value={childPovertyValue}
              subtext={childPovertySubtext}
              trend={childPovertyTrend}
              invertArrow
              centered
            />
          </Group>
        }
        expandedControls={
          <>
            <SegmentedControl
              value={povertyDepth}
              onValueChange={handleDepthChange}
              size="xs"
              options={POVERTY_DEPTH_OPTIONS}
            />
            <SegmentedControl
              value={povertyBreakdown}
              onValueChange={(value) => setPovertyBreakdown(value as PovertyBreakdown)}
              size="xs"
              options={breakdownOptions}
            />
          </>
        }
        expandedTitle={
          povertyDepth === 'regular'
            ? getPovertyTitle(output, countryId, metadata)
            : getDeepPovertyTitle(output, countryId, metadata)
        }
        downloadFilename={povertyDownloadFilename}
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
          <Group gap="sm" grow>
            <MetricCard
              label="Gini index"
              value={giniValue}
              subtext={giniSubtext}
              trend={giniTrend}
              invertArrow
              centered
            />
            <MetricCard
              label="Top 1% share"
              value={top1Value}
              subtext={top1Subtext}
              trend={top1Trend}
              invertArrow
              centered
            />
          </Group>
        }
        expandedTitle={getInequalityTitle(output, metadata)}
        downloadFilename="inequality-impact.svg"
        expandedContent={<InequalityImpactSubPage output={output} fillHeight />}
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
    </div>
  );
}
