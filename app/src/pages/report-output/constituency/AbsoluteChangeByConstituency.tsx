import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformConstituencyAbsoluteChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByConstituencyProps {
  output: EconomicImpactResponse;
}

/**
 * Absolute household income change by parliamentary constituency
 *
 * Displays a hexagonal map showing the absolute household income change
 * for each UK parliamentary constituency in currency terms.
 */
export function AbsoluteChangeByConstituency({ output }: AbsoluteChangeByConstituencyProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    const constituencyData = output.constituency_impact;
    if (!constituencyData?.length) {
      return [];
    }
    return transformConstituencyAbsoluteChange(constituencyData);
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
        <Title order={3}>Absolute household income change by constituency</Title>
      </div>

      <HexagonalMap
        data={hexMapData}
        config={{
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
