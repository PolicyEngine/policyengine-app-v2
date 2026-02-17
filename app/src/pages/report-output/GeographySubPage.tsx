import { Box, Table, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useRegions } from '@/hooks/useRegions';
import { Geography, isNationalGeography } from '@/types/ingredients/Geography';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';

interface GeographySubPageProps {
  baselineGeography?: Geography;
  reformGeography?: Geography;
}

/**
 * Get display scope label from geography using V2 API metadata
 */
function useGeographyDisplayInfo(
  geography: Geography | undefined,
  regions: ReturnType<typeof useRegions>['regions']
) {
  if (!geography) {
    return { label: '—', scopeLabel: '—' };
  }

  if (isNationalGeography(geography)) {
    return {
      label: getCountryLabel(geography.countryId),
      scopeLabel: 'National',
    };
  }

  return {
    label: getRegionLabel(geography.regionCode, regions),
    scopeLabel: getRegionTypeLabel(geography.countryId, geography.regionCode, regions),
  };
}

/**
 * GeographySubPage - Displays geography population information in Design 4 table format
 *
 * Shows baseline and reform geographies side-by-side in a comparison table.
 * Collapses columns when both simulations use the same geography.
 * Uses V2 API metadata to display human-readable region labels.
 */
export default function GeographySubPage({
  baselineGeography,
  reformGeography,
}: GeographySubPageProps) {
  // Get country ID from either geography (they should be the same country)
  const countryId = baselineGeography?.countryId || reformGeography?.countryId || 'us';

  // Fetch regions from V2 API
  const { regions, isLoading } = useRegions(countryId);

  if (!baselineGeography && !reformGeography) {
    return <div>No geography data available</div>;
  }

  // Get display info for both geographies
  const baselineInfo = useGeographyDisplayInfo(baselineGeography, regions);
  const reformInfo = useGeographyDisplayInfo(reformGeography, regions);

  // Check if geographies are the same by comparing regionCode
  const geographiesAreSame = baselineGeography?.regionCode === reformGeography?.regionCode;

  // Define table rows using labels from V2 API
  const rows = [
    {
      label: 'Geographic area',
      baselineValue: isLoading ? '...' : baselineInfo.label,
      reformValue: isLoading ? '...' : reformInfo.label,
    },
    {
      label: 'Type',
      baselineValue: isLoading ? '...' : baselineInfo.scopeLabel,
      reformValue: isLoading ? '...' : reformInfo.scopeLabel,
    },
  ];

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = geographiesAreSame ? 55 : 27.5;

  return (
    <div>
      <h2>Population information</h2>

      <Box
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.white,
          marginTop: spacing.xl,
        }}
      >
        <Table>
          <Table.Thead style={{ backgroundColor: colors.gray[50] }}>
            <Table.Tr>
              <Table.Th
                style={{
                  width: `${labelColumnWidth}%`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: `${spacing.md} ${spacing.lg}`,
                }}
              >
                Property
              </Table.Th>
              {geographiesAreSame ? (
                <Table.Th
                  style={{
                    width: `${valueColumnWidth}%`,
                    textAlign: 'right',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: `${spacing.md} ${spacing.lg}`,
                  }}
                >
                  {baselineInfo.label.toUpperCase()} (BASELINE / REFORM)
                </Table.Th>
              ) : (
                <>
                  <Table.Th
                    style={{
                      width: `${valueColumnWidth}%`,
                      textAlign: 'right',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    {baselineInfo.label.toUpperCase()} (BASELINE)
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: `${valueColumnWidth}%`,
                      textAlign: 'right',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    {reformInfo.label.toUpperCase()} (REFORM)
                  </Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.label}>
                <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <Text size="sm" fw={typography.fontWeight.medium}>
                    {row.label}
                  </Text>
                </Table.Td>
                {geographiesAreSame ? (
                  <Table.Td
                    style={{
                      textAlign: 'right',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                      {row.baselineValue}
                    </Text>
                  </Table.Td>
                ) : (
                  <>
                    <Table.Td
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                        {row.baselineValue}
                      </Text>
                    </Table.Td>
                    <Table.Td
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                        {row.reformValue}
                      </Text>
                    </Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </div>
  );
}
