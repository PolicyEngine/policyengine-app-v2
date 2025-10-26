import { Box, Table, Text } from '@mantine/core';
import { Geography } from '@/types/ingredients/Geography';
import { colors, spacing, typography } from '@/designTokens';

interface GeographySubPageProps {
  baselineGeography?: Geography;
  reformGeography?: Geography;
}

/**
 * GeographySubPage - Displays geography population information in Design 4 table format
 *
 * Shows baseline and reform geographies side-by-side in a comparison table.
 * Collapses columns when both simulations use the same geography.
 */
export default function GeographySubPage({
  baselineGeography,
  reformGeography,
}: GeographySubPageProps) {
  if (!baselineGeography && !reformGeography) {
    return <div>No geography data available</div>;
  }

  // Check if geographies are the same
  const geographiesAreSame = baselineGeography?.id === reformGeography?.id;

  // Get labels from geography names, fallback to generic labels
  const baselineLabel = baselineGeography?.name || 'Baseline';
  const reformLabel = reformGeography?.name || 'Reform';

  // Define table rows
  const rows = [
    {
      label: 'Geography ID',
      baselineValue: baselineGeography?.geographyId || '—',
      reformValue: reformGeography?.geographyId || '—',
    },
    {
      label: 'Name',
      baselineValue: baselineGeography?.name || '—',
      reformValue: reformGeography?.name || '—',
    },
    {
      label: 'Country',
      baselineValue: baselineGeography?.countryId || '—',
      reformValue: reformGeography?.countryId || '—',
    },
    {
      label: 'Scope',
      baselineValue: baselineGeography?.scope || '—',
      reformValue: reformGeography?.scope || '—',
    },
  ];

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = geographiesAreSame ? 55 : 27.5;

  return (
    <div>
      <h2>Population Information</h2>

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
