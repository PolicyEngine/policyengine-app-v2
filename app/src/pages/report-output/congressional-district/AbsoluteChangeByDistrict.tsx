import { useMemo, useRef, useState } from 'react';
import { normalizeDistrictId } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import { Group, Stack, Text, Title } from '@/components/ui';
import {
  MapTypeToggle,
  USDistrictChoroplethMap,
  type MapVisualizationType,
} from '@/components/visualization/choropleth';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByDistrictProps {
  output: SocietyWideReportOutput;
}

/**
 * Absolute household income change by congressional district
 *
 * Displays a geographic choropleth map showing the absolute household income change
 * for each US congressional district in currency terms.
 *
 * Uses district data included in the report output.
 */
export function AbsoluteChangeByDistrict({ output }: AbsoluteChangeByDistrictProps) {
  // Map visualization type state (default to geographic)
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const mapRef = useRef<HTMLDivElement>(null);

  const { labelLookup, stateCode } = useCongressionalDistrictData();

  // Check if output has district data from the report calculation.
  const existingMapData = useMemo(() => {
    if (!('congressional_district_impact' in output)) {
      return [];
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData?.districts) {
      return [];
    }
    return districtData.districts.map((item) => {
      const id = normalizeDistrictId(item.district);
      return {
        geoId: id,
        label: labelLookup.get(id) ?? `District ${id}`,
        value: item.average_household_income_change,
      };
    });
  }, [output, labelLookup]);

  const mapData = existingMapData;

  if (!mapData.length) {
    return (
      <Stack align="center" justify="center" style={{ height: 400 }}>
        <Text c="dimmed">No congressional district data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Title order={3} style={{ flex: 1 }}>
          Absolute household income change by congressional district
        </Title>
        <Group gap="xs" wrap="nowrap">
          <MapTypeToggle value={mapType} onChange={setMapType} />
          {mapData.length > 0 && (
            <MapDownloadMenu mapRef={mapRef} filename="absolute-change-by-congressional-district" />
          )}
        </Group>
      </Group>

      {mapData.length > 0 && (
        <USDistrictChoroplethMap
          data={mapData}
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '$,.0f',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, 'currency-USD', {
                decimalPlaces: 0,
                includeSymbol: true,
              }),
          }}
          focusState={stateCode ?? undefined}
          visualizationType={mapType}
          exportRef={mapRef}
        />
      )}
    </Stack>
  );
}
