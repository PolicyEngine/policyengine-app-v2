import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformLocalAuthorityRelativeChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByLocalAuthorityProps {
  output: EconomicImpactResponse;
}

/**
 * Relative household income change by local authority
 *
 * Displays a hexagonal map showing the relative household income change
 * for each UK local authority as a percentage.
 */
export function RelativeChangeByLocalAuthority({ output }: RelativeChangeByLocalAuthorityProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    const localAuthorityData = output.local_authority_impact;
    if (!localAuthorityData?.length) {
      return [];
    }
    return transformLocalAuthorityRelativeChange(localAuthorityData);
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
        <Title order={3}>Relative household income change by local authority</Title>
      </div>

      <HexagonalMap
        data={hexMapData}
        config={{
          hexSize: 11,
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
      />
    </Stack>
  );
}
