import { useState } from 'react';
import { Box, Table, Text } from '@mantine/core';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyColumn } from '@/utils/policyTableHelpers';
import {
  getHierarchicalLabels,
  buildCompactLabel,
  formatLabelParts,
} from '@/utils/parameterLabels';
import { colors, spacing, typography } from '@/designTokens';

interface ParameterTableProps {
  parameterNames: string[];
  parameters: Record<string, ParameterMetadata>;
  columns: PolicyColumn[];
  needsCurrentLawColumn: boolean;
  labelColumnWidth: number;
  valueColumnWidth: number;
  renderColumnHeader: (column: PolicyColumn, idx: number) => React.ReactNode;
  renderCurrentLawValue: (paramName: string) => string;
  renderColumnValue: (column: PolicyColumn, paramName: string) => string;
}

/**
 * ParameterTable - Reusable table component for displaying policy/dynamics parameters
 *
 * Displays parameters with hierarchical labels, expandable breadcrumbs,
 * and baseline/reform comparison columns.
 */
export default function ParameterTable({
  parameterNames,
  parameters,
  columns,
  needsCurrentLawColumn,
  labelColumnWidth,
  valueColumnWidth,
  renderColumnHeader,
  renderCurrentLawValue,
  renderColumnValue,
}: ParameterTableProps) {
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

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
            {needsCurrentLawColumn && (
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
                CURRENT LAW
              </Table.Th>
            )}
            {columns.map((column, idx) => (
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
                {renderColumnHeader(column, idx)}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {parameterNames.map((paramName: string) => {
            // Build hierarchical label with chaining
            const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
            const isExpanded = expandedParams.has(paramName);
            const { displayParts, hasMore } = buildCompactLabel(hierarchicalLabels);
            const finalParts = isExpanded && hasMore ? hierarchicalLabels : displayParts;
            const displayLabel = formatLabelParts(finalParts);

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
                {needsCurrentLawColumn && (
                  <Table.Td
                    style={{
                      textAlign: 'right',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    <Text
                      size="sm"
                      fw={typography.fontWeight.medium}
                      c={colors.text.secondary}
                    >
                      {renderCurrentLawValue(paramName)}
                    </Text>
                  </Table.Td>
                )}
                {columns.map((column, idx) => (
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
                      {renderColumnValue(column, paramName)}
                    </Text>
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
