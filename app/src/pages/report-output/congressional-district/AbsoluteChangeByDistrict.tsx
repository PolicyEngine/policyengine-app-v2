import { useMemo, useRef, useState } from 'react';
import { districtErrorSummary } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import StateDistrictComputePanel from '@/components/flagship/report/StateDistrictComputePanel';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import { Group, Stack, Text, Title } from '@/components/ui';
import {
  MapTypeToggle,
  USDistrictChoroplethMap,
  type MapVisualizationType,
} from '@/components/visualization/choropleth';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import { useCongressionalDistrictImpacts } from '@/hooks/useCongressionalDistrictImpacts';
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
 * A state report maps its own result's districts. A nationwide report maps
 * each state's own run (useCongressionalDistrictImpacts), with the state
 * district panel in place of the map until a state is in, and above it
 * until every state is.
 */
export function AbsoluteChangeByDistrict({ output }: AbsoluteChangeByDistrictProps) {
  // Map visualization type state (default to geographic)
  const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
  const mapRef = useRef<HTMLDivElement>(null);

  const { labelLookup, stateCode } = useCongressionalDistrictData();
  // A state report's own districts; a nationwide report's from each state's run.
  const { districts, runs, pendingStates, failedStates } = useCongressionalDistrictImpacts(output);

  const mapData = useMemo(
    () =>
      (districts ?? []).map((item) => ({
        geoId: item.district,
        label: labelLookup.get(item.district) ?? `District ${item.district}`,
        value: item.average_household_income_change,
      })),
    [districts, labelLookup]
  );
  // States still to come are not marked; failed states are.
  const errorStates = useMemo(
    () =>
      runs
        ? districtErrorSummary(districts, Array.from(labelLookup.keys()), {
            pendingStates,
            failedStates,
          }).errorStateAbbrs
        : undefined,
    [districts, failedStates, labelLookup, pendingStates, runs]
  );
  const unfinishedRuns = runs && runs.status !== 'complete' ? runs : null;

  if (!mapData.length) {
    return (
      <Stack align="center" justify="center" style={{ height: 400 }}>
        {runs ? (
          <StateDistrictComputePanel runs={runs} />
        ) : (
          <Text c="dimmed">No congressional district data available</Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {unfinishedRuns && <StateDistrictComputePanel runs={unfinishedRuns} />}
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
          errorStates={errorStates}
          visualizationType={mapType}
          exportRef={mapRef}
        />
      )}
    </Stack>
  );
}
