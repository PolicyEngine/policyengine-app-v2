import { colors, spacing, typography } from '@/designTokens';
import { isEditableValue, sameParameterValue } from '@/libs/draftReform';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';

export interface ValueGridMember {
  path: string;
  label: string;
}

interface ValueGridProps {
  members: ValueGridMember[];
  /** One column per year; with `openEnded`, the last runs on from its year. */
  years: number[];
  openEnded: boolean;
  parameters: ParameterMetadataCollection;
  /** The value in effect: the reform's where it sets one, current law otherwise. */
  valueAt: (path: string, year: number) => any;
  baselineAt: (path: string, year: number) => any;
  onChange: (path: string, year: number, value: any) => void;
  focusedPath: string;
  onFocus: (path: string) => void;
}

const sameValue = (a: any, b: any) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) < 1e-9
    : sameParameterValue(a, b);

/**
 * Members down, years across: the values a reform sets, edited in place.
 * Every cell starts at what is in effect, so the grid reads as the
 * schedule itself; cells that differ from current law are tinted, and
 * hovering one says what current law has there.
 */
export default function ValueGrid({
  members,
  years,
  openEnded,
  parameters,
  valueAt,
  baselineAt,
  onChange,
  focusedPath,
  onFocus,
}: ValueGridProps) {
  const header = (year: number, index: number) =>
    openEnded && index === years.length - 1 ? `${year} on` : String(year);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <thead>
          <tr>
            <th style={{ width: members.length > 1 ? '26%' : 0 }} />
            {years.map((year, index) => (
              <th
                key={year}
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
                {header(year, index)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
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
                  borderTop: `1px solid ${colors.border.light}`,
                  background: focused && members.length > 1 ? colors.gray[50] : undefined,
                }}
              >
                <th
                  scope="row"
                  style={{
                    padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} 0`,
                    textAlign: 'left',
                  }}
                >
                  {members.length > 1 && (
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
                  return (
                    <td
                      key={year}
                      title={`Current law: ${formatValue(baseline, param.unit ?? null)}`}
                      style={{ padding: `${spacing.xs} ${spacing.xs}`, minWidth: 92 }}
                    >
                      <div
                        aria-label={`${member.label}, ${year}`}
                        data-path={member.path}
                        onFocusCapture={() => onFocus(member.path)}
                        style={{
                          borderRadius: spacing.radius.container,
                          // A changed cell is tinted, so the reform reads at a glance.
                          boxShadow: changed ? `0 0 0 2px ${colors.primary[200]}` : undefined,
                          background: changed ? colors.primary[50] : undefined,
                        }}
                      >
                        {isEditableValue(baseline) ? (
                          <ValueInputBox
                            param={param}
                            value={value}
                            onChange={(next) => onChange(member.path, year, next)}
                          />
                        ) : (
                          // A list of variable names: shown, not set, here.
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
                            {formatValue(baseline, param.unit ?? null)}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
