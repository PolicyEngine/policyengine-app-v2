import { colors, spacing, typography } from '@/designTokens';
import { isEditableValue, sameParameterValue } from '@/libs/draftReform';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';
import ValueInput from './ValueInput';

export interface ValueGridMember {
  path: string;
  label: string;
}

interface ValueGridProps {
  members: ValueGridMember[];
  /** One column per year; with `openEnded`, the last runs on from its year. */
  years: number[];
  /** Column headings in place of the years, e.g. a date range. */
  headers?: string[];
  openEnded: boolean;
  parameters: ParameterMetadataCollection;
  /** The value in effect: the reform's where it sets one, current law otherwise. */
  valueAt: (path: string, year: number) => any;
  baselineAt: (path: string, year: number) => any;
  onChange: (path: string, year: number, value: any) => void;
  focusedPath: string;
  onFocus: (path: string) => void;
  /** Later years shown read-only after the edited ones: what a growth makes of the value. */
  previewYears?: number[];
  /** A row under the values, aligned to the grid, e.g. how a value grows after its year. */
  footer?: { label: string; content: React.ReactNode };
}

const sameValue = (a: any, b: any) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) < 1e-9
    : sameParameterValue(a, b);

const labelCell: React.CSSProperties = {
  textAlign: 'left',
  fontWeight: typography.fontWeight.normal,
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
};

const cellPadding = `${spacing.xs} ${spacing.xs}`;

/**
 * Years across, values down, edited in place. Every cell starts at what
 * is in effect, so the grid reads as the schedule itself, and changed
 * cells are tinted. A lone parameter shows current law as its own row
 * above; a breakdown has a row per member, so each changed cell says
 * what it was underneath instead. Preview years follow read-only — what
 * the value becomes later — and a footer row can say how it gets there.
 */
export default function ValueGrid({
  members,
  years,
  headers,
  openEnded,
  parameters,
  valueAt,
  baselineAt,
  onChange,
  focusedPath,
  onFocus,
  previewYears = [],
  footer,
}: ValueGridProps) {
  const lone = members.length === 1;
  const allYears = [...years, ...previewYears];
  const lastIndex = allYears.length - 1;
  // The last column runs on from its year; the hover says so, the heading stays a year.
  const header = (year: number, index: number) => headers?.[index] ?? String(year);
  const wide = allYears.length > 1;
  const previewCell: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.sm} ${spacing.xs}`,
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
    fontSize: typography.fontSize.sm,
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          // One column stays input-sized rather than spanning the card.
          width: wide ? '100%' : 'auto',
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <thead>
          <tr>
            <th style={{ width: lone ? 96 : wide ? '22%' : undefined }} />
            {allYears.map((year, index) => (
              <th
                key={year}
                scope="col"
                title={
                  (openEnded || previewYears.length > 0) && index === lastIndex
                    ? `${year} and later`
                    : undefined
                }
                style={{
                  padding: `0 ${spacing.xs} ${spacing.xs}`,
                  textAlign: 'left',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {header(year, index)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lone && parameters[members[0].path] && (
            <tr>
              <th
                scope="row"
                style={{
                  ...labelCell,
                  padding: `${spacing.xs} ${spacing.md} ${spacing.sm} 0`,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                Current law
              </th>
              {allYears.map((year) => (
                <td
                  key={year}
                  style={{
                    padding: `${spacing.xs} ${spacing.xs} ${spacing.sm}`,
                    color: colors.text.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatValue(
                    baselineAt(members[0].path, year),
                    parameters[members[0].path].unit ?? null
                  )}
                </td>
              ))}
            </tr>
          )}
          {members.map((member) => {
            const param = parameters[member.path];
            if (!param) {
              return null;
            }
            const focused = member.path === focusedPath;
            return (
              <tr
                key={member.path}
                style={{
                  borderTop: lone ? undefined : `1px solid ${colors.border.light}`,
                }}
              >
                <th
                  scope="row"
                  style={{
                    ...labelCell,
                    // Level with the text inside the 36px inputs.
                    padding: `${spacing.md} ${spacing.md} ${spacing.xs} 0`,
                    fontSize: lone ? typography.fontSize.xs : typography.fontSize.sm,
                    color: lone ? colors.text.secondary : undefined,
                  }}
                >
                  {lone ? (
                    'Your reform'
                  ) : (
                    <button
                      type="button"
                      onClick={() => onFocus(member.path)}
                      aria-pressed={focused}
                      className="tw:cursor-pointer tw:hover:text-primary-700"
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        font: 'inherit',
                        textAlign: 'left',
                        fontWeight: focused
                          ? typography.fontWeight.semibold
                          : typography.fontWeight.normal,
                        color: focused ? colors.primary[700] : colors.text.primary,
                      }}
                    >
                      {member.label}
                    </button>
                  )}
                </th>
                {years.map((year) => {
                  const value = valueAt(member.path, year);
                  const baseline = baselineAt(member.path, year);
                  const changed = !sameValue(value, baseline);
                  const baselineText = formatValue(baseline, param.unit ?? null);
                  return (
                    <td
                      key={year}
                      title={`Current law: ${baselineText}`}
                      style={{ padding: cellPadding, minWidth: 96, verticalAlign: 'top' }}
                    >
                      <div
                        aria-label={`${member.label}, ${year}`}
                        data-path={member.path}
                        onFocusCapture={() => onFocus(member.path)}
                        // Current-law cells read quieter, so the changes stand out.
                        className={changed ? undefined : 'tw:[&_input]:text-gray-500'}
                        style={{
                          // A fixed width, or the input's 100% widens the table.
                          width: years.length > 1 ? undefined : wide ? 120 : 200,
                          borderRadius: spacing.radius.container,
                          boxShadow: changed ? `0 0 0 2px ${colors.primary[200]}` : undefined,
                          background: changed ? colors.primary[50] : undefined,
                        }}
                      >
                        {isEditableValue(baseline) ? (
                          <ValueInput
                            param={param}
                            value={value}
                            onChange={(next) => onChange(member.path, year, next)}
                          />
                        ) : (
                          <span
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: typography.fontSize.xs,
                              color: colors.text.secondary,
                            }}
                          >
                            {baselineText}
                          </span>
                        )}
                      </div>
                      {!lone && changed && (
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
                {previewYears.map((year) => {
                  const value = valueAt(member.path, year);
                  const changed = !sameValue(value, baselineAt(member.path, year));
                  return (
                    <td
                      key={year}
                      aria-label={`${member.label}, ${year}`}
                      title={`Current law: ${formatValue(baselineAt(member.path, year), param.unit ?? null)}`}
                      style={{
                        ...previewCell,
                        color: changed ? colors.primary[700] : colors.text.secondary,
                        fontWeight: changed ? typography.fontWeight.medium : undefined,
                      }}
                    >
                      {formatValue(value, param.unit ?? null)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {footer && (
            <tr style={{ borderTop: lone ? undefined : `1px solid ${colors.border.light}` }}>
              <th
                scope="row"
                style={{
                  ...labelCell,
                  padding: `${spacing.md} ${spacing.md} ${spacing.xs} 0`,
                  fontSize: lone ? typography.fontSize.xs : typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                {footer.label}
              </th>
              <td colSpan={allYears.length} style={{ padding: `${spacing.xs} ${spacing.xs}` }}>
                {footer.content}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
