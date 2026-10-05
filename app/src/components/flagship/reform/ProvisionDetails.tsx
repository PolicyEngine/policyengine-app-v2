import { useMemo, useState } from 'react';
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
import { humanizeSegment, ParameterGroup } from '@/libs/flagship/parameterGroups';
import { getDateRange } from '@/libs/metadataUtils';
import { selectParameterEntriesByPath } from '@/libs/parameterSearch';
import { ChangesCard } from '@/pages/reportBuilder/modals/policyCreation/ChangesCard';
import { HistoricalValuesCard } from '@/pages/reportBuilder/modals/policyCreation/HistoricalValuesCard';
import { DateValueSelectorV6 } from '@/pages/reportBuilder/modals/policyCreation/valueSelectors';
import { RootState } from '@/store';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatValue } from '@/utils/parameterValues';
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

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: `0 ${spacing.sm}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
  background: colors.background.primary,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.primary,
};

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

  // The policy editor's date-range setter keeps its own working state.
  const [pending, setPending] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState(`${year}-01-01`);
  const [endDate, setEndDate] = useState(`${year}-12-31`);

  // The date setter re-reads its value whenever this changes, so it must
  // change only with the draft — not on every keystroke's render.
  const policy = useMemo(
    () => ({
      label: draft.label,
      parameters: draft.provisions.filter(provisionChanged).map((provision) => ({
        name: provision.path,
        values: provisionIntervals(provision),
      })),
    }),
    [draft.label, draft.provisions]
  );

  if (!parameters) {
    return null;
  }

  const baselineAt = (memberPath: string, at: number) => {
    const values = parameters[memberPath]?.values;
    const value = values ? new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) : null;
    return value ?? null;
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
  const unit = focusedParam?.unit ?? null;
  const memberLabel = members.find((member) => member.path === focused)?.label ?? '';
  const chartLabel = group ? `${group.label} · ${memberLabel.toLowerCase()}` : members[0].label;
  const anyChanged = members.some((member) => {
    const provision = provisionFor(member.path);
    return provision ? provisionChanged(provision) : false;
  });

  const baseValues = new ValueIntervalCollection(focusedParam?.values ?? {});
  const reformValues = new ValueIntervalCollection(baseValues);
  focusedIntervals.forEach((interval) => reformValues.addInterval(interval));

  const changes = focusedIntervals.map((interval, index) => ({
    index,
    period:
      interval.endDate === FOREVER
        ? `${interval.startDate} on`
        : `${interval.startDate} to ${interval.endDate}`,
    value: formatValue(interval.value, unit),
  }));

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
          focusedParam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {group && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  For
                  <select
                    value={focused}
                    onChange={(event) => setFocusedPath(event.target.value)}
                    style={selectStyle}
                  >
                    {members.map((member) => (
                      <option key={member.path} value={member.path}>
                        {member.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <DateValueSelectorV6
                // A fresh setter per member, so its value starts at theirs.
                key={focused}
                param={focusedParam}
                policy={policy}
                reportYear={String(year)}
                minDate={minDate}
                maxDate={maxDate}
                intervals={pending}
                setIntervals={setPending}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
              <div>
                <Button
                  size="sm"
                  disabled={pending.length === 0}
                  onClick={() => {
                    pending.forEach((interval) => addInterval(focused, interval));
                  }}
                >
                  Add change
                </Button>
              </div>
            </div>
          )
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

      {mode === 'dates' && changes.length > 0 && (
        <ChangesCard
          modifiedParams={[{ paramName: focused, label: chartLabel, changes }]}
          onRemoveChange={(memberPath, index) =>
            writeIntervals(
              memberPath,
              focusedIntervals.filter((_, i) => i !== index)
            )
          }
        />
      )}

      {/* 2. What it is and how it has moved */}
      {focusedParam && (
        <section
          aria-label="About this parameter"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          <span style={sectionLabel}>About this parameter</span>
          {focusedParam.description && (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.secondary,
              }}
            >
              {focusedParam.description}
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
              {group ? ` of ${memberLabel.toLowerCase()}` : ''}
              <IconChevronDown
                style={{
                  transform: historyOpen ? 'rotate(180deg)' : undefined,
                  transition: 'transform 160ms ease',
                }}
              />
            </Button>
          </div>
          {historyOpen && (
            <HistoricalValuesCard
              // The chart titles itself from the label, which for a
              // breakdown member is its raw segment ("SINGLE").
              selectedParam={{ ...focusedParam, label: chartLabel }}
              baseValues={baseValues}
              reformValues={reformValues}
              policyLabel={draft.label || 'Your reform'}
            />
          )}
        </section>
      )}
    </div>
  );
}
