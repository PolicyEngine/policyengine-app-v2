import { useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  AreaDetails,
  DistrictRankColumn,
  formatPercentShare,
  percentDecimals,
  rankedEnds,
} from '@/components/flagship/report/DistrictImpactCard';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
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

/** Singular and plural names for each kind of area. */
const AREA_NOUNS: Record<UKAreaKind, { one: string; many: string }> = {
  constituencies: { one: 'constituency', many: 'constituencies' },
  'local-authorities': { one: 'local authority', many: 'local authorities' },
};

/** The nation each ONS code's first letter stands for. */
const NATION_BY_CODE_PREFIX: Record<string, string> = {
  E: 'England',
  W: 'Wales',
  S: 'Scotland',
  N: 'Northern Ireland',
};

/** The nation a report's region names, e.g. "country/wales" is Wales. */
const NATION_BY_REGION: Record<string, string> = {
  'country/england': 'England',
  'country/wales': 'Wales',
  'country/scotland': 'Scotland',
  'country/ni': 'Northern Ireland',
  'country/northern_ireland': 'Northern Ireland',
};

/** One area's results, keyed by its name. */
type AreaImpacts = ReportOutputSocietyWideByConstituency;
type AreaImpact = AreaImpacts[string];

/**
 * The area's nation: from its ONS code when the result has one, else from
 * the report's region when that is a nation. Null when neither says.
 */
export function areaNation(area: AreaImpact, region?: string | null): string | null {
  const prefix = area.code?.charAt(0).toUpperCase();
  if (prefix && NATION_BY_CODE_PREFIX[prefix]) {
    return NATION_BY_CODE_PREFIX[prefix];
  }
  return (region && NATION_BY_REGION[region.toLowerCase()]) || null;
}

/** Whole pounds; an amount that rounds to zero reads £0, with no minus. */
function formatPounds(value: number): string {
  return formatParameterValue(Math.round(value) === 0 ? 0 : value, 'currency-GBP', {
    decimalPlaces: 0,
    includeSymbol: true,
  });
}

/** One area's figures for its details panel. */
export function ukAreaDetailFigures(area: AreaImpact): { label: string; value: string }[] {
  const average = area.average_household_income_change;
  const relative = area.relative_household_income_change;
  const decimals = percentDecimals([relative]);
  const relativeRoundsToZero = Number((relative * 100).toFixed(decimals)) === 0;
  return [
    {
      label: 'Average household income change',
      value: formatCurrency(Math.round(average) === 0 ? 0 : average, 'uk', {
        maximumFractionDigits: 0,
      }),
    },
    {
      label: 'Relative household income change',
      value: formatPercent(relativeRoundsToZero ? 0 : relative, 'uk', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    },
  ];
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
 * A UK report's local areas: the constituency map or the local authority
 * map, with the areas that gain and lose most beside it. Click a hexagon
 * or a ranked area, or find one by name, to see its details.
 */
export default function UKLocalAreaMaps({
  output,
  region,
}: {
  output: SocietyWideReportOutput;
  /** The report's region, e.g. "country/wales", which names the areas' nation. */
  region?: string | null;
}) {
  const [areaKind, setAreaKind] = useState<UKAreaKind>('constituencies');
  const [mode, setMode] = useState<UKChangeMode>('absolute');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const noun = AREA_NOUNS[areaKind];

  const areas = useMemo((): AreaImpacts | null => {
    const uk = output as ReportOutputSocietyWideUK;
    const byName =
      areaKind === 'constituencies'
        ? uk.constituency_impact?.by_constituency
        : uk.local_authority_impact?.by_local_authority;
    return byName && Object.keys(byName).length > 0 ? byName : null;
  }, [areaKind, output]);

  const mapData = useMemo(
    () =>
      Object.entries(areas ?? {}).map(([name, area]) => ({
        id: name,
        label: name,
        value:
          mode === 'absolute'
            ? area.average_household_income_change
            : area.relative_household_income_change,
        x: area.x,
        y: area.y,
      })),
    [areas, mode]
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
          key={areaKind}
          className="tw:motion-safe:fade-in-soft"
          style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xl, alignItems: 'flex-start' }}
        >
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            <Text size="sm" c={colors.text.secondary} style={{ marginBottom: spacing.sm }}>
              {mode === 'absolute' ? 'Absolute' : 'Relative'} household income change by {noun.one}
            </Text>
            <HexagonalMap
              data={mapData}
              config={{
                colorScale: {
                  colors: DIVERGING_GRAY_TEAL.colors,
                  tickFormat: mode === 'absolute' ? '£,.0f' : `.${decimals}%`,
                  symmetric: true,
                },
                formatValue,
                // The legend reads in the rankings' units: pounds or percentages.
                formatColorBarTick: formatValue,
              }}
              exportRef={mapRef}
              selectedId={selectedArea ? selectedName : null}
              onSelect={toggleSelected}
              insetWatermark
              zoomable
              centered
            />
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
      ) : (
        <Text c={colors.text.secondary}>No {noun.one} data available</Text>
      )}
    </Stack>
  );
}
