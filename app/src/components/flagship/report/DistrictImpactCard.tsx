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

type RankedDistrict = { id: string; label: string; value: number };

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
export default function DistrictImpactCard({ output }: { output: SocietyWideReportOutput }) {
  const { labelLookup, stateCode } = useCongressionalDistrictData();
  const [congressionalMode, setCongressionalMode] = useState<CongressionalMode>('absolute');
  const [mapVisualizationType, setMapVisualizationType] =
    useState<MapVisualizationType>('geographic');
  const isOutcomeMode = congressionalMode === 'winner-pct' || congressionalMode === 'loser-pct';
  const changeMetric = congressionalMode === 'relative' ? 'relative' : 'absolute';
  const outcomeMetric = congressionalMode === 'winner-pct' ? 'winner' : 'loser';

  // Check if output already has district data (from nationwide calculation)
  const savedDistricts = useMemo(() => {
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
          : item.relative_household_income_change,
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
    } else if (savedDistricts) {
      for (const d of savedDistricts) {
        all.push({
          id: d.district,
          label: toShortLabel(d.district),
          value:
            changeMetric === 'absolute'
              ? d.average_household_income_change
              : d.relative_household_income_change,
        });
      }
    }
    all.sort((a, b) => b.value - a.value);
    return all;
  }, [changeMetric, isOutcomeMode, labelLookup, outcomeDisplayData, savedDistricts]);

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
          value={congressionalMode}
          onValueChange={(value) => setCongressionalMode(value as CongressionalMode)}
          size="xs"
          options={CONGRESSIONAL_MODE_OPTIONS}
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
        )}
      </div>
    </Stack>
  );
}
