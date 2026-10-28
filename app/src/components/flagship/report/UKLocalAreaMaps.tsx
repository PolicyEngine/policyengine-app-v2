import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import { areaEstimateFields } from '@/adapters/ukAreaEstimateFields';
import {
  UK_AREA_NOUNS,
  UK_WITHHELD_AREA_TEXT,
  type UKAreaLevel,
  type UKBreakdownWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  AreaDetails,
  DistrictRankColumn,
  formatPercentShare,
  percentDecimals,
  rankedEnds,
} from '@/components/flagship/report/DistrictImpactCard';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import UKAreaDisclosureNotes from '@/components/report/UKAreaDisclosureNotes';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SegmentedControl,
  Stack,
  Text,
} from '@/components/ui';
import { MapTypeToggle } from '@/components/visualization/choropleth/MapTypeToggle';
import type { MapVisualizationType } from '@/components/visualization/choropleth/types';
import {
  UK_NATION_NAMES,
  ukNationFromCode,
  ukNationFromRegion,
} from '@/components/visualization/choropleth/ukAreaBoundaries';
import { UKAreaChoroplethMap } from '@/components/visualization/choropleth/UKAreaChoroplethMap';
import { placeUKHexMap } from '@/components/visualization/choropleth/ukHexLayout';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { colors, spacing, typography } from '@/designTokens';
import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { trackLocalAreaMapToggled } from '@/utils/analytics';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

type UKAreaKind = 'constituencies' | 'local-authorities';
type UKChangeMode = 'absolute' | 'relative';

const AREA_OPTIONS = [
  { label: 'Constituencies', value: 'constituencies' as UKAreaKind },
  { label: 'Local authorities', value: 'local-authorities' as UKAreaKind },
];

const MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as UKChangeMode },
  { label: 'Relative', value: 'relative' as UKChangeMode },
];

/** The level each kind of area is, as the breakdown's disclosure notes name it. */
const AREA_LEVELS: Record<UKAreaKind, UKAreaLevel> = {
  constituencies: 'constituency',
  'local-authorities': 'local_authority',
};

/** The geographic map's height: the US district map's in the districts card. */
const GEOGRAPHIC_MAP_HEIGHT = 460;

/** One area's results, keyed by its name. */
type AreaImpacts = ReportOutputSocietyWideByConstituency;
type AreaImpact = AreaImpacts[string];

/**
 * The area's nation: from its ONS code when the result has one, else from
 * the report's region when that is a nation. Null when neither says.
 */
export function areaNation(area: AreaImpact, region?: string | null): string | null {
  const nation = ukNationFromCode(area.code) ?? ukNationFromRegion(region);
  return nation ? UK_NATION_NAMES[nation] : null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Whole pounds; an amount that rounds to zero reads £0, with no minus. */
function formatPounds(value: number): string {
  return formatParameterValue(Math.round(value) === 0 ? 0 : value, 'currency-GBP', {
    decimalPlaces: 0,
    includeSymbol: true,
  });
}

/**
 * One area's figures for its details panel. A disclosure-controlled area
 * adds each change's 90% range, and says when its estimate is approximate.
 */
export function ukAreaDetailFigures(area: AreaImpact): { label: string; value: string }[] {
  const average = area.average_household_income_change;
  const relative = area.relative_household_income_change;
  const decimals = percentDecimals([relative]);
  const pounds = (value: number) =>
    formatCurrency(Math.round(value) === 0 ? 0 : value, 'uk', { maximumFractionDigits: 0 });
  const percent = (value: number) =>
    formatPercent(Number((value * 100).toFixed(decimals)) === 0 ? 0 : value, 'uk', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const averageRange = areaEstimateFields(area, 'average_household_income_change');
  const relativeRange = areaEstimateFields(area, 'relative_household_income_change');
  const figures = [{ label: 'Average household income change', value: pounds(average) }];
  if (averageRange.lower !== undefined && averageRange.upper !== undefined) {
    figures.push({
      label: 'Average household income change, 90% range',
      value: `${pounds(averageRange.lower)} to ${pounds(averageRange.upper)}`,
    });
  }
  figures.push({ label: 'Relative household income change', value: percent(relative) });
  if (relativeRange.lower !== undefined && relativeRange.upper !== undefined) {
    figures.push({
      label: 'Relative household income change, 90% range',
      value: `${percent(relativeRange.lower)} to ${percent(relativeRange.upper)}`,
    });
  }
  if (area.disclosure_tier === 'approximate') {
    figures.push({ label: 'Estimate', value: 'Approximate' });
  }
  return figures;
}

/** A filterable list of every area, so the keyboard can reach any of them. */
function AreaFinder({
  names,
  noun,
  onChoose,
}: {
  names: string[];
  noun: string;
  onChoose: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="tw:hover:border-border-medium"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            height: 28,
            padding: `0 ${spacing.sm}`,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.element,
            background: colors.background.primary,
            color: colors.text.secondary,
            fontSize: typography.fontSize.xs,
            cursor: 'pointer',
          }}
        >
          <IconSearch size={13} aria-hidden />
          <span style={{ whiteSpace: 'nowrap' }}>Find a {noun}</span>
          <IconChevronDown size={12} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="tw:max-sm:[&_[data-slot=command-item]]:min-h-10"
        style={{ width: 280, padding: 0 }}
      >
        <Command label={`Find a ${noun}`}>
          <CommandInput className="tw:max-sm:text-base" placeholder={`Find a ${noun}…`} />
          <CommandList>
            <CommandEmpty>No matching {noun}</CommandEmpty>
            <CommandGroup>
              {names.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChoose(name);
                    setOpen(false);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A UK report's local areas, laid out as the US districts card: the
 * constituency map or the local authority map, geographic by default or
 * as a hex grid, with the areas that gain and lose most beside it. A
 * nation's report draws that nation alone. Click an area on the map or in
 * a ranking, or find one by name, to see its details.
 */
export default function UKLocalAreaMaps({
  output,
  region,
  withheld,
  missingLevelContent,
}: {
  output: SocietyWideReportOutput;
  /** The report's region, e.g. "country/wales", which names the areas' nation. */
  region?: string | null;
  /**
   * For a disclosure-controlled breakdown: the areas each level left out,
   * which a note under the map gives. Undefined for a saved result.
   */
  withheld?: UKBreakdownWithheldAreas;
  /**
   * Shown in place of a level's map when the result does not hold that
   * level at all (absent or null), e.g. the panel that computes it. A level
   * computed with no areas left still says there is no data.
   */
  missingLevelContent?: ReactNode;
}) {
  const [areaKind, setAreaKind] = useState<UKAreaKind>('constituencies');
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const [mode, setMode] = useState<UKChangeMode>('absolute');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const level = AREA_LEVELS[areaKind];
  const noun = UK_AREA_NOUNS[level];

  const levelAreas = useMemo((): AreaImpacts | undefined => {
    const uk = output as ReportOutputSocietyWideUK;
    return areaKind === 'constituencies'
      ? uk.constituency_impact?.by_constituency
      : uk.local_authority_impact?.by_local_authority;
  }, [areaKind, output]);
  const areas = levelAreas && Object.keys(levelAreas).length > 0 ? levelAreas : null;
  const levelMissing = !levelAreas;

  const mapData = useMemo(
    () =>
      Object.entries(areas ?? {}).map(([name, area]) => {
        const field =
          mode === 'absolute'
            ? 'average_household_income_change'
            : 'relative_household_income_change';
        return {
          id: name,
          label: name,
          value: area[field],
          x: area.x,
          y: area.y,
          ...(area.code && { code: area.code }),
          ...areaEstimateFields(area, field),
        };
      }),
    [areas, mode]
  );

  // A level the breakdown supplied is disclosure-controlled: the areas of
  // the region it leaves out are the ones withheld, or, when the breakdown
  // lists its withheld codes, the listed ones. A saved level has none.
  const levelWithheld = withheld?.[level] !== undefined;
  const listedWithheldCodes = withheld?.[level]?.listedCodes;
  // The hex map places each area by its code in the app's layout, tiled,
  // and draws the withheld ones as not reported and any others the result
  // leaves out as having no data. A result with any area the layout cannot
  // place keeps all the API's positions, on their square grid.
  const hexMap = useMemo(
    () =>
      placeUKHexMap(level, mapData, {
        disclosureControlled: levelWithheld,
        region,
        listedWithheldCodes,
      }),
    [level, mapData, levelWithheld, region, listedWithheldCodes]
  );

  const decimals = useMemo(() => percentDecimals(mapData.map((point) => point.value)), [mapData]);
  const formatValue = useMemo(
    () =>
      mode === 'absolute' ? formatPounds : (value: number) => formatPercentShare(value, decimals),
    [decimals, mode]
  );

  const sorted = useMemo(
    () =>
      mapData
        .map((point) => ({ id: point.id, label: point.label, value: point.value }))
        .sort((a, b) => b.value - a.value),
    [mapData]
  );
  const { top, bottom } = rankedEnds(sorted);
  const noAreaMoves = sorted.length > 0 && sorted.every((area) => area.value === 0);
  const names = useMemo(() => Object.keys(areas ?? {}).sort(), [areas]);

  const selectedArea = selectedName && areas ? (areas[selectedName] ?? null) : null;
  const toggleSelected = (name: string) =>
    setSelectedName((current) => (current === name ? null : name));

  useEffect(() => {
    if (!selectedArea) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setSelectedName(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedArea]);

  const headerSuffix = mode === 'absolute' ? '(absolute)' : '(relative)';
  const mapConfig = {
    colorScale: {
      colors: DIVERGING_GRAY_TEAL.colors,
      tickFormat: mode === 'absolute' ? '£,.0f' : `.${decimals}%`,
      symmetric: true,
    },
    formatValue,
  };

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
          alignItems: 'center',
        }}
      >
        {/* As the US districts card: the map type first, then (UK only) the area kind. */}
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
          <MapTypeToggle value={mapType} onChange={setMapType} />
          <SegmentedControl
            animated
            value={areaKind}
            onValueChange={(value) => {
              const next = value as UKAreaKind;
              if (next !== areaKind) {
                trackLocalAreaMapToggled({
                  countryId: 'uk',
                  area: next === 'constituencies' ? 'constituencies' : 'local_authorities',
                });
                // A constituency's name does not pick a local authority.
                setSelectedName(null);
              }
              setAreaKind(next);
            }}
            size="xs"
            options={AREA_OPTIONS}
          />
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
          {areas && <AreaFinder names={names} noun={noun.one} onChoose={setSelectedName} />}
          <SegmentedControl
            animated
            value={mode}
            onValueChange={(value) => setMode(value as UKChangeMode)}
            size="xs"
            options={MODE_OPTIONS}
          />
          {areas && (
            <MapDownloadMenu
              mapRef={mapRef}
              filename={`${mode}-change-by-${areaKind === 'constituencies' ? 'constituency' : 'local-authority'}`}
            />
          )}
        </div>
      </div>
      {areas ? (
        // A new map fades in rather than snapping.
        <div
          key={`${areaKind}-${mapType}`}
          className="tw:motion-safe:fade-in-soft"
          style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xl, alignItems: 'flex-start' }}
        >
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            <Text size="sm" c={colors.text.secondary} style={{ marginBottom: spacing.sm }}>
              {mode === 'absolute' ? 'Absolute' : 'Relative'} household income change by {noun.one}
            </Text>
            {mapType === 'geographic' ? (
              <UKAreaChoroplethMap
                data={mapData}
                level={level}
                config={{ ...mapConfig, height: GEOGRAPHIC_MAP_HEIGHT }}
                focusNation={ukNationFromRegion(region)}
                exportRef={mapRef}
                // A breakdown level's missing areas are the ones disclosure control
                // withheld, or only the listed ones when it lists them; a saved
                // level's have no data.
                missingAreaText={levelWithheld ? UK_WITHHELD_AREA_TEXT : undefined}
                missingAreaTextCodes={listedWithheldCodes}
                navigable
                selectedId={selectedArea ? selectedName : null}
                onAreaClick={toggleSelected}
                ariaLabel={`${capitalize(noun.one)} map, coloured by the change. The lists of ${noun.many} give the values.`}
              />
            ) : (
              <HexagonalMap
                data={hexMap.points}
                missingAreas={hexMap.withheldAreas}
                missingAreaText={UK_WITHHELD_AREA_TEXT}
                noDataAreas={hexMap.noDataAreas}
                config={{
                  ...mapConfig,
                  // The legend reads in the rankings' units: pounds or percentages.
                  formatColorBarTick: formatValue,
                  tiled: hexMap.tiled,
                }}
                exportRef={mapRef}
                selectedId={selectedArea ? selectedName : null}
                onSelect={toggleSelected}
                insetWatermark
                zoomable
                centered
                fillWidth
              />
            )}
            <div style={{ marginTop: spacing.sm }}>
              <UKAreaDisclosureNotes level={level} areas={areas} withheld={withheld?.[level]} />
            </div>
          </div>
          <div
            style={{
              flex: '1 1 260px',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
            }}
          >
            {selectedArea && selectedName && (
              <AreaDetails
                title={selectedName}
                subtitle={areaNation(selectedArea, region) ?? undefined}
                figures={ukAreaDetailFigures(selectedArea)}
                closeLabel={`Close ${noun.one} details`}
                onClose={() => setSelectedName(null)}
              />
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: spacing.xl,
              }}
            >
              {noAreaMoves ? (
                <Text size="sm" c={colors.text.secondary}>
                  No {noun.one}&apos;s household income changes.
                </Text>
              ) : (
                <>
                  <DistrictRankColumn
                    items={top}
                    gainHeader={`Biggest gains ${headerSuffix}`}
                    lossHeader={`Smallest losses ${headerSuffix}`}
                    formatValue={formatValue}
                    selectedId={selectedArea ? selectedName : null}
                    onSelect={toggleSelected}
                  />
                  {bottom.length > 0 && (
                    <DistrictRankColumn
                      items={bottom}
                      gainHeader={`Smallest gains ${headerSuffix}`}
                      lossHeader={`Biggest losses ${headerSuffix}`}
                      formatValue={formatValue}
                      selectedId={selectedArea ? selectedName : null}
                      onSelect={toggleSelected}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : levelMissing && missingLevelContent ? (
        missingLevelContent
      ) : (
        <Stack style={{ gap: spacing.sm }}>
          <Text c={colors.text.secondary}>No {noun.one} data available</Text>
          <UKAreaDisclosureNotes level={level} areas={areas} withheld={withheld?.[level]} />
        </Stack>
      )}
    </Stack>
  );
}
