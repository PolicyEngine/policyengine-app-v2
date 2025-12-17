import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformLocalAuthorityAverageChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AverageChangeByLocalAuthorityProps {
  output: SocietyWideReportOutput;
}

/**
 * Average household income change by local authority
 *
 * Displays a hexagonal map showing the average household income change
 * for each UK local authority in absolute currency terms.
 */
export function AverageChangeByLocalAuthority({ output }: AverageChangeByLocalAuthorityProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    // Type guard to ensure output is UK report with local authority data
    if (!('local_authority_impact' in output)) {
      return [];
    }
    const localAuthorityData = (output as ReportOutputSocietyWideUK).local_authority_impact
      ?.by_local_authority;
    if (!localAuthorityData) {
      return [];
    }
    return transformLocalAuthorityAverageChange(localAuthorityData);
  }, [output]);

  if (!hexMapData.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">No local authority data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Average household income change by local authority</Title>
      </div>

      <HexagonalMap
        data={hexMapData}
        config={{
          hexSize: 18,
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
      />
    </Stack>
  );
}
