import { Fragment } from 'react';
import { colors, spacing, typography } from '@/designTokens';
import { isEditableValue, sameParameterValue } from '@/libs/draftReform';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';
import ValueInput, { ValueDisplay } from './ValueInput';

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
  /** A row above the values, aligned to the grid, e.g. the year a value starts. */
  lead?: { label: string; content: React.ReactNode };
  /** Year headings over the columns; off where the lead row already says the year. */
  showYearHeadings?: boolean;
  /**
   * A lone parameter's one value on one line — the lead, current law and
   * the box side by side — rather than a table of rows. Ignored for a
   * breakdown or more than one year.
   */
  inline?: boolean;
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
  lead,
  showYearHeadings = true,
  inline = false,
}: ValueGridProps) {
  const lone = members.length === 1;
  const allYears = [...years, ...previewYears];

  if (inline && lone && allYears.length === 1 && parameters[members[0].path]) {
    const member = members[0];
    const param = parameters[member.path];
    const year = years[0];
    const value = valueAt(member.path, year);
    const baseline = baselineAt(member.path, year);
    const changed = !sameValue(value, baseline);
    const baselineText = formatValue(baseline, param.unit ?? null);
    // Three fields of one height, each labeled above: when it starts,
    // current law (read-only, a quiet box), and the new value.
    const field = (label: string, content: React.ReactNode) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {content}
      </div>
    );
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: `${spacing.md} ${spacing.lg}`,
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
        }}
      >
        {lead && field(lead.label, lead.content)}
        {field(
          'Current law',
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 36,
              minWidth: 96,
              padding: '0 12px',
              borderRadius: spacing.radius.container,
              background: colors.gray[100],
              color: colors.text.secondary,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {baselineText}
          </span>
        )}
        {field(
          'Your reform',
          <div
            aria-label={`${member.label}, ${year}`}
            data-path={member.path}
            title={`Current law: ${baselineText}`}
            onFocusCapture={() => onFocus(member.path)}
            // Current law reads quieter, so a change stands out.
            className={changed ? undefined : 'tw:[&_input]:text-gray-500'}
            style={{
              width: 180,
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
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                {baselineText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
  const lastIndex = allYears.length - 1;
  // A jump in the years (2030, then 2035) gets a narrow "…" column, so
  // the years left out read as left out, not as the next year.
  const gapBefore = (year: number) => {
    const index = allYears.indexOf(year);
    return index > 0 && year - allYears[index - 1] > 1;
  };
  const gapCount = allYears.filter(gapBefore).length;
  const gapCell = (key: string, header = false) => {
    const style: React.CSSProperties = {
      padding: cellPadding,
      textAlign: 'center',
      verticalAlign: header ? 'bottom' : 'middle',
      fontSize: typography.fontSize.xs,
      color: colors.text.tertiary,
    };
    return header ? (
      <th key={key} aria-hidden style={style}>
        …
      </th>
    ) : (
      <td key={key} aria-hidden style={style}>
        …
      </td>
    );
  };
  const spanned = allYears.length + gapCount;
  // The last column runs on from its year; the hover says so, the heading stays a year.
  const header = (year: number, index: number) => headers?.[index] ?? String(year);
  const wide = allYears.length > 1;
  const previewCell: React.CSSProperties = {
    padding: cellPadding,
    verticalAlign: 'top',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          // One column stays input-sized rather than spanning the card.
          width: wide ? '100%' : 'auto',
          // Year columns share the width evenly, not by what each holds: an
          // input would otherwise take twice its share.
          tableLayout: wide ? 'fixed' : 'auto',
          // Even columns, but never narrower than a box: a narrow screen scrolls.
          minWidth: wide ? (lone ? 96 : 160) + allYears.length * 104 + gapCount * 28 : undefined,
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {/* Widths set here, not by the first row: the lead row spans the years. */}
        <colgroup>
          <col style={{ width: lone ? 96 : wide ? '22%' : undefined }} />
          {allYears.map((year) => (
            <Fragment key={year}>
              {gapBefore(year) && <col style={{ width: 28 }} />}
              <col />
            </Fragment>
          ))}
        </colgroup>
        <thead>
          {/* The start leads, above the years it starts. */}
          {lead && (
            <tr>
              <th
                scope="row"
                style={{
                  ...labelCell,
                  verticalAlign: 'middle',
                  padding: `${spacing.xs} ${spacing.md} ${spacing.sm} 0`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.normal,
                  color: colors.text.secondary,
                }}
              >
                {lead.label}
              </th>
              <td
                colSpan={spanned}
                style={{ padding: `${spacing.xs} ${spacing.xs} ${spacing.sm}` }}
              >
                {lead.content}
              </td>
            </tr>
          )}
          {showYearHeadings && (
            <tr>
              <th />
              {allYears.map((year, index) => [
                gapBefore(year) ? gapCell(`gap-${year}`, true) : null,
                <th
                  key={year}
                  scope="col"
                  title={
                    (openEnded || previewYears.length > 0) && index === lastIndex
                      ? `${year} and later`
                      : undefined
                  }
                  style={{
                    // In from the cell's edge as far as the box's text is, so a
                    // year heads its "$" and digits rather than the box's border.
                    padding: `0 ${spacing.xs} ${spacing.xs} calc(${spacing.xs} + 12px)`,
                    textAlign: 'left',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header(year, index)}
                </th>,
              ])}
            </tr>
          )}
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
              {allYears.map((year) => [
                gapBefore(year) ? gapCell(`gap-${year}`) : null,
                <td
                  key={year}
                  style={{
                    padding: `${spacing.xs} ${spacing.xs} ${spacing.sm}`,
                    color: colors.text.secondary,
                  }}
                >
                  {/* Laid out as the box below lays out its value, so the columns line up. */}
                  <ValueDisplay
                    param={parameters[members[0].path]}
                    value={baselineAt(members[0].path, year)}
                  />
                </td>,
              ])}
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
                          // A lone box keeps its size; in a row of years (a fixed
                          // layout) it fills its column.
                          width: years.length > 1 || wide ? undefined : 200,
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
                          Baseline: {baselineText}
                        </span>
                      )}
                    </td>
                  );
                })}
                {previewYears.map((year) => {
                  const value = valueAt(member.path, year);
                  const changed = !sameValue(value, baselineAt(member.path, year));
                  return [
                    gapBefore(year) ? gapCell(`gap-${year}`) : null,
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
                      {/* As tall as the box beside it, and its digits where the box's sit. */}
                      <ValueDisplay param={param} value={value} boxed />
                    </td>,
                  ];
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
              <td colSpan={spanned} style={{ padding: `${spacing.xs} ${spacing.xs}` }}>
                {footer.content}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
