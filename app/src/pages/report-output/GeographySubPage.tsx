import {
  ShadcnTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { Geography } from '@/types/ingredients/Geography';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { capitalize } from '@/utils/stringUtils';

interface GeographySubPageProps {
  baselineGeography?: Geography;
  reformGeography?: Geography;
  baselineUserGeography?: UserGeographyPopulation;
  reformUserGeography?: UserGeographyPopulation;
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
  baselineUserGeography,
  reformUserGeography,
}: GeographySubPageProps) {
  if (!baselineGeography && !reformGeography) {
    return <div>No geography data available</div>;
  }

  // Check if geographies are the same
  const geographiesAreSame = baselineGeography?.id === reformGeography?.id;

  // Get labels from UserGeographyPopulation, fallback to geography names, then to generic labels
  const baselineLabel = baselineUserGeography?.label || baselineGeography?.name || 'Baseline';
  const reformLabel = reformUserGeography?.label || reformGeography?.name || 'Reform';

  // Define table rows
  const rows = [
    {
      label: 'Geographic area',
      baselineValue: baselineGeography?.name || '—',
      reformValue: reformGeography?.name || '—',
    },
    {
      label: 'Type',
      baselineValue: baselineGeography?.scope ? capitalize(baselineGeography.scope) : '—',
      reformValue: reformGeography?.scope ? capitalize(reformGeography.scope) : '—',
    },
  ];

  // Calculate column widths
  const labelColumnWidth = 45;
  const valueColumnWidth = geographiesAreSame ? 55 : 27.5;

  const thStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `${spacing.md} ${spacing.lg}`,
  };

  return (
    <div>
      <h2>Population information</h2>

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
              <TableHead style={{ ...thStyle, width: `${labelColumnWidth}%` }}>
                Property
              </TableHead>
              {geographiesAreSame ? (
                <TableHead
                  style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}
                >
                  {baselineLabel.toUpperCase()} (BASELINE / REFORM)
                </TableHead>
              ) : (
                <>
                  <TableHead
                    style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}
                  >
                    {baselineLabel.toUpperCase()} (BASELINE)
                  </TableHead>
                  <TableHead
                    style={{ ...thStyle, width: `${valueColumnWidth}%`, textAlign: 'right' }}
                  >
                    {reformLabel.toUpperCase()} (REFORM)
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                  <Text
                    className="tw:text-sm"
                    style={{ fontWeight: typography.fontWeight.medium }}
                  >
                    {row.label}
                  </Text>
                </TableCell>
                {geographiesAreSame ? (
                  <TableCell
                    style={{
                      textAlign: 'right',
                      padding: `${spacing.md} ${spacing.lg}`,
                    }}
                  >
                    <Text
                      className="tw:text-sm"
                      style={{
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                      }}
                    >
                      {row.baselineValue}
                    </Text>
                  </TableCell>
                ) : (
                  <>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text
                        className="tw:text-sm"
                        style={{
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        {row.baselineValue}
                      </Text>
                    </TableCell>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      <Text
                        className="tw:text-sm"
                        style={{
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        {row.reformValue}
                      </Text>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
