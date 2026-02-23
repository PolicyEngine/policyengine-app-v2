import { useMemo, useRef } from 'react';
import { transformConstituencyAbsoluteChange } from '@/adapters/constituency/constituencyDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import { Group, Stack, Text, Title } from '@/components/ui';
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
  const mapRef = useRef<HTMLDivElement>(null);
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
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Title order={3} style={{ flex: 1 }}>
          Absolute household income change by constituency
        </Title>
        <MapDownloadMenu mapRef={mapRef} filename="absolute-change-by-constituency" />
      </Group>

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
        exportRef={mapRef}
      />
    </Stack>
  );
}
