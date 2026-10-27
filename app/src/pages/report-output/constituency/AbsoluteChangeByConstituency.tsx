import { useMemo, useRef, useState } from 'react';
import { transformConstituencyAbsoluteChange } from '@/adapters/constituency/constituencyDataAdapter';
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

interface AbsoluteChangeByConstituencyProps {
  output: SocietyWideReportOutput;
  /** For a disclosure-controlled breakdown: the areas it left out. Undefined for saved results. */
  withheld?: UKWithheldAreas;
  /** The report's region, e.g. "country/wales": a nation's report maps that nation alone. */
  region?: string;
}

/**
 * Absolute household income change by parliamentary constituency
 *
 * Displays a geographic choropleth map, or a hexagonal map when the reader
 * toggles to it, showing the absolute household income change for each
 * UK parliamentary constituency in currency terms.
 */
export function AbsoluteChangeByConstituency({
  output,
  withheld,
  region,
}: AbsoluteChangeByConstituencyProps) {
  // Map visualization type state (default to geographic), as the US district charts.
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const mapRef = useRef<HTMLDivElement>(null);
  // Absent or null outside the UK, and in national UK results from .py 6.10.0 on.
  const areas = (output as ReportOutputSocietyWideUK).constituency_impact?.by_constituency;
  // One point per area, for the geographic and hex maps alike
  const mapData = useMemo(() => (areas ? transformConstituencyAbsoluteChange(areas) : []), [areas]);
  // The hex map places each constituency by its code in the app's layout, as v3's does.
  const hexPoints = useMemo(() => placeOnUKHexLayout('constituency', mapData), [mapData]);
  const notes = <UKAreaDisclosureNotes level="constituency" areas={areas} withheld={withheld} />;

  if (!mapData.length) {
    return (
      <Stack align="center" justify="center" style={{ height: 400 }}>
        <Text c="dimmed">No constituency data available</Text>
        {notes}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Title order={3} style={{ flex: 1 }}>
          Absolute household income change by constituency
        </Title>
        <Group gap="xs" wrap="nowrap">
          <MapTypeToggle value={mapType} onChange={setMapType} />
          <MapDownloadMenu mapRef={mapRef} filename="absolute-change-by-constituency" />
        </Group>
      </Group>

      {mapType === 'geographic' ? (
        <UKAreaChoroplethMap
          data={mapData}
          level="constituency"
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
          missingAreaText={withheld === undefined ? undefined : 'Not published'}
        />
      ) : (
        <HexagonalMap
          data={hexPoints}
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
