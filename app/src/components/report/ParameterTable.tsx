import { useState } from 'react';
import { Box, Table, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterMetadata } from '@/types/metadata';
import {
  buildCompactLabel,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';
import { PolicyColumn } from '@/utils/policyTableHelpers';

interface TableHeaderProps {
  width: string;
  align?: 'left' | 'right';
  children: React.ReactNode;
}

function TableHeader({ width, align = 'left', children }: TableHeaderProps) {
  return (
    <Table.Th
      style={{
        width,
        textAlign: align,
      }}
    >
      {children}
    </Table.Th>
  );
}

interface TableCellProps {
  align?: 'left' | 'right';
  children: React.ReactNode;
}

function TableCell({ align = 'left', children }: TableCellProps) {
  return (
    <Table.Td
      style={{
        textAlign: align,
      }}
    >
      {children}
    </Table.Td>
  );
}

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
        marginTop: spacing.xl,
      }}
    >
      <Table variant="parameterTable">
        <Table.Thead>
          <Table.Tr>
            <TableHeader width={`${labelColumnWidth}%`}>Parameter</TableHeader>
            {needsCurrentLawColumn && (
              <TableHeader width={`${valueColumnWidth}%`} align="right">
                CURRENT LAW
              </TableHeader>
            )}
            {columns.map((column, idx) => (
              <TableHeader key={idx} width={`${valueColumnWidth}%`} align="right">
                {renderColumnHeader(column, idx)}
              </TableHeader>
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
                <TableCell>
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
                </TableCell>
                {needsCurrentLawColumn && (
                  <TableCell align="right">
                    <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                      {renderCurrentLawValue(paramName)}
                    </Text>
                  </TableCell>
                )}
                {columns.map((column, idx) => (
                  <TableCell key={idx} align="right">
                    <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
                      {renderColumnValue(column, paramName)}
                    </Text>
                  </TableCell>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
