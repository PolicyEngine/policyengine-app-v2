import { Box, Table, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { EntityMember } from '@/utils/householdIndividuals';
import { formatVariableValue } from '@/utils/householdValues';

interface IndividualTableProps {
  baselineMember?: EntityMember;
  reformMember?: EntityMember;
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
  baselineMember,
  reformMember,
  baselineLabel,
  reformLabel,
  isSameHousehold,
}: IndividualTableProps) {
  // Collect all unique variable names from both baseline and reform
  const allParamNames = new Set<string>();
  baselineMember?.variables.forEach((v) => allParamNames.add(v.paramName));
  reformMember?.variables.forEach((v) => allParamNames.add(v.paramName));

  const sortedParamNames = Array.from(allParamNames).sort();

  if (sortedParamNames.length === 0) {
    return <Text c={colors.text.secondary}>No data available</Text>;
  }

  // Determine if we're showing a comparison or single household
  const hasReform = !!reformMember;
  const showComparison = !isSameHousehold && hasReform;

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = isSameHousehold || !hasReform ? 55 : 27.5;

  // Helper to find variable value and format it properly
  const findVariableValue = (member: EntityMember | undefined, paramName: string): string => {
    const variable = member?.variables.find((v) => v.paramName === paramName);
    if (!variable) {
      return '—';
    }

    // Use formatVariableValue with unit information from metadata
    if (typeof variable.value === 'number' && variable.unit) {
      // Use precision 1 for decimals, 0 for integers
      const DECIMAL_PRECISION = 1;
      const INTEGER_PRECISION = 0;
      const precision = Number.isInteger(variable.value) ? INTEGER_PRECISION : DECIMAL_PRECISION;
      return formatVariableValue({ unit: variable.unit }, variable.value, precision);
    }

    // Fallback for non-numeric or no unit
    if (typeof variable.value === 'number') {
      return variable.value.toLocaleString();
    }
    return String(variable.value);
  };

  return (
    <Box
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
        backgroundColor: colors.white,
      }}
    >
      <Table>
        <Table.Thead style={{ backgroundColor: colors.gray[50] }}>
          <Table.Tr>
            <TableHeaderCell width={`${labelColumnWidth}%`}>Variable</TableHeaderCell>
            {isSameHousehold ? (
              <MergedColumnHeader
                width={`${valueColumnWidth}%`}
                label={`${baselineLabel.toUpperCase()} (BASELINE / REFORM)`}
              />
            ) : showComparison ? (
              <>
                <BaselineColumnHeader
                  width={`${valueColumnWidth}%`}
                  label={`${baselineLabel.toUpperCase()} (BASELINE)`}
                />
                <ReformColumnHeader
                  width={`${valueColumnWidth}%`}
                  label={`${reformLabel.toUpperCase()} (REFORM)`}
                />
              </>
            ) : (
              <SingleColumnHeader
                width={`${valueColumnWidth}%`}
                label={baselineLabel.toUpperCase()}
              />
            )}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {sortedParamNames.map((paramName) => {
            // Get label from either baseline or reform
            const baselineVar = baselineMember?.variables.find((v) => v.paramName === paramName);
            const reformVar = reformMember?.variables.find((v) => v.paramName === paramName);
            const label = baselineVar?.label || reformVar?.label || paramName;

            const baselineValue = findVariableValue(baselineMember, paramName);
            const reformValue = findVariableValue(reformMember, paramName);

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
                  <ValueCell value={baselineValue} />
                ) : showComparison ? (
                  <>
                    <ValueCell value={baselineValue} />
                    <ValueCell value={reformValue} />
                  </>
                ) : (
                  <ValueCell value={baselineValue} />
                )}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

interface TableHeaderCellProps {
  width: string;
  children: React.ReactNode;
}

function TableHeaderCell({ width, children }: TableHeaderCellProps) {
  return (
    <Table.Th
      style={{
        width,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {children}
    </Table.Th>
  );
}

interface ColumnHeaderProps {
  width: string;
  label: string;
}

function MergedColumnHeader({ width, label }: ColumnHeaderProps) {
  return (
    <Table.Th
      style={{
        width,
        textAlign: 'right',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {label}
    </Table.Th>
  );
}

function BaselineColumnHeader({ width, label }: ColumnHeaderProps) {
  return (
    <Table.Th
      style={{
        width,
        textAlign: 'right',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {label}
    </Table.Th>
  );
}

function ReformColumnHeader({ width, label }: ColumnHeaderProps) {
  return (
    <Table.Th
      style={{
        width,
        textAlign: 'right',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {label}
    </Table.Th>
  );
}

function SingleColumnHeader({ width, label }: ColumnHeaderProps) {
  return (
    <Table.Th
      style={{
        width,
        textAlign: 'right',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {label}
    </Table.Th>
  );
}

interface ValueCellProps {
  value: string;
}

function ValueCell({ value }: ValueCellProps) {
  return (
    <Table.Td
      style={{
        textAlign: 'right',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      <Text size="sm" fw={typography.fontWeight.medium} c={colors.text.primary}>
        {value}
      </Text>
    </Table.Td>
  );
}
