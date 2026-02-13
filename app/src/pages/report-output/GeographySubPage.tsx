import { Box, Table, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { Geography, isNationalGeography } from '@/types/ingredients/Geography';

interface GeographySubPageProps {
  baselineGeography?: Geography;
  reformGeography?: Geography;
}

/**
 * Get display scope (national/subnational) from geography
 */
function getGeographyScope(geography: Geography | undefined): string {
  if (!geography) return '—';
  return isNationalGeography(geography) ? 'National' : 'Subnational';
}

/**
 * GeographySubPage - Displays geography population information in Design 4 table format
 *
 * Shows baseline and reform geographies side-by-side in a comparison table.
 * Collapses columns when both simulations use the same geography.
 *
 * TODO (Phase 6.2): Look up display labels from region metadata using regionCode
 * Currently displays regionCode directly as a fallback.
 */
export default function GeographySubPage({
  baselineGeography,
  reformGeography,
}: GeographySubPageProps) {
  if (!baselineGeography && !reformGeography) {
    return <div>No geography data available</div>;
  }

  // Check if geographies are the same by comparing regionCode
  const geographiesAreSame = baselineGeography?.regionCode === reformGeography?.regionCode;

  // Get labels - TODO (Phase 6.2): look up from region metadata
  const baselineLabel = baselineGeography?.regionCode || 'Baseline';
  const reformLabel = reformGeography?.regionCode || 'Reform';

  // Define table rows
  const rows = [
    {
      label: 'Geographic area',
      baselineValue: baselineGeography?.regionCode || '—',
      reformValue: reformGeography?.regionCode || '—',
    },
    {
      label: 'Type',
      baselineValue: getGeographyScope(baselineGeography),
      reformValue: getGeographyScope(reformGeography),
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
                  {baselineLabel.toUpperCase()} (BASELINE / REFORM)
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
                    {baselineLabel.toUpperCase()} (BASELINE)
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
                    {reformLabel.toUpperCase()} (REFORM)
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
