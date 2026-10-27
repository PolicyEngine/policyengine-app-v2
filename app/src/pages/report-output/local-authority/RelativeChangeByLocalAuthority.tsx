import { useMemo, useRef, useState } from 'react';
import { transformLocalAuthorityRelativeChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import type { UKWithheldAreas } from '@/adapters/ukLocalAreaBreakdownAdapter';
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
import { placeOnUKHexLayout } from '@/components/visualization/choropleth/ukHexLayout';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByLocalAuthorityProps {
  output: SocietyWideReportOutput;
  /** For a disclosure-controlled breakdown: the areas it left out. Undefined for saved results. */
  withheld?: UKWithheldAreas;
  /** The report's region, e.g. "country/wales": a nation's report maps that nation alone. */
  region?: string;
}

/**
 * Relative household income change by local authority
 *
 * Displays a geographic choropleth map, or a hexagonal map when the reader
 * toggles to it, showing the relative household income change for each
 * UK local authority as a percentage.
 */
export function RelativeChangeByLocalAuthority({
  output,
  withheld,
  region,
}: RelativeChangeByLocalAuthorityProps) {
  // Map visualization type state (default to geographic), as the US district charts.
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const mapRef = useRef<HTMLDivElement>(null);
  // Absent or null outside the UK, and in national UK results from .py 6.10.0 on.
  const areas = (output as ReportOutputSocietyWideUK).local_authority_impact?.by_local_authority;
  // One point per area, for the geographic and hex maps alike
  const mapData = useMemo(
    () => (areas ? transformLocalAuthorityRelativeChange(areas) : []),
    [areas]
  );
  // The hex map places each local authority by its code in the app's layout, as v3's does.
  const hexPoints = useMemo(() => placeOnUKHexLayout('local_authority', mapData), [mapData]);
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
          Relative household income change by local authority
        </Title>
        <Group gap="xs" wrap="nowrap">
          <MapTypeToggle value={mapType} onChange={setMapType} />
          <MapDownloadMenu mapRef={mapRef} filename="relative-change-by-local-authority" />
        </Group>
      </Group>

      {mapType === 'geographic' ? (
        <UKAreaChoroplethMap
          data={mapData}
          level="local_authority"
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '.1%',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, '/1', {
                decimalPlaces: 1,
                includeSymbol: true,
              }),
          }}
          focusNation={ukNationFromRegion(region)}
          exportRef={mapRef}
          // A breakdown's missing areas are the ones disclosure control withheld.
          missingAreaText={withheld === undefined ? undefined : 'Not published'}
        />
      ) : (
        <HexagonalMap
          data={hexPoints}
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '.1%',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, '/1', {
                decimalPlaces: 1,
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
