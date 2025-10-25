import { Box, Table, Text } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { extractHouseholdInputs, householdsAreEqual } from '@/utils/householdTableData';
import { colors, spacing, typography } from '@/designTokens';

interface HouseholdSubPageProps {
  baselineHousehold?: Household;
  reformHousehold?: Household;
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * HouseholdSubPage - Displays household population information in Design 4 table format
 *
 * Shows baseline and reform households side-by-side in a comparison table.
 * Displays all configured input values extracted from householdData.
 * Collapses columns when both simulations use the same household.
 */
export default function HouseholdSubPage({
  baselineHousehold,
  reformHousehold,
  userHouseholds,
}: HouseholdSubPageProps) {
  if (!baselineHousehold && !reformHousehold) {
    return <div>No household data available</div>;
  }

  // Check if households are the same
  const householdsSame = householdsAreEqual(baselineHousehold, reformHousehold);

  // Extract inputs from both households
  const baselineInputs = baselineHousehold ? extractHouseholdInputs(baselineHousehold) : [];
  const reformInputs = reformHousehold ? extractHouseholdInputs(reformHousehold) : [];

  // Collect all unique input keys (category + paramName)
  const allInputKeys = new Set<string>();
  baselineInputs.forEach((input) => allInputKeys.add(`${input.category}::${input.paramName}`));
  reformInputs.forEach((input) => allInputKeys.add(`${input.category}::${input.paramName}`));

  // Convert to sorted array for consistent ordering
  const sortedInputKeys = Array.from(allInputKeys).sort();

  // Helper to find input value
  const findInputValue = (
    inputs: ReturnType<typeof extractHouseholdInputs>,
    category: string,
    paramName: string
  ): string => {
    const input = inputs.find((i) => i.category === category && i.paramName === paramName);
    if (!input) return '—';

    // Format the value
    if (typeof input.value === 'number') {
      return input.value.toLocaleString();
    }
    return String(input.value);
  };

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = householdsSame ? 55 : 27.5;

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
                Input Variable
              </Table.Th>
              {householdsSame ? (
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
                  Baseline / Reform
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
                    Baseline
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
                    Reform
                  </Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {sortedInputKeys.map((key) => {
              const [category, paramName] = key.split('::');

              // Get label from either baseline or reform inputs
              const baselineInput = baselineInputs.find(
                (i) => i.category === category && i.paramName === paramName
              );
              const reformInput = reformInputs.find(
                (i) => i.category === category && i.paramName === paramName
              );
              const label = baselineInput?.label || reformInput?.label || paramName;

              const baselineValue = findInputValue(baselineInputs, category, paramName);
              const reformValue = findInputValue(reformInputs, category, paramName);

              return (
                <Table.Tr key={key}>
                  <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                    <Text size="sm" fw={typography.fontWeight.medium}>
                      {category} - {label}
                    </Text>
                  </Table.Td>
                  {householdsSame ? (
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
    </div>
  );
}
