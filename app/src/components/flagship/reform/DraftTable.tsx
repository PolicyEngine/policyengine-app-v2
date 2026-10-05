import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { colors, spacing, typography } from '@/designTokens';
import {
  DraftProvision,
  DraftReform,
  draftYear,
  isEditableValue,
  provisionChanged,
  provisionVariesOverTime,
  removeDraftProvision,
  setDraftProvisionValueFrom,
} from '@/libs/draftReform';
import { useProvisionFocus } from '@/libs/flagship/draftEditorFocus';
import { groupContext, provisionName } from '@/libs/flagship/draftLabels';
import { ParameterGroup, parameterGroup } from '@/libs/flagship/parameterGroups';
import { selectAddableParameterPaths } from '@/libs/parameterSearch';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { RootState } from '@/store';
import { formatValue } from '@/utils/parameterValues';
import ProvisionDetails from './ProvisionDetails';

interface DraftRow {
  /** The breakdown's path, or the lone parameter's own */
  key: string;
  group: ParameterGroup | null;
  provisions: DraftProvision[];
}

// Narrow tables drop the current-law and when columns; the row's
// details still have both.
const ROW_GRID =
  'tw:grid tw:items-center tw:gap-3 tw:grid-cols-[minmax(0,1fr)_150px_64px] tw:@min-[640px]:grid-cols-[minmax(0,1fr)_110px_150px_100px_64px]';
const WIDE_ONLY = 'tw:hidden tw:@min-[640px]:block';

/** One line, cut with an ellipsis: list values run to dozens of names. */
const truncate: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: `1px ${spacing.sm}`,
        borderRadius: 999,
        background: colors.primary[50],
        fontSize: typography.fontSize.xs,
        color: colors.primary[700],
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** When a lone provision applies, as the row says it. */
function whenLabel(provision: DraftProvision, year: number): { text: string; accent: boolean } {
  if (!provisionChanged(provision)) {
    return { text: 'unchanged', accent: false };
  }
  if (provisionVariesOverTime(provision)) {
    const count = provision.intervals!.length;
    return { text: `${count} change${count === 1 ? '' : 's'}`, accent: true };
  }
  return { text: `from ${provision.intervals?.[0]?.startDate.slice(0, 4) ?? year}`, accent: true };
}

/**
 * The reform as a table: one row per parameter — or per breakdown, its
 * members together — with current law, the new value typed in place,
 * and when it applies. A row opens to its year-by-year values. Picks
 * from the add bar land here with their value focused.
 */
export default function DraftTable({ draft }: { draft: DraftReform }) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const draftable = useSelector(selectAddableParameterPaths);
  const focus = useProvisionFocus();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const year = draftYear(draft);

  // Groups depend only on which parameters are in the draft — not on
  // their values — so typing a value never re-scans the index.
  const pathsKey = draft.provisions.map((provision) => provision.path).join('|');
  const groupFor = useMemo(() => {
    const groups = new Map<string, ParameterGroup | null>();
    for (const path of pathsKey ? pathsKey.split('|') : []) {
      groups.set(path, parameters ? parameterGroup(path, parameters, draftable) : null);
    }
    return groups;
  }, [pathsKey, parameters, draftable]);

  const rows = useMemo(() => {
    const byKey = new Map<string, DraftRow>();
    for (const provision of draft.provisions) {
      const group = groupFor.get(provision.path) ?? null;
      const key = group?.key ?? provision.path;
      const row = byKey.get(key);
      if (row) {
        row.provisions.push(provision);
      } else {
        byKey.set(key, { key, group, provisions: [provision] });
      }
    }
    return [...byKey.values()];
  }, [draft.provisions, groupFor]);

  const toggle = (key: string, open?: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open ?? !next.has(key)) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

  // Focus the pending pick's value, selected so typing replaces it — or
  // the switch a yes/no parameter shows instead. False while its control
  // has not rendered yet (an opening row's grid).
  const applyPendingFocus = () => {
    const path = pendingFocus.current;
    if (!path) {
      return;
    }
    const control = tableRef.current?.querySelector<HTMLInputElement | HTMLButtonElement>(
      `[data-path="${CSS.escape(path)}"] :is(input, button[role="switch"])`
    );
    if (!control) {
      return;
    }
    pendingFocus.current = null;
    control.focus();
    control.scrollIntoView?.({ block: 'nearest' });
    if (control instanceof HTMLInputElement) {
      control.select();
    }
  };

  // A pick lands on its row: breakdowns and schedules open to their grid.
  useEffect(() => {
    if (!focus) {
      return;
    }
    const row = rows.find((candidate) =>
      candidate.provisions.some((provision) => provision.path === focus.path)
    );
    if (!row) {
      return;
    }
    pendingFocus.current = focus.path;
    if (row.group || row.provisions.some(provisionVariesOverTime)) {
      toggle(row.key, true);
    }
    // A row's own input is already here; an opening grid lands on the
    // next render, below.
    applyPendingFocus();
    // Only a new pick should move focus, not every draft change.
  }, [focus?.nonce]);

  useLayoutEffect(applyPendingFocus);

  const headerCell: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  };

  return (
    <div
      ref={tableRef}
      className="tw:@container"
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div
        className={ROW_GRID}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <span style={headerCell}>Parameter</span>
        <span className={WIDE_ONLY} style={headerCell}>
          Current law
        </span>
        <span style={headerCell}>New value</span>
        <span className={WIDE_ONLY} style={headerCell}>
          When
        </span>
        <span />
      </div>

      {rows.length === 0 && (
        <p
          style={{
            margin: 0,
            padding: spacing.xl,
            textAlign: 'center',
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          No parameters yet — add one above.
        </p>
      )}

      {rows.map((row, index) => {
        const open = expanded.has(row.key);
        const lone = row.group ? null : row.provisions[0];
        const { name, context } = lone
          ? provisionName(lone)
          : {
              name: row.group!.label,
              context: [
                groupContext(row.provisions[0].breadcrumb || row.provisions[0].path),
                `${row.group!.members.length} values`,
              ]
                .filter(Boolean)
                .join(' · '),
            };
        const changedCount = row.provisions.filter(provisionChanged).length;
        const varies = row.provisions.some(provisionVariesOverTime);
        const param = lone ? parameters?.[lone.path] : undefined;
        const baselineText = lone ? formatValue(lone.baselineValue, lone.unit) : 'varies';
        const when = lone
          ? whenLabel(lone, year)
          : changedCount === 0
            ? { text: 'unchanged', accent: false }
            : { text: varies ? 'by year' : `from ${year}`, accent: true };

        return (
          <Fragment key={row.key}>
            <div
              className={ROW_GRID}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                borderTop: index > 0 ? `1px solid ${colors.border.light}` : undefined,
                background: open ? colors.gray[50] : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => toggle(row.key)}
                aria-expanded={open}
                aria-label={`${open ? 'Close' : 'Open'} ${name}`}
                className="tw:cursor-pointer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                <span
                  title={row.provisions[0].breadcrumb || row.provisions[0].path}
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}
                >
                  {name}
                </span>
                {context && (
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    {context}
                  </span>
                )}
              </button>

              {/* Open, the row is a heading: its details below show every value. */}
              <span
                className={WIDE_ONLY}
                title={open ? undefined : baselineText}
                style={{
                  ...truncate,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                {open ? null : baselineText}
              </span>

              <div style={{ minWidth: 0 }}>
                {open ? null : lone && !isEditableValue(lone.baselineValue) ? (
                  // Only numbers and switches can be offered; this one came
                  // from an older saved reform.
                  <span
                    title={baselineText}
                    style={{
                      ...truncate,
                      display: 'block',
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    Can&apos;t be changed here
                  </span>
                ) : lone && !provisionVariesOverTime(lone) && param ? (
                  <div
                    data-path={lone.path}
                    // Changed reads tinted, as in the grid; current law reads quieter.
                    className={provisionChanged(lone) ? undefined : 'tw:[&_input]:text-gray-500'}
                    style={{
                      borderRadius: spacing.radius.container,
                      boxShadow: provisionChanged(lone)
                        ? `0 0 0 2px ${colors.primary[200]}`
                        : undefined,
                      background: provisionChanged(lone) ? colors.primary[50] : undefined,
                    }}
                  >
                    <ValueInputBox
                      param={param}
                      value={lone.value}
                      onChange={(next) =>
                        setDraftProvisionValueFrom(draft.countryId, lone, year, next)
                      }
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(row.key, true)}
                    className="tw:cursor-pointer tw:underline-offset-2 tw:hover:underline"
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      fontFamily: typography.fontFamily.primary,
                      color: changedCount > 0 ? colors.primary[700] : colors.text.secondary,
                    }}
                  >
                    {lone
                      ? 'by year'
                      : changedCount > 0
                        ? `${changedCount} of ${row.group!.members.length} changed`
                        : 'set values'}
                  </button>
                )}
              </div>

              <span className={WIDE_ONLY}>
                {open ? null : when.accent ? (
                  <Chip>{when.text}</Chip>
                ) : (
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                    {when.text}
                  </span>
                )}
              </span>

              <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <button
                  type="button"
                  onClick={() => toggle(row.key)}
                  aria-label={open ? `Hide ${name} details` : `Show ${name} details`}
                  className="tw:cursor-pointer tw:text-gray-500 tw:hover:bg-gray-100"
                  style={{
                    display: 'inline-flex',
                    padding: spacing.xs,
                    border: 'none',
                    borderRadius: spacing.radius.container,
                    background: 'transparent',
                  }}
                >
                  <IconChevronDown
                    size={16}
                    style={{
                      transform: open ? 'rotate(180deg)' : undefined,
                      transition: 'transform 160ms ease',
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => row.provisions.forEach((p) => removeDraftProvision(p.path))}
                  aria-label={`Remove ${name}`}
                  className="tw:cursor-pointer tw:text-gray-400 tw:hover:bg-gray-100 tw:hover:text-gray-700"
                  style={{
                    display: 'inline-flex',
                    padding: spacing.xs,
                    border: 'none',
                    borderRadius: spacing.radius.container,
                    background: 'transparent',
                  }}
                >
                  <IconX size={16} />
                </button>
              </span>
            </div>

            {open && (
              <div
                style={{
                  padding: `${spacing.sm} ${spacing.lg} ${spacing.lg}`,
                  background: colors.gray[50],
                  borderTop: `1px solid ${colors.border.light}`,
                }}
              >
                <ProvisionDetails
                  draft={draft}
                  path={row.provisions[0].path}
                  group={row.group}
                  focusPath={
                    focus && row.provisions.some((p) => p.path === focus.path)
                      ? focus.path
                      : undefined
                  }
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
