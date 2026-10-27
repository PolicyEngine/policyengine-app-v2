import { useMemo, useRef, useState } from 'react';
import { transformLocalAuthorityAbsoluteChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import {
  UK_WITHHELD_AREA_TEXT,
  type UKWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import UKAreaDisclosureNotes from '@/components/report/UKAreaDisclosureNotes';
import { Group, Stack, Text, Title } from '@/components/ui';
import {
  MapTypeToggle,
  UKAreaChoroplethMap,
  ukNationFromRegion,
  type MapVisualizationType,
} from '@/components/visualization/choropleth';
import {
  placeOnUKHexLayout,
  withheldUKHexAreas,
} from '@/components/visualization/choropleth/ukHexLayout';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByLocalAuthorityProps {
  output: SocietyWideReportOutput;
  /** For a disclosure-controlled breakdown: the areas it left out. Undefined for saved results. */
  withheld?: UKWithheldAreas;
  /** The report's region, e.g. "country/wales": a nation's report maps that nation alone. */
  region?: string;
}

/**
 * Absolute household income change by local authority
 *
 * Displays a geographic choropleth map, or a hexagonal map when the reader
 * toggles to it, showing the absolute household income change for each
 * UK local authority in currency terms.
 */
export function AbsoluteChangeByLocalAuthority({
  output,
  withheld,
  region,
}: AbsoluteChangeByLocalAuthorityProps) {
  // Map visualization type state (default to geographic), as the US district charts.
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const mapRef = useRef<HTMLDivElement>(null);
  // Absent or null outside the UK, and in national UK results from .py 6.10.0 on.
  const areas = (output as ReportOutputSocietyWideUK).local_authority_impact?.by_local_authority;
  // One point per area, for the geographic and hex maps alike
  const mapData = useMemo(
    () => (areas ? transformLocalAuthorityAbsoluteChange(areas) : []),
    [areas]
  );
  // The hex map places each local authority by its code in the app's layout, as v3's does.
  const hexPoints = useMemo(() => placeOnUKHexLayout('local_authority', mapData), [mapData]);
  // The local authorities a breakdown leaves out are the ones disclosure
  // control withheld: the hex map draws each in its place, as not reported.
  const withheldHexAreas = useMemo(
    () => (withheld === undefined ? [] : withheldUKHexAreas('local_authority', mapData, region)),
    [withheld, mapData, region]
  );
  const notes = <UKAreaDisclosureNotes level="local_authority" areas={areas} withheld={withheld} />;

  if (!mapData.length) {
    return (
      <Stack align="center" justify="center" style={{ height: 400 }}>
        <Text c="dimmed">No local authority data available</Text>
        {notes}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Title order={3} style={{ flex: 1 }}>
          Absolute household income change by local authority
        </Title>
        <Group gap="xs" wrap="nowrap">
          <MapTypeToggle value={mapType} onChange={setMapType} />
          <MapDownloadMenu mapRef={mapRef} filename="absolute-change-by-local-authority" />
        </Group>
      </Group>

      {mapType === 'geographic' ? (
        <UKAreaChoroplethMap
          data={mapData}
          level="local_authority"
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '£,.0f',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, 'currency-GBP', {
                decimalPlaces: 0,
                includeSymbol: true,
              }),
          }}
          focusNation={ukNationFromRegion(region)}
          exportRef={mapRef}
          // A breakdown's missing areas are the ones disclosure control withheld.
          missingAreaText={withheld === undefined ? undefined : UK_WITHHELD_AREA_TEXT}
        />
      ) : (
        <HexagonalMap
          data={hexPoints}
          missingAreas={withheldHexAreas}
          missingAreaText={UK_WITHHELD_AREA_TEXT}
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '£,.0f',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, 'currency-GBP', {
                decimalPlaces: 0,
                includeSymbol: true,
              }),
          }}
          exportRef={mapRef}
        />
      )}
      {notes}
    </Stack>
  );
}
