import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformLocalAuthorityAbsoluteChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByLocalAuthorityProps {
  output: EconomicImpactResponse;
}

/**
 * Absolute household income change by local authority
 *
 * Displays a hexagonal map showing the absolute household income change
 * for each UK local authority in currency terms.
 */
export function AbsoluteChangeByLocalAuthority({ output }: AbsoluteChangeByLocalAuthorityProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    const localAuthorityData = output.local_authority_impact;
    if (!localAuthorityData?.length) {
      return [];
    }
    return transformLocalAuthorityAbsoluteChange(localAuthorityData);
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
        <Title order={3}>Absolute household income change by local authority</Title>
      </div>

      <HexagonalMap
        data={hexMapData}
        config={{
          hexSize: 11,
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
