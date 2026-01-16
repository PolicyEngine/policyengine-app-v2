import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Stack, Text, Title } from '@mantine/core';
import {
  buildDistrictLabelLookup,
  transformDistrictRelativeChange,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import type { RootState } from '@/store';
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
 */
export function RelativeChangeByDistrict({ output }: RelativeChangeByDistrictProps) {
  // Get district labels from metadata
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Build label lookup from metadata (memoized)
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Transform API data to choropleth map format
  const mapData = useMemo(() => {
    // Type guard to ensure output is US report with district data
    if (!('congressional_district_impact' in output)) {
      return [];
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData) {
      return [];
    }
    return transformDistrictRelativeChange(districtData, labelLookup);
  }, [output, labelLookup]);

  if (!mapData.length) {
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
    </Stack>
  );
}
