import { useEffect, useMemo } from 'react';
import { Progress, Stack, Text, Title } from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByDistrictProps {
  output: SocietyWideReportOutput;
}

/**
 * Relative household income change by congressional district
 *
 * Displays a geographic choropleth map showing the relative (percentage) household
 * income change for each US congressional district.
 *
 * Uses shared CongressionalDistrictDataContext for data fetching so that
 * switching between absolute and relative views doesn't trigger re-fetching.
 */
export function RelativeChangeByDistrict({ output }: RelativeChangeByDistrictProps) {
  // Get shared district data from context
  const {
    stateResponses,
    completedCount,
    totalStates,
    isLoading,
    hasStarted,
    labelLookup,
    stateCode,
    startFetch,
  } = useCongressionalDistrictData();

  // Check if output already has district data (from nationwide calculation)
  const existingMapData = useMemo(() => {
    if (!('congressional_district_impact' in output)) {
      return [];
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData?.districts) {
      return [];
    }
    return districtData.districts.map((item) => ({
      geoId: item.district,
      label: labelLookup.get(item.district) ?? `District ${item.district}`,
      value: item.relative_household_income_change,
    }));
  }, [output, labelLookup]);

  // Transform context data to choropleth format (relative change)
  const contextMapData = useMemo(() => {
    if (stateResponses.size === 0) {
      return [];
    }
    const points: Array<{ geoId: string; label: string; value: number }> = [];
    stateResponses.forEach((stateData) => {
      stateData.districts.forEach((district) => {
        points.push({
          geoId: district.district,
          label: labelLookup.get(district.district) ?? `District ${district.district}`,
          value: district.relative_household_income_change,
        });
      });
    });
    return points;
  }, [stateResponses, labelLookup]);

  // Use existing data if available, otherwise use context data
  const mapData = existingMapData.length > 0 ? existingMapData : contextMapData;

  // Auto-start fetch when component mounts if no existing data
  useEffect(() => {
    if (existingMapData.length === 0 && !hasStarted) {
      startFetch();
    }
  }, [existingMapData.length, hasStarted, startFetch]);

  // Calculate progress percentage
  const progressPercent = totalStates > 0 ? Math.round((completedCount / totalStates) * 100) : 0;

  // No data and not loading
  if (!mapData.length && !isLoading && !hasStarted) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">No congressional district data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Relative household income change by congressional district</Title>
      </div>

      {/* Show progress while loading */}
      {isLoading && <Progress value={progressPercent} size="sm" />}

      {/* Show map if we have any data */}
      {mapData.length > 0 && (
        <USDistrictChoroplethMap
          data={mapData}
          config={{
            colorScale: {
              colors: DIVERGING_GRAY_TEAL.colors,
              tickFormat: '.1%',
              symmetric: true,
            },
            formatValue: (value) =>
              formatParameterValue(value, '/1', {
                decimalPlaces: 1,
              }),
          }}
          focusState={stateCode ?? undefined}
        />
      )}
    </Stack>
  );
}
