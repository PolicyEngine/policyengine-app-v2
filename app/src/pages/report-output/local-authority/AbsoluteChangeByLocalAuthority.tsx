import { useMemo, useRef } from 'react';
import { transformLocalAuthorityAbsoluteChange } from '@/adapters/local-authority/localAuthorityDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import { Group, Stack, Text, Title } from '@/components/ui';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

interface AbsoluteChangeByLocalAuthorityProps {
  output: SocietyWideReportOutput;
}

/**
 * Absolute household income change by local authority
 *
 * Displays a hexagonal map showing the absolute household income change
 * for each UK local authority in currency terms.
 */
export function AbsoluteChangeByLocalAuthority({ output }: AbsoluteChangeByLocalAuthorityProps) {
  const mapRef = useRef<HTMLDivElement>(null);
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
    return transformLocalAuthorityAbsoluteChange(localAuthorityData);
  }, [output]);

  if (!hexMapData.length) {
    return (
      <Stack align="center" justify="center" style={{ height: 400 }}>
        <Text c="dimmed">No local authority data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="start" wrap="nowrap">
        <Title order={3} style={{ flex: 1 }}>
          Absolute household income change by local authority
        </Title>
        <MapDownloadMenu mapRef={mapRef} filename="absolute-change-by-local-authority" />
      </Group>

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
        exportRef={mapRef}
      />
    </Stack>
  );
}
