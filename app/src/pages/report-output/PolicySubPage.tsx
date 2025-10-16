import { useSelector } from 'react-redux';
import { Box, Table, Text } from '@mantine/core';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import {
  determinePolicyColumns,
  extractPoliciesFromArray,
  collectUniqueParameterNames,
  getParameterValueFromPolicy,
  calculateColumnWidths,
  PolicyColumn,
} from '@/utils/policyTableHelpers';
import { colors, spacing, typography } from '@/designTokens';

interface PolicySubPageProps {
  policies?: Policy[];
  reportType: 'economy' | 'household';
}

/**
 * PolicySubPage - Displays policy information in Design 4 table format
 *
 * Shows all policies side-by-side in a comparison table with smart column
 * collapsing when policies are identical. Displays all parameters across
 * all policies in a unified view.
 */
export default function PolicySubPage({ policies }: PolicySubPageProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  // Extract baseline and reform from policies array
  const { baseline, reform } = extractPoliciesFromArray(policies);

  // Determine column structure with smart collapsing
  const columns = determinePolicyColumns(undefined, baseline, reform);

  // Collect all unique parameter names across all policies
  const paramList = collectUniqueParameterNames(policies);

  // Calculate column width percentages
  const { labelColumnWidth, valueColumnWidth } = calculateColumnWidths(columns.length);

  return (
    <div>
      <h2>Policy Information</h2>

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
            {/* Policy Title Row */}
            <Table.Tr>
              <Table.Th
                style={{
                  width: `${labelColumnWidth}%`,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.border.light}`,
                }}
              />
              {columns.map((column: PolicyColumn, idx: number) => (
                <Table.Th
                  key={idx}
                  style={{
                    width: `${valueColumnWidth}%`,
                    textAlign: 'right',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderBottom: `1px solid ${colors.border.light}`,
                  }}
                >
                  <Box>
                    {column.policyLabels.map((label: string, labelIdx: number) => (
                      <Text
                        key={labelIdx}
                        size="sm"
                        fw={typography.fontWeight.medium}
                        c={colors.text.primary}
                      >
                        {label}
                      </Text>
                    ))}
                  </Box>
                </Table.Th>
              ))}
            </Table.Tr>

            {/* Column Header Row */}
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
                Parameter
              </Table.Th>
              {columns.map((column: PolicyColumn, idx: number) => (
                <Table.Th
                  key={idx}
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
                  {column.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paramList.map((paramName: string) => {
              const metadata = parameters[paramName];
              const paramLabel = metadata?.label || paramName;

              // Get values for each column
              const columnValues = columns.map((column: PolicyColumn) => {
                // For merged columns, just use the first policy since they're equal
                const policy = column.policies[0];
                return getParameterValueFromPolicy(policy, paramName, parameters);
              });

              return (
                <Table.Tr key={paramName}>
                  <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                    <Box>
                      <Text size="sm" fw={typography.fontWeight.medium}>
                        {paramLabel}
                      </Text>
                      <Text size="xs" c={colors.text.secondary}>
                        {paramName}
                      </Text>
                    </Box>
                  </Table.Td>
                  {columnValues.map((value: string, idx: number) => (
                    <Table.Td
                      key={idx}
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text
                        size="sm"
                        fw={typography.fontWeight.medium}
                        c={colors.text.primary}
                      >
                        {value}
                      </Text>
                    </Table.Td>
                  ))}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>
    </div>
  );
}
