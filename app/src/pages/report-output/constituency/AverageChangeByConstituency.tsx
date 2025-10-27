import { useMemo } from 'react';
import { Stack, Title, Text } from '@mantine/core';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import { transformConstituencyAverageChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import type { MetadataState } from '@/types/metadata';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_BLUE } from '@/utils/visualization/colorScales';

interface AverageChangeByConstituencyProps {
  output: ReportOutputSocietyWideUK;
  metadata: MetadataState;
}

/**
 * Average household income change by parliamentary constituency
 *
 * Displays a hexagonal map showing the average household income change
 * for each UK parliamentary constituency in absolute currency terms.
 */
export function AverageChangeByConstituency({
  output,
  metadata,
}: AverageChangeByConstituencyProps) {
  // Transform API data to hexagonal map format
  const hexMapData = useMemo(() => {
    const constituencyData = output.constituency_impact?.by_constituency;
    if (!constituencyData) return [];
    return transformConstituencyAverageChange(constituencyData);
  }, [output]);

  // Generate summary statistics
  const summary = useMemo(() => {
    const outcomes = output.constituency_impact?.outcomes_by_region?.uk;
    if (!outcomes) return null;

    const gainers =
      outcomes['Gain more than 5%'] + outcomes['Gain less than 5%'];
    const losers =
      outcomes['Lose more than 5%'] + outcomes['Lose less than 5%'];
    const noChange = outcomes['No change'];

    return { gainers, losers, noChange };
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
        <Title order={3}>Average Household Income Change by Constituency</Title>
        {summary && (
          <Text c="dimmed" size="sm" mt="xs">
            {summary.gainers} constituencies gain, {summary.losers} lose,{' '}
            {summary.noChange} unchanged
          </Text>
        )}
      </div>

      <HexagonalMap
        data={hexMapData}
        countryId={metadata.countryId}
        config={{
          colorScale: {
            colors: DIVERGING_GRAY_BLUE.colors,
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
