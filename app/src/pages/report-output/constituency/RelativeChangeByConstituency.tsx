import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformConstituencyRelativeChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface RelativeChangeByConstituencyProps {
  output: SocietyWideReportOutput;
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
    // Type guard to ensure output is UK report with constituency data
    if (!('constituency_impact' in output)) {
      return [];
    }
    const constituencyData = (output as ReportOutputSocietyWideUK).constituency_impact
      ?.by_constituency;
    if (!constituencyData) {
      return [];
    }
    return transformConstituencyRelativeChange(constituencyData);
  }, [output]);

  // Generate summary statistics (same as average)
  const summary = useMemo(() => {
    if (!('constituency_impact' in output)) {
      return null;
    }
    const outcomes = (output as ReportOutputSocietyWideUK).constituency_impact?.outcomes_by_region
      ?.uk;
    if (!outcomes) {
      return null;
    }

    console.log('[RelativeChangeByConstituency] outcomes_by_region.uk:', outcomes);

    const gainers = outcomes['Gain more than 5%'] + outcomes['Gain less than 5%'];
    const losers = outcomes['Lose more than 5%'] + outcomes['Lose less than 5%'];
    const noChange = outcomes['No change'];

    console.log('[RelativeChangeByConstituency] Summary stats:', {
      gainers,
      losers,
      noChange,
      'Gain more than 5%': outcomes['Gain more than 5%'],
      'Gain less than 5%': outcomes['Gain less than 5%'],
      'Lose more than 5%': outcomes['Lose more than 5%'],
      'Lose less than 5%': outcomes['Lose less than 5%'],
      'No change': outcomes['No change'],
    });

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
        <Title order={3}>Relative Household Income Change by Constituency</Title>
        {summary && (
          <Text c="dimmed" size="sm" mt="xs">
            {summary.gainers} constituencies gain, {summary.losers} lose, {summary.noChange}{' '}
            unchanged
          </Text>
        )}
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
