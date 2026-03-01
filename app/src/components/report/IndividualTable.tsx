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
    return <p className="tw:text-gray-500">No data available</p>;
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

  const thStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `${spacing.md} ${spacing.lg}`,
  };

  return (
    <div
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
        backgroundColor: colors.white,
      }}
    >
      <table className="tw:w-full">
        <thead style={{ backgroundColor: colors.gray[50] }}>
          <tr>
            <th style={{ ...thStyle, width: `${labelColumnWidth}%`, textAlign: 'left' }}>
              Variable
            </th>
            {isSameHousehold ? (
              <th style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}>
                {`${baselineLabel.toUpperCase()} (BASELINE / REFORM)`}
              </th>
            ) : showComparison ? (
              <>
                <th style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}>
                  {`${baselineLabel.toUpperCase()} (BASELINE)`}
                </th>
                <th style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}>
                  {`${reformLabel.toUpperCase()} (REFORM)`}
                </th>
              </>
            ) : (
              <th style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}>
                {baselineLabel.toUpperCase()}
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedParamNames.map((paramName) => {
            // Get label from either baseline or reform
            const baselineVar = baselineMember?.variables.find((v) => v.paramName === paramName);
            const reformVar = reformMember?.variables.find((v) => v.paramName === paramName);
            const label = baselineVar?.label || reformVar?.label || paramName;

            const baselineValue = findVariableValue(baselineMember, paramName);
            const reformValue = findVariableValue(reformMember, paramName);

            return (
              <tr key={paramName}>
                <td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <p className="tw:text-sm tw:font-medium">{label}</p>
                  <p className="tw:text-xs tw:text-gray-500">{paramName}</p>
                </td>
                {isSameHousehold ? (
                  <td style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}>
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {baselineValue}
                    </span>
                  </td>
                ) : showComparison ? (
                  <>
                    <td style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}>
                      <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                        {baselineValue}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}>
                      <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                        {reformValue}
                      </span>
                    </td>
                  </>
                ) : (
                  <td style={{ textAlign: 'right', padding: `${spacing.md} ${spacing.lg}` }}>
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {baselineValue}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
