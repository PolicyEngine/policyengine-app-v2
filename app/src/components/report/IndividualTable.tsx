import { Box, Table, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { Individual } from '@/utils/householdIndividuals';

interface IndividualTableProps {
  baselineIndividual?: Individual;
  reformIndividual?: Individual;
  baselineLabel: string;
  reformLabel: string;
  isSameHousehold: boolean;
}

/**
 * IndividualTable - Displays an individual's variables with baseline/reform comparison
 *
 * Shows variable names in the left column and baseline/reform values in right columns.
 * Used within HouseholdSubPage to display each person's data.
 */
export default function IndividualTable({
  baselineIndividual,
  reformIndividual,
  baselineLabel,
  reformLabel,
  isSameHousehold
}: IndividualTableProps) {
  // Collect all unique variable names from both baseline and reform
  const allParamNames = new Set<string>();
  baselineIndividual?.variables.forEach((v) => allParamNames.add(v.paramName));
  reformIndividual?.variables.forEach((v) => allParamNames.add(v.paramName));

  const sortedParamNames = Array.from(allParamNames).sort();

  if (sortedParamNames.length === 0) {
    return <Text c={colors.text.secondary}>No data available</Text>;
  }

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = isSameHousehold ? 55 : 27.5;

  // Helper to find variable value
  const findVariableValue = (individual: Individual | undefined, paramName: string): string => {
    const variable = individual?.variables.find((v) => v.paramName === paramName);
    if (!variable) return '—';

    if (typeof variable.value === 'number') {
      return variable.value.toLocaleString();
    }
    return String(variable.value);
  };

  return (
    <Box
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.white,
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
              Variable
            </Table.Th>
            {isSameHousehold ? (
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
          {sortedParamNames.map((paramName) => {
            // Get label from either baseline or reform
            const baselineVar = baselineIndividual?.variables.find((v) => v.paramName === paramName);
            const reformVar = reformIndividual?.variables.find((v) => v.paramName === paramName);
            const label = baselineVar?.label || reformVar?.label || paramName;

            const baselineValue = findVariableValue(baselineIndividual, paramName);
            const reformValue = findVariableValue(reformIndividual, paramName);

            return (
              <Table.Tr key={paramName}>
                <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <Text size="sm" fw={typography.fontWeight.medium}>
                    {label}
                  </Text>
                  <Text size="xs" c={colors.text.secondary}>
                    {paramName}
                  </Text>
                </Table.Td>
                {isSameHousehold ? (
                  <Table.Td
                    style={{
                      textAlign: 'right',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                      {baselineValue}
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
                        {baselineValue}
                      </Text>
                    </Table.Td>
                    <Table.Td
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                        {reformValue}
                      </Text>
                    </Table.Td>
                  </>
                )}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
