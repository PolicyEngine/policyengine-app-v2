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
  provisionIntervals,
  provisionVariesOverTime,
  removeDraftProvision,
} from '@/libs/draftReform';
import { useProvisionFocus } from '@/libs/flagship/draftEditorFocus';
import { provisionName, summarizeIntervals } from '@/libs/flagship/draftLabels';
import { ParameterGroup, parameterGroup } from '@/libs/flagship/parameterGroups';
import { growthOf, growthPhrase, setValueFromYear } from '@/libs/flagship/uprating';
import { getDateRange } from '@/libs/metadataUtils';
import { selectAddableParameterPaths } from '@/libs/parameterSearch';
import { RootState } from '@/store';
import { formatValue } from '@/utils/parameterValues';
import ProvisionDetails from './ProvisionDetails';
import ValueInput from './ValueInput';

interface DraftRow {
  /** The breakdown's path, or the lone parameter's own */
  key: string;
  group: ParameterGroup | null;
  provisions: DraftProvision[];
}

// Narrow tables drop the current-law and when columns; the row's
// details still have both.
const ROW_GRID =
  'tw:grid tw:items-center tw:gap-3 tw:grid-cols-[minmax(0,1fr)_150px_64px] tw:@min-[640px]:grid-cols-[minmax(0,1fr)_110px_150px_136px_64px]';
const WIDE_ONLY = 'tw:hidden tw:@min-[640px]:block';

/** One line, cut with an ellipsis: list values run to dozens of names. */
const truncate: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      style={{
        ...truncate,
        display: 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'middle',
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

/** A provision's change in brief: its new value and when it applies. */
/** ", from 2028 on a 2026 base" — only when growth doesn't start the year after, from that year. */
function timingNote(provision: DraftProvision, startYear: number): string {
  const { growthStart, growthBase } = provision;
  if (!growthStart || (growthStart === startYear + 1 && growthBase === startYear)) {
    return '';
  }
  return `, from ${growthStart} on a ${growthBase} base`;
}

/** A provision's change in brief: its new value and when it applies — and how it grows. */
const summarize = (
  provision: DraftProvision,
  countryId: string
): { value: string; when: string; whenFull?: string } => {
  const intervals = provisionIntervals(provision);
  const growth = growthPhrase(provision.growth, countryId);
  if (growth && intervals.length > 0) {
    const from = `from ${intervals[0].startDate.slice(0, 4)}`;
    return {
      value: formatValue(intervals[0].value, provision.unit),
      // The chip is narrow: "from 2026 · CPI-U", in full on hover.
      when: `${from} · ${growthPhrase(provision.growth, countryId, true)}`,
      whenFull: `${from}, ${growth}${timingNote(provision, Number(intervals[0].startDate.slice(0, 4)))}`,
    };
  }
  return summarizeIntervals(intervals, (value) => formatValue(value, provision.unit));
};

/** A row's value as text that opens the row: a schedule, or a breakdown's changes. */
function SummaryButton({
  children,
  title,
  accent,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  accent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="tw:cursor-pointer tw:underline-offset-2 tw:hover:underline"
      style={{
        ...truncate,
        display: 'block',
        maxWidth: '100%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        fontSize: typography.fontSize.sm,
        fontWeight: accent ? typography.fontWeight.medium : typography.fontWeight.normal,
        fontFamily: typography.fontFamily.primary,
        color: accent ? colors.primary[700] : colors.text.tertiary,
      }}
    >
      {children}
    </button>
  );
}

/**
 * The reform as a table: one row per parameter — or per breakdown, its
 * members together — with current law, the new value typed in place,
 * and when it applies. A pick opens its row — one open at a time — to
 * the ways of setting its value, with the value focused.
 */
export default function DraftTable({ draft }: { draft: DraftReform }) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const draftable = useSelector(selectAddableParameterPaths);
  const lastYear = Number(useSelector(getDateRange).maxDate.slice(0, 4));
  const focus = useProvisionFocus();
  // One row open at a time: the one being worked on.
  const [openKey, setOpenKey] = useState<string | null>(null);
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
    setOpenKey((current) => ((open ?? current !== key) ? key : null));

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

  // A pick lands on its row, opened to its ways of setting the value.
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
    if (openKey === row.key) {
      applyPendingFocus();
    } else {
      // Its grid lands on the next render, below. Focusing now would
      // take the closed row's own input, which opening removes.
      toggle(row.key, true);
    }
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
        const open = openKey === row.key;
        const lone = row.group ? null : row.provisions[0];
        // A row is its name alone; where it sits in the tree is on hover.
        const name = lone ? provisionName(lone) : row.group!.label;
        const param = lone ? parameters?.[lone.path] : undefined;
        const changed = row.provisions.filter(provisionChanged).map((provision) => ({
          provision,
          ...summarize(provision, draft.countryId),
        }));
        // A breakdown names each changed member and its new value.
        const memberLabel = (path: string) =>
          row.group?.members.find((member) => member.path === path)?.label ?? path;
        const groupSummary = changed
          .map(({ provision, value }) => `${memberLabel(provision.path)} ${value}`)
          .join(' · ');
        const whens = [...new Set(changed.map(({ when }) => when))];
        const when = whens.length === 1 ? whens[0] : whens.length > 1 ? 'mixed dates' : '';
        const whenTitle =
          whens.length === 1 ? (changed.find((c) => c.when === when)?.whenFull ?? when) : when;
        const baselineText = lone ? formatValue(lone.baselineValue, lone.unit) : '';

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
              </button>

              {/* Open, the row is a heading: its details below show every value. */}
              {lone ? (
                <>
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
                    {open ? null : !isEditableValue(lone.baselineValue) ? (
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
                    ) : // A value that grows still edits in place: the box sets
                    // where it starts.
                    (!provisionVariesOverTime(lone) ||
                        growthPhrase(lone.growth, draft.countryId)) &&
                      param ? (
                      <div
                        data-path={lone.path}
                        // Changed reads tinted, as in the grid; current law reads quieter.
                        className={
                          provisionChanged(lone) ? undefined : 'tw:[&_input]:text-gray-500'
                        }
                        style={{
                          borderRadius: spacing.radius.container,
                          boxShadow: provisionChanged(lone)
                            ? `0 0 0 2px ${colors.primary[200]}`
                            : undefined,
                          background: provisionChanged(lone) ? colors.primary[50] : undefined,
                        }}
                      >
                        <ValueInput
                          param={param}
                          value={lone.value}
                          onChange={(next) =>
                            setValueFromYear({
                              countryId: draft.countryId,
                              provision: lone,
                              year,
                              value: next,
                              growth: growthOf(lone, param),
                              param,
                              parameters: parameters ?? {},
                              lastYear,
                            })
                          }
                        />
                      </div>
                    ) : (
                      // A schedule, or a value before metadata loads: its
                      // summary, which opens the row.
                      <SummaryButton
                        onClick={() => toggle(row.key, true)}
                        title={changed[0]?.value}
                        accent={changed.length > 0}
                      >
                        {changed[0]?.value || formatValue(lone.value, lone.unit)}
                      </SummaryButton>
                    )}
                  </div>
                </>
              ) : (
                <div className="tw:@min-[640px]:col-span-2" style={{ minWidth: 0 }}>
                  {open ? null : (
                    <SummaryButton
                      onClick={() => toggle(row.key, true)}
                      title={groupSummary || undefined}
                      accent={changed.length > 0}
                    >
                      {groupSummary || 'No values changed yet'}
                    </SummaryButton>
                  )}
                </div>
              )}

              <span className={WIDE_ONLY}>
                {open || !when ? null : <Chip title={whenTitle}>{when}</Chip>}
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
