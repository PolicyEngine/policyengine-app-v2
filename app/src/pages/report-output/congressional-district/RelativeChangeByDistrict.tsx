import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Group, Loader, Progress, Stack, Text, Title } from '@mantine/core';
import {
  buildDistrictLabelLookup,
  transformDistrictRelativeChange,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import { useCongressionalDistrictsByState } from '@/hooks/useCongressionalDistrictsByState';
import type { RootState } from '@/store';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByDistrictProps {
  output: SocietyWideReportOutput;
  /** Reform policy ID for state-by-state fetching */
  reformPolicyId?: string;
  /** Baseline policy ID for state-by-state fetching */
  baselinePolicyId?: string;
  /** Year for calculations */
  year?: string;
}

/**
 * Relative household income change by congressional district
 *
 * Displays a geographic choropleth map showing the relative (percentage) household
 * income change for each US congressional district.
 *
 * Supports two modes:
 * 1. If `output` already contains congressional_district_impact data, display it directly
 * 2. If policy IDs and year are provided, allow fetching district data via parallel state requests
 */
export function RelativeChangeByDistrict({
  output,
  reformPolicyId,
  baselinePolicyId,
  year,
}: RelativeChangeByDistrictProps) {
  // Get district labels from metadata
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Build label lookup from metadata (memoized)
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Transform existing API data to choropleth map format (if available from nationwide calc)
  const existingMapData = useMemo(() => {
    if (!('congressional_district_impact' in output)) {
      return [];
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData) {
      return [];
    }
    return transformDistrictRelativeChange(districtData, labelLookup);
  }, [output, labelLookup]);

  // Hook for fetching districts via parallel state requests
  const canFetchByState = !!reformPolicyId && !!baselinePolicyId && !!year;
  const { state: fetchState, fetchAllStates } = useCongressionalDistrictsByState({
    reformPolicyId: reformPolicyId || '',
    baselinePolicyId: baselinePolicyId || '',
    year: year || '',
    valueField: 'relative_household_income_change',
  });

  // Use existing data if available, otherwise use progressively fetched data
  const mapData = existingMapData.length > 0 ? existingMapData : fetchState.districts;
  const isUsingFetchedData = existingMapData.length === 0 && fetchState.districts.length > 0;

  // Show progress info while loading
  const progressPercent =
    fetchState.totalStates > 0
      ? Math.round((fetchState.completedStates / fetchState.totalStates) * 100)
      : 0;

  // Automatically fetch when component mounts if no existing data
  useEffect(() => {
    if (canFetchByState && existingMapData.length === 0 && !fetchState.isLoading && fetchState.districts.length === 0) {
      fetchAllStates();
    }
  }, [canFetchByState, existingMapData.length, fetchState.isLoading, fetchState.districts.length, fetchAllStates]);

  // No data and no way to fetch
  if (!mapData.length && !canFetchByState && !fetchState.isLoading) {
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
      {fetchState.isLoading && (
        <Stack gap="xs">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm">
              Loading districts: {fetchState.completedStates} / {fetchState.totalStates} states
              complete ({fetchState.computingStates} computing)
            </Text>
          </Group>
          <Progress value={progressPercent} size="sm" />
        </Stack>
      )}

      {/* Show completion message if fetched */}
      {isUsingFetchedData && !fetchState.isLoading && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Loaded {mapData.length} districts from {fetchState.completedStates} states
            {fetchState.errors.length > 0 && ` (${fetchState.errors.length} errors)`}
          </Text>
        </Group>
      )}

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
        />
      )}
    </Stack>
  );
}
