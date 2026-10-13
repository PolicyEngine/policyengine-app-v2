import { useState } from 'react';
import { IconArrowBackUp, IconChartLine, IconChevronDown } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  Button,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
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
  sameParameterValue,
  setDraftProvisionIntervals,
} from '@/libs/draftReform';
import { periodLabel } from '@/libs/flagship/draftLabels';
import { humanizeSegment, ParameterGroup } from '@/libs/flagship/parameterGroups';
import {
  alreadyGrows,
  canGrow,
  Growth,
  growthOf,
  growthOptions,
  GrowthRounding,
  growthRounding,
  GrowthTiming,
  growthTiming,
  seriesYears,
  setValueFromYear,
} from '@/libs/flagship/uprating';
import { getDateRange, getTaxYears } from '@/libs/metadataUtils';
import { selectParameterEntriesByPath } from '@/libs/parameterSearch';
import { ChangesCard } from '@/pages/reportBuilder/modals/policyCreation/ChangesCard';
import { RootState } from '@/store';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatValue } from '@/utils/parameterValues';
import BracketTable from './BracketTable';
import CustomDatesEditor from './CustomDatesEditor';
import GrowthControl from './GrowthControl';
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

type EditMode = 'one' | 'indexed' | 'byYear' | 'dates';

/**
 * The ways to set a value, in the order people reach for them. One value
 * holds from its year on; indexed, it grows with an index — offered for
 * money amounts only.
 */
const EDIT_MODES: Array<{ label: string; value: EditMode }> = [
  { label: 'New value', value: 'one' },
  { label: 'By year', value: 'byYear' },
  { label: 'Custom dates', value: 'dates' },
  { label: 'Indexed', value: 'indexed' },
];

/** Columns in the by-year grid; the last runs on from its year. */
const YEAR_COLUMNS = 5;

/** Later years one value previews before the model's last. */
const PREVIEW_YEARS = 4;

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
  const taxYears = useSelector(getTaxYears);
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
  const [historyOpen, setHistoryOpen] = useState(false);
  // How the value is indexed: the draft's choice, else the first money
  // member's default (current law's rate, where current law indexes it).
  const [growthChoice, setGrowthChoice] = useState<Growth>(() => {
    // The first set money member says how values move; none set, the default.
    const money = members.filter((member) => canGrow(parameters?.[member.path]));
    const set =
      money.find((member) => provisionFor(member.path)?.growth) ??
      money.find((member) => {
        const provision = provisionFor(member.path);
        return provision ? provisionChanged(provision) : false;
      }) ??
      money[0];
    return set ? growthOf(provisionFor(set.path), parameters?.[set.path]) : 'fixed';
  });
  // Open on the way the reform already sets it: a value that grows,
  // dates the grid can't show, a schedule — else one value, or indexed
  // where that is the amount's default (current law indexes it).
  const [mode, setMode] = useState<EditMode>(() => {
    const provisions = members.map((member) => provisionFor(member.path));
    if (provisions.some((provision) => provision?.growth && provision.growth !== 'fixed')) {
      return 'indexed';
    }
    if (!provisions.every(fitsGrid)) {
      return 'dates';
    }
    if (provisions.some((provision) => provisionVariesOverTime(provision ?? {}))) {
      return 'byYear';
    }
    return 'one';
  });
  // Where the draft already starts its values, earliest first.
  const startYears = members
    .map((member) => provisionFor(member.path)?.intervals?.[0]?.startDate)
    .filter((start): start is string => !!start)
    .map((start) => Number(start.slice(0, 4)))
    .sort((a, b) => a - b);
  // The year a new or indexed value starts: where the draft already
  // starts it, else the report year. The years before keep current law.
  const [fromYear, setFromYear] = useState(() => startYears[0] ?? year);
  // When it grows: the first set member's timing, else from the year after.
  const [timingChoice, setTimingChoice] = useState<GrowthTiming>(() => {
    const set = members.map((member) => provisionFor(member.path)).find((p) => p?.growthStart);
    return growthTiming(fromYear, { start: set?.growthStart, base: set?.growthBase });
  });
  // How grown values round: the first set member's, else the first money
  // member's default (the step its projections land on, if indexed).
  const [roundingChoice, setRoundingChoice] = useState<GrowthRounding>(() => {
    const set = members.map((member) => provisionFor(member.path)).find((p) => p?.growthRoundTo);
    const money = members.find((member) => canGrow(parameters?.[member.path]));
    return growthRounding(
      { roundTo: set?.growthRoundTo, round: set?.growthRound },
      money ? parameters?.[money.path] : undefined
    );
  });
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
    mode === 'byYear' ? Array.from({ length: YEAR_COLUMNS }, (_, i) => year + i) : [fromYear];
  const scheduleYear =
    mode === 'byYear' && years.includes(scheduleTab)
      ? scheduleTab
      : mode === 'byYear'
        ? year
        : fromYear;
  const lastYear = Number(maxDate.slice(0, 4));
  // A member grows only if it is money, and as current law only if current law does.
  const memberGrowth = (memberPath: string, choice: Growth): Growth => {
    const param = parameters[memberPath];
    if (!canGrow(param) || (choice === 'current_law' && !alreadyGrows(param))) {
      return 'fixed';
    }
    return choice;
  };
  const timing = growthTiming(fromYear, timingChoice);
  // One value holds; only the Indexed mode grows it.
  const activeGrowth: Growth = mode === 'indexed' ? growthChoice : 'fixed';
  const setOneValue = (
    memberPath: string,
    value: any,
    choice: Growth,
    when: GrowthTiming,
    rounding: GrowthRounding,
    from: number = fromYear,
    /** Drop the provision's dates first, so the years before `from` keep current law. */
    fresh = false
  ) => {
    const current = provisionFor(memberPath) ?? baseProvision(memberPath);
    if (!current) {
      return;
    }
    const provision = fresh
      ? { ...current, value: current.baselineValue, intervals: undefined }
      : current;
    setValueFromYear({
      countryId: draft.countryId,
      provision,
      year: from,
      value,
      growth: memberGrowth(memberPath, choice),
      timing: when,
      rounding,
      param: parameters[memberPath],
      parameters,
      lastYear,
    });
  };
  const growthMenu = growthOptions(
    draft.countryId,
    members.map((member) => parameters[member.path]),
    parameters
  );
  const changeGrowth = (choice: Growth, when: GrowthTiming, rounding: GrowthRounding) => {
    setGrowthChoice(choice);
    setTimingChoice(when);
    setRoundingChoice(rounding);
    // Every amount in the draft moves the new way from its year on — also
    // one still at current law: indexing a flat amount is itself the change,
    // and the later years then show what it grows to.
    members.forEach((member) => {
      if (provisionFor(member.path) && canGrow(parameters[member.path])) {
        setOneValue(member.path, valueAt(member.path, fromYear), choice, when, rounding);
      }
    });
  };
  // The money member whose series and amount the growth row speaks of.
  const moneyMember = members.find((member) => canGrow(parameters[member.path]));
  // "None" is the One value mode; Indexed offers the ways to grow.
  const indexMenu = growthMenu.filter((option) => option.value !== 'fixed');
  const canIndex = indexMenu.length > 0 && !!moneyMember;
  /** Indexed by default as current law indexes the amount, else with the first index offered. */
  const defaultIndexing = (): Growth =>
    indexMenu.find((option) => option.value === 'current_law')?.value ?? indexMenu[0]?.value;
  const changeMode = (next: EditMode) => {
    if (next === 'indexed' && mode !== 'indexed') {
      // Choosing Indexed indexes the amounts at once, so their later years show it.
      changeGrowth(
        growthChoice !== 'fixed' ? growthChoice : defaultIndexing(),
        timing,
        roundingChoice
      );
    }
    if (next === 'one' && mode === 'indexed') {
      // Back to one value: an edited amount holds from its year; one never
      // edited returns to current law rather than freezing there.
      members.forEach((member) => {
        const provision = provisionFor(member.path);
        if (!provision || !canGrow(parameters[member.path])) {
          return;
        }
        const value = valueAt(member.path, fromYear);
        if (sameParameterValue(value, baselineAt(member.path, fromYear))) {
          setDraftProvisionIntervals(draft.countryId, provision, []);
        } else {
          setOneValue(member.path, value, 'fixed', timing, roundingChoice);
        }
      });
    }
    setMode(next);
  };
  // A new value can start in any year the model scores, before the report
  // year or after it; the years before it keep current law. An earlier
  // start matters to a budget window that opens before the report year.
  const firstYear = Math.min(
    year,
    startYears[0] ?? year,
    ...taxYears.map((taxYear) => Number(taxYear.value)).filter(Number.isFinite)
  );
  const fromOptions = Array.from(
    { length: Math.max(Math.min(lastYear, year + 10) - firstYear + 1, 1) },
    (_, i) => firstYear + i
  );
  const changeFromYear = (next: number) => {
    const when = growthTiming(next, {});
    members.forEach((member) => {
      const provision = provisionFor(member.path);
      if (provision && provisionChanged(provision)) {
        setOneValue(
          member.path,
          valueAt(member.path, fromYear),
          activeGrowth,
          when,
          roundingChoice,
          next,
          true
        );
      }
    });
    setFromYear(next);
    // Indexing, if any, starts the year after the value does.
    setTimingChoice(when);
  };
  const growthRow =
    mode === 'indexed' && canIndex && moneyMember
      ? {
          label: 'Indexing',
          content: (
            <GrowthControl
              year={fromYear}
              lastYear={lastYear}
              value={growthChoice}
              options={indexMenu}
              timing={timing}
              seriesYearsFor={(choice) =>
                seriesYears(choice, parameters[moneyMember.path], parameters)
              }
              amountText={
                group
                  ? 'each amount'
                  : formatValue(
                      valueAt(moneyMember.path, fromYear),
                      parameters[moneyMember.path]?.unit ?? null
                    )
              }
              rounding={roundingChoice}
              currency={String(parameters[moneyMember.path]?.unit).includes('GBP') ? '£' : '$'}
              onChange={changeGrowth}
            />
          ),
        }
      : undefined;
  // What a growth makes of the value: the next years, and the last the model runs to.
  const previewYears =
    mode === 'indexed' && growthRow
      ? [
          ...Array.from({ length: PREVIEW_YEARS }, (_, i) => fromYear + 1 + i).filter(
            (at) => at <= lastYear
          ),
          ...(lastYear > fromYear + PREVIEW_YEARS ? [lastYear] : []),
        ]
      : [];

  const onCellChange = (memberPath: string, at: number, value: any) => {
    if (mode === 'one' || mode === 'indexed') {
      setOneValue(memberPath, value, activeGrowth, timing, roundingChoice);
      return;
    }
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
          <span style={sectionLabel}>Value</span>
          <SegmentedControl
            value={mode}
            onValueChange={(value) => changeMode(value as EditMode)}
            options={EDIT_MODES.filter((option) => option.value !== 'indexed' || canIndex)}
            size="xs"
            // Unstyled buttons default to white here, so the idle options
            // read as chosen too.
            className="tw:[&>button]:bg-transparent"
          />
        </div>

        {(mode === 'one' || mode === 'indexed') && (
          <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
              Applies from
            </span>
            <Select value={String(fromYear)} onValueChange={(next) => changeFromYear(Number(next))}>
              <SelectTrigger
                aria-label="Applies from"
                size="sm"
                className="tw:w-auto tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {fromOptions.map((option) => (
                  <SelectItem key={option} value={String(option)} className="tw:cursor-pointer">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

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
              footer={mode === 'indexed' ? growthRow : undefined}
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
            previewYears={previewYears}
            footer={growthRow}
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

      {/* 2. How it has moved */}
      {focusedParam && (
        <section
          aria-label="Historic values"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          <div>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((open) => !open)}
              style={{ marginLeft: `-${spacing.sm}` }}
            >
              <IconChartLine />
              {historyOpen ? 'Hide' : 'Show'} historic values
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
              aria-label="Historic values of"
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
