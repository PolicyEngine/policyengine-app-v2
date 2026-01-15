import { useMemo } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import { transformConstituencyAverageChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByConstituencyProps {
  output: SocietyWideReportOutput;
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
    // Type guard to ensure output is UK report with constituency data
    if (!('constituency_impact' in output)) {
      return [];
    }
    const constituencyData = (output as ReportOutputSocietyWideUK).constituency_impact
      ?.by_constituency;
    if (!constituencyData) {
      return [];
    }
    return transformConstituencyAverageChange(constituencyData);
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
