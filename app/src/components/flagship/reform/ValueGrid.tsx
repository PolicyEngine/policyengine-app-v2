import { Fragment, useMemo, useState } from 'react';
import { STATE_NAMES } from '@/api/billFeed';
import { Switch } from '@/components/ui';
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

/** Past this many members, one year's values lay out as a filterable grid, not a table. */
const MANY_MEMBERS = 12;

/** The jurisdictions a federal parameter keys by that are not states. */
const OTHER_JURISDICTIONS: Record<string, string> = {
  PR: 'Puerto Rico',
  GU: 'Guam',
  VI: 'U.S. Virgin Islands',
  AS: 'American Samoa',
  MP: 'Northern Mariana Islands',
  FM: 'Micronesia',
  MH: 'Marshall Islands',
  PW: 'Palau',
  AA: 'Armed Forces Americas',
  AE: 'Armed Forces Europe',
  AP: 'Armed Forces Pacific',
};

/**
 * A member as a reader names it: a state-keyed member by its state's
 * name ("Alaska", not "Ak"), anything else by its own label. States sort
 * first, then the territories and military codes.
 */
function memberName(member: ValueGridMember): { name: string; rank: number | null } {
  const key = member.path.split('.').pop() ?? '';
  if (STATE_NAMES[key]) {
    return { name: STATE_NAMES[key], rank: 0 };
  }
  if (OTHER_JURISDICTIONS[key]) {
    return { name: OTHER_JURISDICTIONS[key], rank: 1 };
  }
  return { name: member.label, rank: null };
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

/** A lone year's box: its own size, narrower on a phone so a breakdown fits its card. */
const LONE_BOX = 'tw:w-[200px] tw:max-sm:w-[150px]';

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

  if (members.length > MANY_MEMBERS && years.length === 1 && previewYears.length === 0) {
    return (
      <MemberValueCards
        members={members}
        year={years[0]}
        parameters={parameters}
        valueAt={valueAt}
        baselineAt={baselineAt}
        onChange={onChange}
        onFocus={onFocus}
        lead={lead}
        footer={footer}
      />
    );
  }

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
                  // A member's name wraps on a phone, so its box keeps the room.
                  className="tw:whitespace-nowrap tw:max-sm:whitespace-normal"
                  style={{
                    ...labelCell,
                    whiteSpace: undefined,
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
                        // A lone box keeps its size; in a row of years (a fixed
                        // layout) it fills its column.
                        className={[
                          changed ? '' : 'tw:[&_input]:text-gray-500',
                          years.length > 1 || wide ? '' : LONE_BOX,
                        ].join(' ')}
                        style={{
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

/**
 * One year's values for a breakdown with many members (a value per
 * state): a grid of compact cells, named and sorted, with a filter and a
 * switch to show only the changed ones, rather than a table a screen long.
 */
function MemberValueCards({
  members,
  year,
  parameters,
  valueAt,
  baselineAt,
  onChange,
  onFocus,
  lead,
  footer,
}: {
  members: ValueGridMember[];
  year: number;
  parameters: ParameterMetadataCollection;
  valueAt: (path: string, year: number) => any;
  baselineAt: (path: string, year: number) => any;
  onChange: (path: string, year: number, value: any) => void;
  onFocus: (path: string) => void;
  lead?: { label: string; content: React.ReactNode };
  footer?: { label: string; content: React.ReactNode };
}) {
  const [filter, setFilter] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const named = useMemo(() => {
    const list = members
      .filter((member) => parameters[member.path])
      .map((member) => ({ member, ...memberName(member) }));
    // A breakdown by jurisdiction sorts by name; any other keeps its own order (age bands, brackets).
    return list.every((entry) => entry.rank !== null)
      ? [...list].sort((a, b) => a.rank! - b.rank! || a.name.localeCompare(b.name))
      : list;
  }, [members, parameters]);
  // Yes/no values compare as yes or no: some are stored as 0 and 1.
  const asYes = (value: unknown) => value === true || value === 1;
  const differs = (path: string, value: unknown, baseline: unknown) =>
    parameters[path]?.unit === 'bool'
      ? asYes(value) !== asYes(baseline)
      : !sameValue(value, baseline);
  const isChanged = (path: string) => differs(path, valueAt(path, year), baselineAt(path, year));
  const changedCount = named.filter(({ member }) => isChanged(member.path)).length;
  const query = filter.trim().toLowerCase();
  const shown = named.filter(
    ({ member, name }) =>
      (!changedOnly || isChanged(member.path)) &&
      (!query || name.toLowerCase().includes(query) || member.label.toLowerCase().includes(query))
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.sm,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
        {lead && (
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
              {lead.label}
            </span>
            {lead.content}
          </span>
        )}
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={`Filter ${named.length} values…`}
          aria-label="Filter the values"
          className="tw:h-9 tw:w-56 tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:text-sm tw:outline-none tw:focus:border-primary-500"
        />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(event) => setChangedOnly(event.target.checked)}
          />
          Changed only ({changedCount})
        </label>
      </div>

      {shown.length === 0 ? (
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
          {changedOnly && !query ? 'No value changed yet.' : 'No value matches.'}
        </span>
      ) : (
        <div className="tw:grid tw:gap-2 tw:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {shown.map(({ member, name }) => {
            const param = parameters[member.path];
            const value = valueAt(member.path, year);
            const baseline = baselineAt(member.path, year);
            const changed = differs(member.path, value, baseline);
            const baselineText =
              param.unit === 'bool'
                ? asYes(baseline)
                  ? 'true'
                  : 'false'
                : formatValue(baseline, param.unit ?? null);
            return (
              <div
                key={member.path}
                aria-label={`${name}, ${year}`}
                data-path={member.path}
                title={`Current law: ${baselineText}`}
                onFocusCapture={() => onFocus(member.path)}
                className={changed ? undefined : 'tw:[&_input]:text-gray-500'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 4,
                  minHeight: 48,
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: spacing.radius.container,
                  border: `1px solid ${changed ? colors.primary[200] : colors.border.light}`,
                  background: changed ? colors.primary[50] : colors.background.primary,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      lineHeight: 1.3,
                      fontWeight: changed
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                    }}
                  >
                    {name}
                  </span>
                  <div style={{ flexShrink: 0, maxWidth: 140 }}>
                    {param.unit === 'bool' ? (
                      // A switch and the one word it means: the boxed "False · True"
                      // control is too wide for a cell.
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          cursor: 'pointer',
                        }}
                      >
                        <Switch
                          // Some yes/no values are stored as 0 and 1.
                          checked={asYes(value)}
                          onCheckedChange={(next) => onChange(member.path, year, next)}
                          aria-label={name}
                        />
                        <span
                          style={{
                            width: 34,
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.medium,
                            color: asYes(value) ? colors.primary[700] : colors.text.secondary,
                          }}
                        >
                          {asYes(value) ? 'True' : 'False'}
                        </span>
                      </label>
                    ) : isEditableValue(baseline) ? (
                      <ValueInput
                        param={param}
                        value={value}
                        onChange={(next) => onChange(member.path, year, next)}
                      />
                    ) : (
                      <span
                        style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
                      >
                        {baselineText}
                      </span>
                    )}
                  </div>
                </div>
                {changed && (
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                    Current law: {baselineText}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {footer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {footer.label}
          </span>
          {footer.content}
        </div>
      )}
    </div>
  );
}
