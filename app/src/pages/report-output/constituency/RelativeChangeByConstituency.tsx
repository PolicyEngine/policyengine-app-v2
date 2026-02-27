import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformConstituencyRelativeChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByConstituencyProps {
  output: EconomicImpactResponse;
}

/**
 * Relative household income change by parliamentary constituency
 *
 * Displays a hexagonal map showing the relative household income change
 * for each UK parliamentary constituency as a percentage.
 */
export function RelativeChangeByConstituency({ output }: RelativeChangeByConstituencyProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    const constituencyData = output.constituency_impact;
    if (!constituencyData?.length) {
      return [];
    }
    return transformConstituencyRelativeChange(constituencyData);
  }, [output]);

  if (!hexMapData.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">No constituency data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Relative household income change by constituency</Title>
      </div>

      <HexagonalMap
        data={hexMapData}
        config={{
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
