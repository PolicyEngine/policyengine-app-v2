import { useState } from 'react';
import { IconArrowBackUp, IconCalendarEvent, IconChartLine } from '@tabler/icons-react';
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
import { ValueSetterCard } from '@/pages/reportBuilder/modals/policyCreation/ValueSetterCard';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
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

type GridMode = 'one' | 'byYear';
type Section = 'dates' | 'history' | null;

const GRID_MODES = [
  { label: 'One value', value: 'one' },
  { label: 'By year', value: 'byYear' },
];

/** Columns in the by-year grid; the last runs on from its year. */
const YEAR_COLUMNS = 5;

const UNIT_NAMES: Record<string, string> = {
  'currency-USD': 'US dollars',
  'currency-GBP': 'Pounds',
  '/1': 'Rate',
  bool: 'Yes or no',
  year: 'Year',
};

/**
 * A reform row opened up: the parameter's values as one value or year
 * by year — every member of its breakdown at once when it has one —
 * with the policy editor's own custom date ranges, change list, and
 * history chart below.
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
  // A lone parameter's one value is edited in its row; opened, it is for
  // the schedule. A breakdown opens on one value unless it already varies.
  const [mode, setMode] = useState<GridMode>(() =>
    !group || members.some((member) => provisionVariesOverTime(provisionFor(member.path) ?? {}))
      ? 'byYear'
      : 'one'
  );

  // The policy editor's value setter keeps its own working state.
  const [setterMode, setSetterMode] = useState<ValueSetterMode>(ValueSetterMode.DATE);
  const [pending, setPending] = useState<ValueInterval[]>([]);
  const [startDate, setStartDate] = useState(`${year}-01-01`);
  const [endDate, setEndDate] = useState(`${year}-12-31`);
  const [section, setSection] = useState<Section>(null);

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

  const years = mode === 'one' ? [year] : Array.from({ length: YEAR_COLUMNS }, (_, i) => year + i);
  const onCellChange = (memberPath: string, at: number, value: any) => {
    const lastColumn = at === years[years.length - 1];
    addInterval(memberPath, {
      startDate: `${at}-01-01`,
      endDate: mode === 'one' || lastColumn ? FOREVER : `${at}-12-31`,
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

  const changeDates = Object.keys(focusedParam?.values ?? {})
    .filter((date) => date <= `${year}-12-31`)
    .sort();
  const lastChanged = changeDates[changeDates.length - 1]?.slice(0, 4);

  const baseValues = new ValueIntervalCollection(focusedParam?.values ?? {});
  const reformValues = new ValueIntervalCollection(baseValues);
  focusedIntervals.forEach((interval) => reformValues.addInterval(interval));

  const meta = [
    UNIT_NAMES[unit ?? ''] ?? (unit ? humanizeSegment(unit) : null),
    lastChanged ? `Last changed ${lastChanged}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const changes = focusedIntervals.map((interval, index) => ({
    index,
    period:
      interval.endDate === FOREVER
        ? `${interval.startDate.slice(0, 4)} on`
        : interval.startDate.slice(0, 4) === interval.endDate.slice(0, 4)
          ? interval.startDate.slice(0, 4)
          : `${interval.startDate} to ${interval.endDate}`,
    value: formatValue(interval.value, unit),
  }));
  const toggleSection = (next: Section) =>
    setSection((current) => (current === next ? null : next));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {(focusedParam?.description || meta) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {focusedParam?.description && (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.primary,
              }}
            >
              {focusedParam.description}
            </p>
          )}
          {meta && (
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
              {meta}
            </span>
          )}
        </div>
      )}

      <section
        aria-label="Values"
        style={{
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
            gap: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Values
          </span>
          <SegmentedControl
            value={mode}
            onValueChange={(value) => setMode(value as GridMode)}
            options={GRID_MODES}
            size="xs"
            // Unstyled buttons default to white here, so the idle option
            // read as chosen too.
            className="tw:[&>button]:bg-transparent"
          />
        </div>
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
      </section>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <div style={{ display: 'flex', gap: spacing.xs }}>
          <Button
            variant={section === 'dates' ? 'secondary' : 'ghost'}
            size="sm"
            aria-expanded={section === 'dates'}
            onClick={() => toggleSection('dates')}
          >
            <IconCalendarEvent />
            Custom dates
            {changes.length > 0 && (
              <span style={{ color: colors.text.tertiary }}>({changes.length})</span>
            )}
          </Button>
          {focusedParam && (
            <Button
              variant={section === 'history' ? 'secondary' : 'ghost'}
              size="sm"
              aria-expanded={section === 'history'}
              onClick={() => toggleSection('history')}
            >
              <IconChartLine />
              History
            </Button>
          )}
        </div>
        {focusedProvision && provisionChanged(focusedProvision) && (
          <Button variant="ghost" size="sm" onClick={() => writeIntervals(focused, [])}>
            <IconArrowBackUp />
            Reset {group ? `${memberLabel.toLowerCase()} ` : ''}to current law
          </Button>
        )}
      </div>

      {section && group && (
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {section === 'dates' ? 'Dates' : 'History'} for{' '}
          <strong style={{ color: colors.text.primary }}>{memberLabel}</strong> — choose another row
          in the grid to switch.
        </span>
      )}

      {section === 'dates' && focusedParam && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <ValueSetterCard
            selectedParam={focusedParam}
            localPolicy={{
              label: draft.label,
              parameters: draft.provisions.filter(provisionChanged).map((provision) => ({
                name: provision.path,
                values: provisionIntervals(provision),
              })),
            }}
            reportYear={String(year)}
            minDate={minDate}
            maxDate={maxDate}
            valueSetterMode={setterMode}
            intervals={pending}
            startDate={startDate}
            endDate={endDate}
            onModeChange={setSetterMode}
            onIntervalsChange={setPending}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSubmit={() => {
              pending.forEach((interval) => addInterval(focused, interval));
              setPending([]);
            }}
          />
          {changes.length > 0 && (
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
        </div>
      )}

      {section === 'history' && focusedParam && (
        <HistoricalValuesCard
          // The chart titles itself from the label, which for a breakdown
          // member is its raw segment ("SINGLE").
          selectedParam={{ ...focusedParam, label: chartLabel }}
          baseValues={baseValues}
          reformValues={reformValues}
          policyLabel={draft.label || 'Your reform'}
        />
      )}
    </div>
  );
}
