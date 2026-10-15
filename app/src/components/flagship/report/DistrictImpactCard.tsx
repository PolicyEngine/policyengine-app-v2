import { useMemo, useState } from 'react';
import { normalizeDistrictId } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { DistrictChoroplethMap } from '@/components/flagship/report/DistrictChoroplethMap';
import { SegmentedControl, Stack, Text } from '@/components/ui';
import { MapTypeToggle } from '@/components/visualization/choropleth/MapTypeToggle';
import type { MapVisualizationType } from '@/components/visualization/choropleth/types';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import {
  buildOutcomeMapData,
  getDistrictPayloadAvailability,
} from '@/pages/report-output/SocietyWideOverview';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

export type CongressionalMode = 'absolute' | 'relative' | 'winner-pct' | 'loser-pct';
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

type RankedDistrict = { id: string; label: string; value: number };

/** The most districts each ranking lists. */
const RANKED_COUNT = 5;
/** The most decimals a percentage shows. */
const MAX_PERCENT_DECIMALS = 4;

/** What the rankings say instead when no district moves. */
const NO_CHANGE_MESSAGES: Record<CongressionalMode, string> = {
  absolute: "No district's household income changes.",
  relative: "No district's household income changes.",
  'winner-pct': 'No district has people gaining income.',
  'loser-pct': 'No district has people losing income.',
};

/**
 * Decimals for percentages of `values` (shares: 0.01 is 1%): enough that
 * the largest shows two significant figures, from 1 (for 1% or more) up
 * to 4. A state reform can move every district by thousandths of a
 * percent, which one decimal reads as 0.0% throughout.
 */
export function percentDecimals(values: number[]): number {
  const largest = Math.max(
    0,
    ...values.map((value) => Math.abs(value * 100)).filter((value) => Number.isFinite(value))
  );
  if (largest === 0) {
    return 1;
  }
  return Math.min(MAX_PERCENT_DECIMALS, Math.max(1, 1 - Math.floor(Math.log10(largest))));
}

/** A share as a percentage; one that rounds to zero reads zero, with no minus. */
export function formatPercentShare(value: number, decimals: number): string {
  const roundsToZero = Number((value * 100).toFixed(decimals)) === 0;
  return formatParameterValue(roundsToZero ? 0 : value, '/1', { decimalPlaces: decimals });
}

/** Whole dollars; an amount that rounds to zero reads $0, with no minus. */
function formatDollars(value: number): string {
  return formatParameterValue(Math.round(value) === 0 ? 0 : value, 'currency-USD', {
    decimalPlaces: 0,
    includeSymbol: true,
  });
}

/**
 * The districts each ranking lists, from `sorted` (highest first): up to
 * five at each end, and no district in both, so a state with fewer than
 * ten districts splits them between the two.
 */
export function rankedEnds(sorted: RankedDistrict[]): {
  top: RankedDistrict[];
  bottom: RankedDistrict[];
} {
  const topCount = Math.min(RANKED_COUNT, Math.ceil(sorted.length / 2));
  return {
    top: sorted.slice(0, topCount),
    bottom: sorted.slice(topCount).slice(-RANKED_COUNT).reverse(),
  };
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
 * Congressional district impacts for the flagship report's Districts tab:
 * the navigable map with top and bottom rankings alongside, in normal
 * document flow. Must be rendered inside a CongressionalDistrictDataProvider.
 */
/** One district's results, in the shape the API's district breakdown uses. */
export interface DistrictImpactRow {
  district: string;
  average_household_income_change: number;
  /** Absent from the legislative tracker's stored districts. */
  relative_household_income_change?: number;
  winner_percentage?: number;
  loser_percentage?: number;
}

export default function DistrictImpactCard({
  output,
  districts,
  modes,
}: {
  /** The full results, whose district breakdown the card maps. */
  output?: SocietyWideReportOutput;
  /** Districts given directly, e.g. a bill's stored estimates, in place of `output`'s. */
  districts?: DistrictImpactRow[];
  /** The views to offer, e.g. without "Relative" where the data lacks it. */
  modes?: CongressionalMode[];
}) {
  const { labelLookup, stateCode } = useCongressionalDistrictData();
  const modeOptions = modes
    ? CONGRESSIONAL_MODE_OPTIONS.filter((option) => modes.includes(option.value))
    : CONGRESSIONAL_MODE_OPTIONS;
  const [congressionalMode, setCongressionalMode] = useState<CongressionalMode>(
    modeOptions[0]?.value ?? 'absolute'
  );
  const [mapVisualizationType, setMapVisualizationType] =
    useState<MapVisualizationType>('geographic');
  const isOutcomeMode = congressionalMode === 'winner-pct' || congressionalMode === 'loser-pct';
  const changeMetric = congressionalMode === 'relative' ? 'relative' : 'absolute';
  const outcomeMetric = congressionalMode === 'winner-pct' ? 'winner' : 'loser';

  // Districts given directly, or the output's own breakdown (from the full calculation).
  const savedDistricts = useMemo((): DistrictImpactRow[] | null => {
    const source: DistrictImpactRow[] | undefined = districts
      ? districts
      : output && 'congressional_district_impact' in output
        ? (output as ReportOutputSocietyWideUS).congressional_district_impact?.districts
        : undefined;
    if (!source) {
      return null;
    }
    return source.map((d) => ({
      ...d,
      district: normalizeDistrictId(d.district),
    }));
  }, [districts, output]);

  const savedDistrictAvailability = useMemo(
    () =>
      savedDistricts
        ? getDistrictPayloadAvailability(savedDistricts, labelLookup, stateCode)
        : null,
    [labelLookup, savedDistricts, stateCode]
  );
  const changeMapData = useMemo(() => {
    if (!savedDistricts) {
      return [];
    }

    return savedDistricts.map((item) => ({
      geoId: item.district,
      label: labelLookup.get(item.district) ?? `District ${item.district}`,
      value:
        changeMetric === 'absolute'
          ? item.average_household_income_change
          : (item.relative_household_income_change ?? 0),
    }));
  }, [changeMetric, labelLookup, savedDistricts]);

  const payloadOutcomeData = useMemo(() => {
    if (!savedDistricts) {
      return { points: [], missingCount: 0 };
    }

    return buildOutcomeMapData(savedDistricts, outcomeMetric, labelLookup);
  }, [labelLookup, outcomeMetric, savedDistricts]);

  const mapData = isOutcomeMode ? payloadOutcomeData.points : changeMapData;
  const outcomeDisplayData = payloadOutcomeData.points;

  // Percentages with enough decimals that the districts read apart, on
  // the map, its legend and the rankings alike.
  const decimals = useMemo(() => percentDecimals(mapData.map((point) => point.value)), [mapData]);
  const formatValue = useMemo(
    () =>
      changeMetric === 'absolute' && !isOutcomeMode
        ? formatDollars
        : (value: number) => formatPercentShare(value, decimals),
    [changeMetric, decimals, isOutcomeMode]
  );

  // Map config based on absolute vs relative mode
  const mapConfig = useMemo(() => {
    const percentTicks = `.${decimals}%`;
    if (congressionalMode === 'winner-pct') {
      return {
        colorScale: {
          colors: CONGRESSIONAL_WINNER_COLORS,
          tickFormat: percentTicks,
          symmetric: false,
        },
        formatValue,
      };
    }

    if (congressionalMode === 'loser-pct') {
      return {
        colorScale: {
          colors: CONGRESSIONAL_LOSER_COLORS,
          tickFormat: percentTicks,
          symmetric: false,
        },
        formatValue,
      };
    }

    return {
      colorScale: {
        colors: DIVERGING_GRAY_TEAL.colors,
        tickFormat: changeMetric === 'absolute' ? '$,.0f' : percentTicks,
        symmetric: true,
      },
      formatValue,
    };
  }, [changeMetric, congressionalMode, decimals, formatValue]);

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
    } else if (savedDistricts) {
      for (const d of savedDistricts) {
        all.push({
          id: d.district,
          label: toShortLabel(d.district),
          value:
            changeMetric === 'absolute'
              ? d.average_household_income_change
              : (d.relative_household_income_change ?? 0),
        });
      }
    }
    all.sort((a, b) => b.value - a.value);
    return all;
  }, [changeMetric, isOutcomeMode, labelLookup, outcomeDisplayData, savedDistricts]);

  const { top: topRanked, bottom: bottomRanked } = rankedEnds(sortedDistricts);
  // Every district at zero, as Loser % reads when no one loses: a ranking
  // of zeros says nothing, so the card says so instead.
  const noDistrictMoves =
    sortedDistricts.length > 0 && sortedDistricts.every((district) => district.value === 0);

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

  // Detect districts that are expected from metadata but missing from the saved report output.
  const savedErrorSummary = useMemo(() => {
    if (!savedDistricts) {
      return { errorDistrictCount: 0, errorStateAbbrs: [] as string[] };
    }

    const savedSet = new Set(savedDistricts.map((d) => d.district));
    const missingStates = new Set<string>();
    let count = 0;
    const expectedDistrictIds = savedDistrictAvailability?.expectedDistrictIds ?? [];
    expectedDistrictIds.forEach((districtId) => {
      if (!savedSet.has(districtId)) {
        count++;
        missingStates.add(districtId.split('-')[0]);
      }
    });
    return { errorDistrictCount: count, errorStateAbbrs: Array.from(missingStates) };
  }, [labelLookup, savedDistrictAvailability, savedDistricts, stateCode]);

  const visibleErrorCount =
    savedErrorSummary.errorDistrictCount + (isOutcomeMode ? payloadOutcomeData.missingCount : 0);
  const mapErrorStates = savedErrorSummary.errorStateAbbrs;

  return (
    <Stack
      style={{
        gap: spacing.lg,
        minWidth: 0,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <MapTypeToggle value={mapVisualizationType} onChange={setMapVisualizationType} />
        <SegmentedControl
          animated
          value={congressionalMode}
          onValueChange={(value) => setCongressionalMode(value as CongressionalMode)}
          size="xs"
          options={modeOptions}
        />
      </div>
      {visibleErrorCount > 0 && (
        <Text size="sm" c={colors.text.secondary}>
          {visibleErrorCount} congressional districts are missing{' '}
          {isOutcomeMode ? 'outcome' : 'impact'} data.
        </Text>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xl, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
          {mapData.length > 0 ? (
            <DistrictChoroplethMap
              data={mapData}
              visualizationType={mapVisualizationType}
              config={{ ...mapConfig, height: 460 }}
              focusState={stateCode ?? undefined}
              errorStates={mapErrorStates}
            />
          ) : (
            <Text>No congressional district {isOutcomeMode ? 'outcome ' : ''}data available</Text>
          )}
        </div>
        {mapData.length > 0 && (
          <div
            style={{
              flex: '1 1 220px',
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: spacing.xl,
            }}
          >
            {noDistrictMoves ? (
              <Text size="sm" c={colors.text.secondary}>
                {NO_CHANGE_MESSAGES[congressionalMode]}
              </Text>
            ) : isOutcomeMode ? (
              <>
                <DistrictListColumn
                  items={topRanked}
                  header={listHeaders.top}
                  formatValue={formatValue}
                />
                {bottomRanked.length > 0 && (
                  <DistrictListColumn
                    items={bottomRanked}
                    header={listHeaders.bottom}
                    formatValue={formatValue}
                  />
                )}
              </>
            ) : (
              <>
                <DistrictRankColumn
                  items={topRanked}
                  gainHeader={signedHeaders.topGain}
                  lossHeader={signedHeaders.topLoss}
                  formatValue={formatValue}
                />
                {bottomRanked.length > 0 && (
                  <DistrictRankColumn
                    items={bottomRanked}
                    gainHeader={signedHeaders.bottomGain}
                    lossHeader={signedHeaders.bottomLoss}
                    formatValue={formatValue}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Stack>
  );
}
