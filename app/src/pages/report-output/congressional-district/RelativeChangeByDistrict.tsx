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
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

// TODO: Remove this mock data after API integration is complete
// Mostly positive values for better demo appearance
const MOCK_DISTRICT_DATA: USCongressionalDistrictBreakdown = {
  districts: [
    {
      district: 'AL-01',
      average_household_income_change: 312.45,
      relative_household_income_change: 0.0187,
    },
    {
      district: 'AL-02',
      average_household_income_change: 245.3,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'AL-03',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0156,
    },
    {
      district: 'AL-04',
      average_household_income_change: 189.2,
      relative_household_income_change: 0.0112,
    },
    {
      district: 'AL-05',
      average_household_income_change: 167.8,
      relative_household_income_change: 0.0095,
    },
    {
      district: 'AL-06',
      average_household_income_change: 423.15,
      relative_household_income_change: 0.0234,
    },
    {
      district: 'AL-07',
      average_household_income_change: 567.9,
      relative_household_income_change: 0.0389,
    },
    {
      district: 'AK-01',
      average_household_income_change: 334.5,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'AZ-01',
      average_household_income_change: 256.78,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'AZ-02',
      average_household_income_change: 189.45,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'AZ-03',
      average_household_income_change: 345.67,
      relative_household_income_change: 0.0212,
    },
    {
      district: 'AZ-04',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0163,
    },
    {
      district: 'AZ-05',
      average_household_income_change: 234.56,
      relative_household_income_change: 0.0145,
    },
    {
      district: 'AZ-06',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0107,
    },
    {
      district: 'AZ-07',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0298,
    },
    {
      district: 'AZ-08',
      average_household_income_change: 156.34,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'AZ-09',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CA-01',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CA-02',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'CA-03',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'CA-04',
      average_household_income_change: 145.67,
      relative_household_income_change: 0.0084,
    },
    {
      district: 'CA-05',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'CA-52',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0162,
    },
    {
      district: 'CO-01',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'CO-08',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0197,
    },
    {
      district: 'DE-01',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    {
      district: 'FL-01',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'FL-28',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'GA-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'GA-14',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    {
      district: 'NY-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'NY-26',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'TX-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'TX-38',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'ND-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'SD-01',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'VT-01',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'WY-01',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'DC-01',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
  ],
};

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
      // TODO: Remove mock data fallback and console.log after API integration
      console.log('[RelativeChangeByDistrict] Using MOCK data (no congressional_district_impact in output)');
      return transformDistrictRelativeChange(MOCK_DISTRICT_DATA, labelLookup);
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData) {
      // TODO: Remove mock data fallback and console.log after API integration
      console.log('[RelativeChangeByDistrict] Using MOCK data (congressional_district_impact is null)');
      return transformDistrictRelativeChange(MOCK_DISTRICT_DATA, labelLookup);
    }
    // TODO: Remove console.log after API integration
    console.log('[RelativeChangeByDistrict] Using REAL API data', { districtCount: districtData.districts.length });
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
