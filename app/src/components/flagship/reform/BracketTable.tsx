import { colors, spacing, typography } from '@/designTokens';
import { isEditableValue, sameParameterValue } from '@/libs/draftReform';
import { BracketLayout, ParameterGroupMember } from '@/libs/flagship/parameterGroups';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';
import ValueInput from './ValueInput';

interface BracketTableProps {
  brackets: BracketLayout;
  /** For each cell's accessible name: "Bracket 2 · rate, 2026". */
  members: ParameterGroupMember[];
  /** When the values apply — a year or a date range — for the cells' names. */
  period: string;
  parameters: ParameterMetadataCollection;
  /** The value in effect: the reform's where it sets one, current law otherwise. */
  valueAt: (path: string) => any;
  baselineAt: (path: string) => any;
  onChange: (path: string, value: any) => void;
  onFocus: (path: string) => void;
  /** A row under the brackets, e.g. how the schedule grows after its year. */
  footer?: { label: string; content: React.ReactNode };
}

/** What a threshold counts, where the box alone can't say: $ and % show in it. */
const THRESHOLD_UNITS: Record<string, string> = {
  child: 'children',
  person: 'people',
  month: 'months',
  hour: 'hours',
};

/**
 * A threshold's unit as the column says it. Thresholds in years are
 * nearly always ages; the few birth years say so in their path.
 */
function thresholdUnit(unit: string | null | undefined, path: string | undefined): string | null {
  if (unit === 'year') {
    return path?.includes('birth_year') ? 'birth year' : 'age';
  }
  return THRESHOLD_UNITS[String(unit)] ?? null;
}

const sameValue = (a: any, b: any) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) < 1e-9
    : sameParameterValue(a, b);

function columnHeading(field: string, unit: string | null | undefined, path?: string): string {
  if (field === 'threshold') {
    const counts = thresholdUnit(unit, path);
    return counts ? `Threshold (${counts})` : 'Threshold';
  }
  if (field === 'rate' || (field === 'amount' && unit === '/1')) {
    return 'Rate';
  }
  return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
}

/**
 * A schedule as its brackets: a row each, its threshold beside its
 * rate or amount — the way a schedule reads in law — rather than every
 * field as a loose row. Changed cells are tinted and say what they were.
 */
export default function BracketTable({
  brackets,
  members,
  period,
  parameters,
  valueAt,
  baselineAt,
  onChange,
  onFocus,
  footer,
}: BracketTableProps) {
  const pathOf = (field: string) => brackets.rows.find((row) => row.cells[field])?.cells[field];
  const unitOf = (field: string) => {
    const path = pathOf(field);
    return path ? parameters[path]?.unit : undefined;
  };
  const labelOf = (path: string) => members.find((member) => member.path === path)?.label ?? path;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          // Input-sized columns, not spread across the card.
          width: 'auto',
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <thead>
          <tr>
            <th />
            {brackets.fields.map((field) => (
              <th
                key={field}
                scope="col"
                style={{
                  padding: `0 ${spacing.xs} ${spacing.xs}`,
                  textAlign: 'left',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {columnHeading(field, unitOf(field), pathOf(field))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brackets.rows.map((row) => (
            <tr key={row.index} style={{ borderTop: `1px solid ${colors.border.light}` }}>
              <th
                scope="row"
                style={{
                  padding: `${spacing.md} ${spacing.lg} ${spacing.xs} 0`,
                  textAlign: 'left',
                  verticalAlign: 'top',
                  fontWeight: typography.fontWeight.normal,
                  color: colors.text.primary,
                  whiteSpace: 'nowrap',
                }}
              >
                Bracket {row.index + 1}
              </th>
              {brackets.fields.map((field) => {
                const path = row.cells[field];
                const param = path ? parameters[path] : undefined;
                if (!path || !param) {
                  return (
                    <td key={field} style={{ padding: spacing.xs, color: colors.text.tertiary }}>
                      —
                    </td>
                  );
                }
                const value = valueAt(path);
                const baseline = baselineAt(path);
                const changed = !sameValue(value, baseline);
                const baselineText = formatValue(baseline, param.unit ?? null);
                return (
                  <td
                    key={field}
                    title={`Current law: ${baselineText}`}
                    style={{ padding: spacing.xs, verticalAlign: 'top' }}
                  >
                    <div
                      aria-label={`${labelOf(path)}, ${period}`}
                      data-path={path}
                      onFocusCapture={() => onFocus(path)}
                      className={changed ? undefined : 'tw:[&_input]:text-gray-500'}
                      style={{
                        width: 160,
                        borderRadius: spacing.radius.container,
                        boxShadow: changed ? `0 0 0 2px ${colors.primary[200]}` : undefined,
                        background: changed ? colors.primary[50] : undefined,
                      }}
                    >
                      {isEditableValue(baseline) ? (
                        <ValueInput
                          param={param}
                          value={value}
                          onChange={(next) => onChange(path, next)}
                        />
                      ) : (
                        <span
                          style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
                        >
                          {baselineText}
                        </span>
                      )}
                    </div>
                    {changed && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.tertiary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        was {baselineText}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {footer && (
            <tr style={{ borderTop: `1px solid ${colors.border.light}` }}>
              <th
                scope="row"
                style={{
                  padding: `${spacing.md} ${spacing.lg} ${spacing.xs} 0`,
                  textAlign: 'left',
                  verticalAlign: 'top',
                  fontWeight: typography.fontWeight.normal,
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {footer.label}
              </th>
              <td colSpan={brackets.fields.length} style={{ padding: spacing.xs }}>
                {footer.content}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
