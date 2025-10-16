import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Table, Text } from '@mantine/core';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  determinePolicyColumns,
  extractPoliciesFromArray,
  collectUniqueParameterNames,
  getParameterValueFromPolicy,
  calculateColumnWidths,
  PolicyColumn,
} from '@/utils/policyTableHelpers';
import {
  getHierarchicalLabels,
  buildCompactLabel,
  formatLabelParts,
} from '@/utils/parameterLabels';
import { colors, spacing, typography } from '@/designTokens';

interface PolicySubPageProps {
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  reportType: 'economy' | 'household';
}

/**
 * PolicySubPage - Displays policy information in Design 4 table format
 *
 * Shows all policies side-by-side in a comparison table with smart column
 * collapsing when policies are identical. Displays all parameters across
 * all policies in a unified view.
 */
export default function PolicySubPage({ policies, userPolicies }: PolicySubPageProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  // Extract baseline and reform from policies array
  const { baseline, reform } = extractPoliciesFromArray(policies);

  // Helper to get user-specified policy name
  const getPolicyLabel = (policy: Policy | undefined): string => {
    if (!policy) return 'Unnamed Policy';
    const userPolicy = userPolicies?.find(up => up.policyId === policy.id);
    return userPolicy?.label || policy.label || 'Unnamed Policy';
  };

  // Determine column structure with smart collapsing
  const columns = determinePolicyColumns(undefined, baseline, reform);

  // Collect all unique parameter names across all policies
  const paramList = collectUniqueParameterNames(policies);

  // Calculate column width percentages
  const { labelColumnWidth, valueColumnWidth } = calculateColumnWidths(columns.length);

  const toggleExpanded = (paramName: string) => {
    setExpandedParams((prev) => {
      const next = new Set(prev);
      if (next.has(paramName)) {
        next.delete(paramName);
      } else {
        next.add(paramName);
      }
      return next;
    });
  };

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
              {columns.map((column: PolicyColumn, idx: number) => {
                // Build header text: "Policy Name (BASELINE)" or "Policy Name (BASELINE / REFORM)"
                // Use user-specified names from userPolicies, not the base policy label
                const policyNames = column.policies.map(p => getPolicyLabel(p));
                const roleLabels = column.label.toUpperCase().split(' / ');

                // If single policy, show "Name (ROLE)"
                // If merged, show "Name (ROLE1 / ROLE2)"
                const headerText = policyNames.length === 1
                  ? `${policyNames[0].toUpperCase()} (${roleLabels[0]})`
                  : `${policyNames[0].toUpperCase()} (${roleLabels.join(' / ')})`;

                return (
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
                    {headerText}
                  </Table.Th>
                );
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paramList.map((paramName: string) => {
              const metadata = parameters[paramName];

              // Build hierarchical label with chaining
              const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
              const isExpanded = expandedParams.has(paramName);
              const { displayParts, hasMore } = buildCompactLabel(hierarchicalLabels);
              const finalParts = isExpanded && hasMore ? hierarchicalLabels : displayParts;
              const displayLabel = formatLabelParts(finalParts);

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
                        {displayLabel.split(' → ').map((part, i, arr) => (
                          <span key={i}>
                            {part === '...' ? (
                              <Text
                                span
                                style={{ cursor: 'pointer', color: colors.primary[700] }}
                                onClick={() => toggleExpanded(paramName)}
                              >
                                ...
                              </Text>
                            ) : (
                              part
                            )}
                            {i < arr.length - 1 && ' → '}
                          </span>
                        ))}
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
