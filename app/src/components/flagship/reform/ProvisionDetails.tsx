import { useState } from 'react';
import { IconArrowBackUp, IconChartLine, IconChevronDown } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { Button, SegmentedControl } from '@/components/ui';
import { FOREVER } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import {
  DraftProvision,
  DraftReform,
  draftYear,
  provisionChanged,
  provisionFromSearchEntry,
  provisionIntervals,
  provisionValueInYear,
  provisionVariesOverTime,
  setDraftProvisionIntervals,
} from '@/libs/draftReform';
import { periodLabel } from '@/libs/flagship/draftLabels';
import { humanizeSegment, ParameterGroup } from '@/libs/flagship/parameterGroups';
import { getDateRange } from '@/libs/metadataUtils';
import { selectParameterEntriesByPath } from '@/libs/parameterSearch';
import { ChangesCard } from '@/pages/reportBuilder/modals/policyCreation/ChangesCard';
import { RootState } from '@/store';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatValue } from '@/utils/parameterValues';
import BracketTable from './BracketTable';
import CustomDatesEditor from './CustomDatesEditor';
import PastValuesChart from './PastValuesChart';
import ValueGrid from './ValueGrid';

interface ProvisionDetailsProps {
  draft: DraftReform;
  /** The parameter, or the breakdown it belongs to. */
  path: string;
  group: ParameterGroup | null;
  /** The member to start on — the one just picked. */
  focusPath?: string;
}

type EditMode = 'one' | 'byYear' | 'dates';

/** The ways to set a value, in the order people reach for them. */
const EDIT_MODES = [
  { label: 'One value', value: 'one' },
  { label: 'By year', value: 'byYear' },
  { label: 'Custom dates', value: 'dates' },
];

/** Columns in the by-year grid; the last runs on from its year. */
const YEAR_COLUMNS = 5;

const isYearStart = (date: string) => date.endsWith('-01-01');
const isYearEnd = (date: string) => date.endsWith('-12-31') || date === FOREVER;

/** Whether the grid can show a provision: every change runs whole years. */
function fitsGrid(provision: DraftProvision | undefined): boolean {
  return (provision?.intervals ?? []).every(
    (interval) => isYearStart(interval.startDate) && isYearEnd(interval.endDate)
  );
}

/**
 * A reform row opened up, in the order the work goes: set the new value
 * — one value, year by year, or over custom dates — then, below, what
 * the parameter is and how it has moved. A breakdown sets all its
 * members at once.
 */
export default function ProvisionDetails({ draft, path, group, focusPath }: ProvisionDetailsProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const entriesByPath = useSelector(selectParameterEntriesByPath);
  const { minDate, maxDate } = useSelector(getDateRange);
  const year = draftYear(draft);

  const members = group?.members ?? [
    {
      path,
      label: humanizeSegment(parameters?.[path]?.label ?? path.split('.').pop() ?? path),
    },
  ];
  const provisionFor = (memberPath: string) =>
    draft.provisions.find((provision) => provision.path === memberPath);

  const [focusedPath, setFocusedPath] = useState(focusPath ?? path);
  // Open on the way the reform already sets it: dates the grid can't
  // show, a schedule, or else one value.
  const [mode, setMode] = useState<EditMode>(() => {
    const provisions = members.map((member) => provisionFor(member.path));
    if (!provisions.every(fitsGrid)) {
      return 'dates';
    }
    return provisions.some((provision) => provisionVariesOverTime(provision ?? {}))
      ? 'byYear'
      : 'one';
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  // The year a schedule's brackets show by year; one value is the report year.
  const [scheduleTab, setScheduleTab] = useState(year);

  if (!parameters) {
    return null;
  }

  const baselineAt = (memberPath: string, at: number) => {
    const values = parameters[memberPath]?.values;
    const value = values ? new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) : null;
    return value ?? null;
  };
  const baselineOn = (memberPath: string, date: string) => {
    const values = parameters[memberPath]?.values;
    return (values ? new ValueIntervalCollection(values).getValueAtDate(date) : null) ?? null;
  };
  const valueOn = (memberPath: string, date: string) => {
    const provision = provisionFor(memberPath);
    if (!provision || !provisionChanged(provision)) {
      return baselineOn(memberPath, date);
    }
    const reform = new ValueIntervalCollection(parameters[memberPath]?.values ?? {});
    provisionIntervals(provision).forEach((interval) => reform.addInterval(interval));
    return reform.getValueAtDate(date) ?? baselineOn(memberPath, date);
  };
  const valueAt = (memberPath: string, at: number) => {
    const provision = provisionFor(memberPath);
    if (!provision || !provisionChanged(provision)) {
      return baselineAt(memberPath, at);
    }
    return provisionValueInYear(provision, at) ?? baselineAt(memberPath, at);
  };

  /** The provision to write to — the draft's own, or a new one from the search entry. */
  const baseProvision = (memberPath: string): Omit<DraftProvision, 'intervals'> | null => {
    const existing = provisionFor(memberPath);
    if (existing) {
      return existing;
    }
    const entry = entriesByPath.get(memberPath);
    return entry ? provisionFromSearchEntry(entry, parameters[memberPath]?.values) : null;
  };
  const writeIntervals = (memberPath: string, intervals: ValueInterval[]) => {
    const base = baseProvision(memberPath);
    if (base) {
      setDraftProvisionIntervals(draft.countryId, base, intervals);
    }
  };
  const addInterval = (memberPath: string, interval: ValueInterval) => {
    const provision = provisionFor(memberPath);
    const collection = new ValueIntervalCollection(
      provision && provisionChanged(provision) ? provisionIntervals(provision) : []
    );
    collection.addInterval(interval);
    writeIntervals(memberPath, collection.getIntervals());
  };

  const years =
    mode === 'byYear' ? Array.from({ length: YEAR_COLUMNS }, (_, i) => year + i) : [year];
  const scheduleYear = mode === 'byYear' && years.includes(scheduleTab) ? scheduleTab : year;
  const onCellChange = (memberPath: string, at: number, value: any) => {
    const lastColumn = at === years[years.length - 1];
    addInterval(memberPath, {
      startDate: `${at}-01-01`,
      endDate: mode !== 'byYear' || lastColumn ? FOREVER : `${at}-12-31`,
      value,
    });
  };

  const focused = parameters[focusedPath] ? focusedPath : path;
  const focusedParam = parameters[focused];
  const focusedProvision = provisionFor(focused);
  const focusedIntervals =
    focusedProvision && provisionChanged(focusedProvision)
      ? provisionIntervals(focusedProvision)
      : [];
  const memberLabel = members.find((member) => member.path === focused)?.label ?? '';
  const chartLabel = group ? `${group.label} · ${memberLabel.toLowerCase()}` : members[0].label;
  // A breakdown says what it is once, for all its members, which
  // seldom carry a description of their own.
  const description =
    (group ? parameters[group.key]?.description : null) || focusedParam?.description;
  const anyChanged = members.some((member) => {
    const provision = provisionFor(member.path);
    return provision ? provisionChanged(provision) : false;
  });

  const baseValues = new ValueIntervalCollection(focusedParam?.values ?? {});
  const reformValues = new ValueIntervalCollection(baseValues);
  focusedIntervals.forEach((interval) => reformValues.addInterval(interval));

  // Every member's changes, each named when the row is a breakdown.
  const modifiedMembers = members.flatMap((member) => {
    const provision = provisionFor(member.path);
    if (!provision || !provisionChanged(provision)) {
      return [];
    }
    const memberUnit = parameters[member.path]?.unit ?? null;
    return [
      {
        paramName: member.path,
        label: member.label,
        changes: provisionIntervals(provision).map((interval, index) => {
          const period = periodLabel(interval);
          return {
            index,
            period: group ? `${member.label}: ${period}` : period,
            value: formatValue(interval.value, memberUnit),
          };
        }),
      },
    ];
  });

  const sectionLabel: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {/* 1. Set the new value */}
      <section
        aria-label="New value"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          padding: spacing.md,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
          background: colors.background.primary,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <span style={sectionLabel}>New value</span>
          <SegmentedControl
            value={mode}
            onValueChange={(value) => setMode(value as EditMode)}
            options={EDIT_MODES}
            size="xs"
            // Unstyled buttons default to white here, so the idle options
            // read as chosen too.
            className="tw:[&>button]:bg-transparent"
          />
        </div>

        {mode === 'dates' ? (
          <CustomDatesEditor
            members={members}
            parameters={parameters}
            defaultStart={`${year}-01-01`}
            minDate={minDate}
            maxDate={maxDate}
            valueOn={valueOn}
            baselineOn={baselineOn}
            onAdd={(startDate, endDate, values) =>
              Object.entries(values).forEach(([memberPath, value]) =>
                addInterval(memberPath, { startDate, endDate, value })
              )
            }
            focusedPath={focused}
            onFocus={setFocusedPath}
            brackets={group?.brackets}
          />
        ) : group?.brackets ? (
          // A schedule shows as its brackets, one year at a time: a
          // table a bracket per row is too wide to repeat across years.
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {mode === 'byYear' && (
              <div>
                <SegmentedControl
                  value={String(scheduleYear)}
                  onValueChange={(value) => setScheduleTab(Number(value))}
                  options={years.map((at, index) => ({
                    label: index === years.length - 1 ? `${at}+` : String(at),
                    value: String(at),
                  }))}
                  size="xs"
                  className="tw:[&>button]:bg-transparent"
                />
              </div>
            )}
            <BracketTable
              brackets={group.brackets}
              members={members}
              period={String(scheduleYear)}
              parameters={parameters}
              valueAt={(memberPath) => valueAt(memberPath, scheduleYear)}
              baselineAt={(memberPath) => baselineAt(memberPath, scheduleYear)}
              onChange={(memberPath, value) => onCellChange(memberPath, scheduleYear, value)}
              onFocus={setFocusedPath}
            />
          </div>
        ) : (
          <ValueGrid
            members={members}
            years={years}
            openEnded
            parameters={parameters}
            valueAt={valueAt}
            baselineAt={baselineAt}
            onChange={onCellChange}
            focusedPath={focused}
            onFocus={setFocusedPath}
          />
        )}

        {anyChanged && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                members
                  .filter((member) => provisionFor(member.path))
                  .forEach((member) => writeIntervals(member.path, []))
              }
            >
              <IconArrowBackUp />
              Reset to current law
            </Button>
          </div>
        )}
      </section>

      {mode === 'dates' && modifiedMembers.length > 0 && (
        <ChangesCard
          modifiedParams={modifiedMembers}
          onRemoveChange={(memberPath, index) => {
            const provision = provisionFor(memberPath);
            if (provision) {
              writeIntervals(
                memberPath,
                provisionIntervals(provision).filter((_, i) => i !== index)
              );
            }
          }}
        />
      )}

      {/* 2. What it is and how it has moved */}
      {focusedParam && (
        <section
          aria-label="About this parameter"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          <span style={sectionLabel}>About this parameter</span>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.secondary,
              }}
            >
              {description}
            </p>
          )}
          <div>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((open) => !open)}
              style={{ marginLeft: `-${spacing.sm}` }}
            >
              <IconChartLine />
              {historyOpen ? 'Hide' : 'Show'} past values
              <IconChevronDown
                style={{
                  transform: historyOpen ? 'rotate(180deg)' : undefined,
                  transition: 'transform 160ms ease',
                }}
              />
            </Button>
          </div>
          {historyOpen && group && (
            // Every member's history is a click away, not only the one in focus.
            <div
              role="group"
              aria-label="Past values of"
              style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}
            >
              {members.map((member) => {
                const chosen = member.path === focused;
                return (
                  <button
                    key={member.path}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => setFocusedPath(member.path)}
                    className="tw:cursor-pointer tw:transition-colors tw:hover:border-primary-500"
                    style={{
                      padding: `2px ${spacing.sm}`,
                      border: `1px solid ${chosen ? colors.primary[500] : colors.border.light}`,
                      borderRadius: 999,
                      background: chosen ? colors.primary[50] : colors.background.primary,
                      fontSize: typography.fontSize.xs,
                      fontWeight: chosen
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                      fontFamily: typography.fontFamily.primary,
                      color: chosen ? colors.primary[700] : colors.text.secondary,
                    }}
                  >
                    {member.label}
                  </button>
                );
              })}
            </div>
          )}
          {historyOpen && focusedParam && (
            <PastValuesChart
              // The chart reads the label, which for a breakdown member is
              // its raw segment ("SINGLE").
              param={{ ...focusedParam, label: chartLabel }}
              baseValues={baseValues}
              reformValues={focusedIntervals.length > 0 ? reformValues : undefined}
              reformLabel={draft.label || 'Your reform'}
            />
          )}
        </section>
      )}
    </div>
  );
}
