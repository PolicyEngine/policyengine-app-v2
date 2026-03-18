import { useState } from 'react';
import {
  ShadcnTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import {
  buildCompactLabel,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';
import { PolicyColumn } from '@/utils/policyTableHelpers';

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
  const thStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `${spacing.md} ${spacing.lg}`,
  };

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
    <div
      className="tw:mt-xl tw:overflow-hidden"
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        backgroundColor: colors.white,
      }}
    >
      <Table>
        <TableHeader style={{ backgroundColor: colors.gray[50] }}>
          <TableRow>
            <TableHead style={{ ...thStyle, width: `${labelColumnWidth}%` }}>Parameter</TableHead>
            {needsCurrentLawColumn && (
              <TableHead style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}>
                CURRENT LAW
              </TableHead>
            )}
            {columns.map((column, idx) => (
              <TableHead
                key={idx}
                style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}
              >
                {renderColumnHeader(column, idx)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {parameterNames.map((paramName: string) => {
            // Build hierarchical label with chaining
            const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
            const isExpanded = expandedParams.has(paramName);
            const { displayParts, hasMore } = buildCompactLabel(hierarchicalLabels);
            const finalParts = isExpanded && hasMore ? hierarchicalLabels : displayParts;
            const displayLabel = formatLabelParts(finalParts);

            return (
              <TableRow key={paramName}>
                <TableCell style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <div>
                    <p className="tw:text-sm tw:font-medium">
                      {displayLabel.split(' → ').map((part, i, arr) => (
                        <span key={i}>
                          {part === '...' ? (
                            <span
                              role="button"
                              tabIndex={0}
                              className="tw:cursor-pointer"
                              style={{ color: colors.primary[700] }}
                              onClick={() => toggleExpanded(paramName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleExpanded(paramName);
                                }
                              }}
                            >
                              ...
                            </span>
                          ) : (
                            part
                          )}
                          {i < arr.length - 1 && ' → '}
                        </span>
                      ))}
                    </p>
                    <p className="tw:text-xs tw:text-gray-500">{paramName}</p>
                  </div>
                </TableCell>
                {needsCurrentLawColumn && (
                  <TableCell style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}>
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {renderCurrentLawValue(paramName)}
                    </span>
                  </TableCell>
                )}
                {columns.map((column, idx) => (
                  <TableCell
                    key={idx}
                    style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}
                  >
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {renderColumnValue(column, paramName)}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
