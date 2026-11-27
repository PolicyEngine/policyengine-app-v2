import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconPencil, IconPlus, IconTable, IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import {
  HouseholdVariationKeeper,
  toAppCalculationData,
  type HouseholdBreakdownSource,
  type HouseholdVariationSource,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import HouseholdComparison from '@/components/flagship/report/household/HouseholdComparison';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { money } from '@/components/flagship/report/household/householdMoney';
import { commonHouseholdInputs } from '@/components/flagship/report/household/householdPickerInputs';
import {
  HouseholdRunFailure,
  HouseholdRunProgress,
} from '@/components/flagship/report/household/householdRunParts';
import HouseholdSwitcher, {
  COMPARE_ALL,
  type HouseholdSelection,
  type HouseholdStatus,
} from '@/components/flagship/report/household/HouseholdSwitcher';
import { Button, SegmentedControl, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useRequestedHouseholdRun, useSaveCalculatedHousehold } from '@/hooks/useFlagshipHousehold';
import type { CountryId } from '@/libs/countries';
import { describeHousehold, householdEarnings } from '@/libs/flagship/householdDescription';
import { householdProgrammeChanges } from '@/libs/flagship/householdProgrammeChanges';
import { newV3Household } from '@/libs/flagship/householdReport';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import { describesAHousehold } from '@/libs/flagship/householdVariableGroups';
import {
  hasParameterDependencies,
  loadParameterDependencies,
} from '@/libs/flagship/parameterDependencies';
import type { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
import type {
  HouseholdCalculationData,
  HouseholdCalculationOutput,
} from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';
import {
  householdErrorCategory,
  trackHouseholdAdded,
  trackHouseholdCalculated,
  trackHouseholdCalculationRetried,
  trackHouseholdPickerOpened,
  trackHouseholdRemoved,
  trackHouseholdVariableAdded,
} from '@/utils/analytics';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { getNormalizedVariableMetadata } from '@/utils/variableMetadata';
import { getInputVariables } from '@/utils/VariableResolver';

/** The countries whose results, inputs and currency the section knows. */
const HOUSEHOLD_COUNTRIES = new Set(['us', 'uk']);

/** What the builder sets for each person it adds: not an input the reader chose. */
const ADDED_PERSON_DEFAULTS = new Set(['age', 'is_tax_unit_dependent']);

/**
 * How many inputs differ from a new household's, for analytics: a count
 * only, never a name or a value. A person the reader added comes with an
 * age (and, in the US, a dependent flag) and the new household's own
 * defaults, such as no earnings: those are not counted.
 */
export function nonDefaultInputCount(
  household: Household,
  countryId: CountryId,
  year: string,
  region?: string
): number {
  const keyOf = (scope: string, name: string, value: unknown) =>
    `${scope}|${name}|${JSON.stringify(value)}`;
  const starter = newV3Household(countryId, year, region);
  const starterPeople = new Set(starter.personNames);
  const starterKeys = new Set([
    ...starter.personNames.flatMap((person) =>
      starter
        .getPersonVariableEntries(person)
        .map((variable) => keyOf(person, variable.name, variable.value))
    ),
    ...starter
      .getConfiguredGroupsWithVariables()
      .flatMap((group) =>
        group.variables.map((variable) =>
          keyOf(`${group.entityName}/${group.groupName}`, variable.name, variable.value)
        )
      ),
  ]);
  // What any person starts with: the new household's first person's inputs.
  const personDefaults = new Set(
    starter
      .getPersonVariableEntries(starter.personNames[0] ?? '')
      .map((variable) => keyOf('person', variable.name, variable.value))
  );
  const people = household.personNames.flatMap((person) =>
    household
      .getPersonVariableEntries(person)
      .filter((variable) =>
        starterPeople.has(person)
          ? !starterKeys.has(keyOf(person, variable.name, variable.value))
          : !ADDED_PERSON_DEFAULTS.has(variable.name) &&
            !personDefaults.has(keyOf('person', variable.name, variable.value))
      )
  );
  const groups = household
    .getConfiguredGroupsWithVariables()
    .flatMap((group) =>
      group.variables.filter(
        (variable) =>
          !starterKeys.has(
            keyOf(`${group.entityName}/${group.groupName}`, variable.name, variable.value)
          )
      )
    );
  return people.length + groups.length;
}

interface HouseholdImpactSectionProps {
  countryId: string;
  /** The report's year: the households run in it. */
  year: string;
  /** The report's population. */
  region?: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The parameters the reform changes: the household inputs they read lead the variable search. */
  reformPaths?: string[];
  /** The report found the reform changes nothing in its year: no input is suggested. */
  reformChangesNothing?: boolean;
  /** The section's heading: "Compare all" sits at its right, wrapping under it on a phone. */
  heading?: ReactNode;
}

/** The heading's line: the heading, and an action at its right that wraps under it when narrow. */
function HeadingRow({ heading, action }: { heading?: ReactNode; action?: ReactNode }) {
  if (!heading && !action) {
    return null;
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.sm,
      }}
    >
      {heading}
      {action}
    </div>
  );
}

/**
 * The household inputs the reform's parameters read, nearest first, from
 * the country's own traced map; none until the map loads, or when it
 * traces none of them, or for a country without a traced map. Only inputs
 * a reader describes a household with are suggested, as the builder's
 * search lists only those.
 */
function useSuggestedInputs(paths: string[], countryId: string): string[] {
  const metadata = useSelector((state: RootState) => state.metadata);
  const inputs = useMemo(
    () =>
      new Set(
        getInputVariables(metadata)
          .filter((variable) => describesAHousehold(variable, countryId))
          .map((variable) => variable.name)
      ),
    [metadata, countryId]
  );
  const preferred = useMemo(
    () => new Set(commonHouseholdInputs(countryId).map((input) => input.name)),
    [countryId]
  );
  const pathsKey = hasParameterDependencies(countryId) ? paths.join('\n') : '';
  const [suggested, setSuggested] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!pathsKey || inputs.size === 0) {
      setSuggested([]);
      return;
    }
    loadParameterDependencies(countryId)
      .then((map) => {
        if (!cancelled) {
          setSuggested(
            suggestedHouseholdInputs(pathsKey.split('\n'), map, inputs, countryId, { preferred })
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggested([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathsKey, inputs, preferred, countryId]);
  return suggested;
}

/**
 * The report's household section: add households, name and describe
 * each, then see how the report's reform changes each one's net income
 * against the report's baseline, in the report's year. A row of tiles
 * switches between the households and a comparison of them all; the
 * panel below shows one household at a time, its results first once it
 * has them. Nothing is filled in for the reader, and nothing runs until a
 * household's "Calculate".
 */
export default function HouseholdImpactSection({
  countryId,
  year,
  region,
  baselinePolicyId,
  reformPolicyId,
  reformPaths = [],
  reformChangesNothing = false,
  heading,
}: HouseholdImpactSectionProps) {
  // A reform that changes nothing in the year makes no input worth suggesting.
  const suggestedVariables = useSuggestedInputs(reformChangesNothing ? [] : reformPaths, countryId);
  // Each household by a key of its own, so removing one keeps the others' inputs.
  const [households, setHouseholds] = useState<{ key: number; name: string }[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [selected, setSelected] = useState<HouseholdSelection | null>(null);
  // The household open before the comparison, which closing the comparison reopens.
  const [lastHousehold, setLastHousehold] = useState<number | null>(null);
  const select = (selection: HouseholdSelection | null) => {
    if (typeof selection === 'number') {
      setLastHousehold(selection);
    }
    setSelected(selection);
  };
  // What each household's tile and the comparison show, as its panel reports it.
  const [statuses, setStatuses] = useState<Record<number, HouseholdStatus>>({});
  const reportStatus = useCallback((key: number, status: HouseholdStatus) => {
    setStatuses((current) =>
      JSON.stringify(current[key]) === JSON.stringify(status)
        ? current
        : { ...current, [key]: status }
    );
  }, []);
  // Counted from the list on screen, outside the updaters: strict mode
  // runs an updater twice, and an event in one would be sent twice.
  const add = () => {
    trackHouseholdAdded({ countryId, householdCount: households.length + 1 });
    setHouseholds((current) => [...current, { key: nextKey, name: `Household ${nextKey}` }]);
    select(nextKey);
    setNextKey((key) => key + 1);
  };
  const remove = (key: number) => {
    trackHouseholdRemoved({ countryId, householdCount: households.length - 1 });
    const index = households.findIndex((household) => household.key === key);
    const rest = households.filter((household) => household.key !== key);
    setHouseholds(rest);
    setStatuses(({ [key]: _removed, ...current }) => current);
    // The neighbour before it opens, or the first one; none when none are left.
    if (selected === key || (selected === COMPARE_ALL && rest.length < 2)) {
      select(rest[Math.max(0, index - 1)]?.key ?? null);
    }
  };
  const rename = (key: number, name: string) =>
    setHouseholds((current) =>
      current.map((household) => (household.key === key ? { ...household, name } : household))
    );

  if (!HOUSEHOLD_COUNTRIES.has(countryId)) {
    return (
      <Stack style={{ gap: spacing.md }}>
        <HeadingRow heading={heading} />
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Household impacts are available for US and UK reports.
        </Text>
      </Stack>
    );
  }

  if (households.length === 0) {
    return (
      <Stack style={{ gap: spacing.md }}>
        <HeadingRow heading={heading} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.md,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            background: colors.secondary[50],
          }}
        >
          <Text
            style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}
          >
            See how this reform changes the net income of households that you describe.
          </Text>
          <Button size="sm" onClick={add}>
            <IconPlus size={16} aria-hidden />
            Add a household
          </Button>
        </div>
      </Stack>
    );
  }

  const tiles = households.map((household) => ({
    ...household,
    status: statuses[household.key],
  }));
  const comparing = selected === COMPARE_ALL;
  return (
    <Stack style={{ gap: spacing.md }}>
      <HeadingRow
        heading={heading}
        action={
          households.length > 1 && (
            <Button
              size="sm"
              variant={comparing ? 'default' : 'outline'}
              aria-pressed={comparing}
              onClick={() =>
                comparing
                  ? select(
                      households.some((household) => household.key === lastHousehold)
                        ? lastHousehold
                        : households[0].key
                    )
                  : select(COMPARE_ALL)
              }
            >
              <IconTable size={16} aria-hidden />
              Compare all ({households.length})
            </Button>
          )
        }
      />
      <HouseholdSwitcher
        households={tiles}
        selected={selected}
        countryId={countryId as CountryId}
        onSelect={select}
        onAdd={add}
      />
      {comparing && (
        <HouseholdComparison
          households={tiles}
          countryId={countryId as CountryId}
          year={year}
          onOpen={select}
        />
      )}
      {/* Every household stays mounted, so a run carries on while another shows. */}
      {households.map((household) => (
        <HouseholdCard
          key={household.key}
          householdKey={household.key}
          label={household.name}
          shown={selected === household.key}
          onRename={(name) => rename(household.key, name)}
          onStatus={reportStatus}
          countryId={countryId as CountryId}
          year={year}
          region={region}
          baselinePolicyId={baselinePolicyId}
          reformPolicyId={reformPolicyId}
          suggestedVariables={suggestedVariables}
          householdCount={households.length}
          onRemove={() => remove(household.key)}
        />
      ))}
    </Stack>
  );
}

/** The name an emptied name field falls back to. */
const defaultName = (householdKey: number) => `Household ${householdKey}`;

/**
 * The household's name, edited in place: a plain heading until hovered or
 * focused. An emptied name goes back to "Household 2".
 */
function HouseholdNameInput({
  name,
  householdKey,
  onRename,
}: {
  name: string;
  householdKey: number;
  onRename: (name: string) => void;
}) {
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);
  const commit = () => {
    const next = draft.trim() || defaultName(householdKey);
    setDraft(next);
    if (next !== name) {
      onRename(next);
    }
  };
  return (
    <input
      aria-label="Household name"
      value={draft}
      maxLength={60}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      className="tw:rounded-md tw:border tw:border-transparent tw:hover:border-gray-200 tw:focus:border-primary-500 tw:focus:outline-none"
      style={{
        minWidth: 0,
        width: '100%',
        maxWidth: 360,
        padding: `2px ${spacing.xs}`,
        marginLeft: `-${spacing.xs}`,
        background: 'transparent',
        fontFamily: typography.fontFamily.primary,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
      }}
    />
  );
}

/**
 * One household's panel: its name, then its results or its inputs. The
 * inputs lead until the household first runs; from then on the results
 * do, and the inputs are one switch away.
 */
function HouseholdCard({
  householdKey,
  label,
  shown,
  onRename,
  onStatus,
  countryId,
  year,
  region,
  baselinePolicyId,
  reformPolicyId,
  suggestedVariables,
  householdCount,
  onRemove,
}: {
  householdKey: number;
  /** "Household 2", or the name the reader gave it. */
  label: string;
  /** Whether the switcher shows this household; hidden ones keep their runs. */
  shown: boolean;
  onRename: (name: string) => void;
  /** Where the household stands, for its tile and the comparison. */
  onStatus: (key: number, status: HouseholdStatus) => void;
  /** How many households the report has: for analytics. */
  householdCount: number;
  /** The report's country: the household's model, currency and inputs. */
  countryId: CountryId;
  year: string;
  /** The report's population: a UK nation's households start there. */
  region?: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  suggestedVariables: string[];
  onRemove: () => void;
}) {
  // The household as the builder edits it: every input the model takes,
  // per person and per household, as in the household builder.
  const metadata = useSelector((state: RootState) => state.metadata);
  const [household, setHousehold] = useState(() => newV3Household(countryId, year, region));
  // The household's variation run (Varying earnings, Marginal tax rates):
  // started in the background as soon as the API stores the household,
  // beside its own run, and held here, as the card stays mounted, so it
  // and its clock carry on while another household or tab is open. A new
  // household run starts a new one; the earlier one is let go.
  const [variationRun, setVariationRun] = useState<
    (HouseholdVariationSource & { startedAt: number }) | null
  >(null);
  const startVariation = useCallback(
    (householdId: string, payload: V1HouseholdCreateEnvelope) =>
      setVariationRun((current) =>
        current?.householdId === householdId
          ? current
          : {
              countryId,
              year,
              householdId,
              baselinePolicyId,
              reformPolicyId,
              household: payload.data as unknown as HouseholdCalculationData,
              startedAt: Date.now(),
            }
      ),
    [countryId, year, baselinePolicyId, reformPolicyId]
  );
  const { requested, run, running, failed, result, request, retry, shows } =
    useRequestedHouseholdRun({ year, baselinePolicyId, reformPolicyId, onCreated: startVariation });
  // Whether the household can run, as the household builder checks it.
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );
  // Who a household is, with its earnings, so households that differ
  // only in income read apart.
  const summarize = useCallback(
    (described: Household) => {
      const earnings = householdEarnings(described, year);
      const who = describeHousehold(described, year, countryId, metadata?.variables);
      return earnings > 0 ? `${who} · ${money(earnings, countryId)} earnings` : who;
    },
    [year, countryId, metadata?.variables]
  );
  const summary = useMemo(() => summarize(household), [summarize, household]);
  // The household calculated, as its result names it.
  const requestedSummary = useMemo(
    () => (requested ? summarize(requested.household) : undefined),
    [summarize, requested]
  );
  // A result line's variable as the country model describes it, for its tip.
  const describeVariable = useCallback(
    (name: string) => getNormalizedVariableMetadata(metadata?.variables?.[name]).documentation,
    [metadata?.variables]
  );

  // The run on its way, for analytics: when it started and what it holds
  // (counts only). Cleared once its end is sent, so each run sends once.
  const pendingRun = useRef<{
    startedAt: number;
    peopleCount: number;
    nonDefaultInputs: number;
    sawRunning: boolean;
  } | null>(null);
  // When the run on screen started: its progress card mounts again each time
  // the household is opened, and its clock carries on from here, not from 0.
  const [runStartedAt, setRunStartedAt] = useState<number>();
  const startRun = () => {
    const startedAt = Date.now();
    setRunStartedAt(startedAt);
    pendingRun.current = {
      startedAt,
      peopleCount: household.personCount,
      nonDefaultInputs: nonDefaultInputCount(household, countryId, year, region),
      sawRunning: false,
    };
  };

  // Inputs until the household first runs; its results from then on.
  const [view, setView] = useState<'inputs' | 'results'>('inputs');

  const calculate = () => {
    startRun();
    request(household);
    setView('results');
  };

  // The run the v2 breakdowns read.
  const breakdowns = useMemo<HouseholdBreakdownSource | undefined>(
    () =>
      result
        ? {
            countryId,
            year,
            householdId: result.householdId,
            baselinePolicyId,
            reformPolicyId,
            baseline: result.baseline,
            reform: result.reform,
            gains: Math.round(result.netIncome.change) > 0,
          }
        : undefined,
    [result, countryId, year, baselinePolicyId, reformPolicyId]
  );
  // The programmes the reform changes, from net income's tree: "What changes".
  const programmes = useMemo(() => {
    if (!result || !metadata?.variables?.household_net_income) {
      return undefined;
    }
    const output = (data: HouseholdCalculationData): HouseholdCalculationOutput => ({
      id: result.householdId,
      countryId,
      householdData: toAppCalculationData(data),
    });
    return householdProgrammeChanges(
      output(result.baseline),
      output(result.reform),
      metadata as unknown as MetadataState,
      year
    );
  }, [result, metadata, countryId, year]);
  const resultId = result?.householdId;
  const variationStartedAt =
    variationRun && variationRun.householdId === resultId ? variationRun.startedAt : undefined;
  // A result held from earlier (the same household asked for again) stored
  // nothing new: its variation starts when either output opens.
  const requestedPayload = requested?.payload;
  const openVariation = useCallback(() => {
    if (resultId && requestedPayload) {
      startVariation(resultId, requestedPayload);
    }
  }, [resultId, requestedPayload, startVariation]);

  // A calculated household is saved to the user in the background; nothing
  // here shows it.
  useSaveCalculatedHousehold({
    countryId,
    household:
      result && requestedSummary ? { id: result.householdId, name: requestedSummary } : undefined,
  });

  // A run's end, sent once: a failure only after the run was seen running
  // (an earlier failure's error can show for a moment on a retry); a
  // result already held (the same household asked for again) at once.
  const runData = run.data;
  const runError = run.error;
  useEffect(() => {
    const pending = pendingRun.current;
    if (!pending) {
      return;
    }
    if (running) {
      pending.sawRunning = true;
      return;
    }
    const failure = run.isError && pending.sawRunning;
    if (!failure && !(runData && !run.isError)) {
      return;
    }
    pendingRun.current = null;
    trackHouseholdCalculated({
      countryId,
      householdCount,
      peopleCount: pending.peopleCount,
      nonDefaultInputs: pending.nonDefaultInputs,
      durationMs: Date.now() - pending.startedAt,
      success: !failure,
      errorCategory: failure ? householdErrorCategory(runError) : undefined,
    });
  }, [running, runData, runError, run.isError, countryId, householdCount]);

  const tryAgain = () => {
    trackHouseholdCalculationRetried({ countryId });
    startRun();
    retry(household, validation.isValid);
  };
  // The household on screen, or on its way, is the one in the builder.
  const sameAsShown = shows(household);
  // A result for inputs the reader has since changed.
  const stale = !!result && !sameAsShown;

  const state: HouseholdStatus['state'] = running
    ? 'running'
    : failed
      ? 'failed'
      : result
        ? 'done'
        : 'draft';
  const netIncome = result?.netIncome;
  useEffect(() => {
    onStatus(householdKey, {
      summary,
      state,
      stale,
      netIncome: netIncome && {
        baseline: netIncome.baseline,
        reform: netIncome.reform,
        change: netIncome.change,
      },
    });
  }, [onStatus, householdKey, summary, state, stale, netIncome]);

  // Nothing to run: the inputs are invalid, or already calculated.
  const blocked = !validation.isValid || sameAsShown;
  const calculateBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      {/* Marked unavailable, not disabled: a press on it blurs a field still
          being typed in, which commits the amount and can make the inputs
          new; a browser drops the click of a press that landed on a disabled
          button, so this one stays clickable and checks again on the click. */}
      <Button
        onClick={() => {
          if (!blocked) {
            calculate();
          }
        }}
        disabled={running}
        aria-disabled={blocked || undefined}
        className={blocked ? 'tw:cursor-not-allowed tw:opacity-50' : undefined}
      >
        {result ? 'Calculate again' : 'Calculate'}
      </Button>
      {!validation.isValid && validation.errors[0] ? (
        <span style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
          {validation.errors[0].message}
        </span>
      ) : sameAsShown && !running ? (
        <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          These inputs are calculated.{' '}
          <button
            type="button"
            onClick={() => setView('results')}
            className="tw:cursor-pointer tw:hover:underline"
            style={{
              padding: 0,
              border: 'none',
              background: 'none',
              font: 'inherit',
              color: colors.primary[700],
            }}
          >
            See the results
          </button>
        </span>
      ) : null}
    </div>
  );

  return (
    <section
      aria-label={label}
      hidden={!shown}
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <HouseholdNameInput name={label} householdKey={householdKey} onRename={onRename} />
        </div>
        <SegmentedControl
          value={view}
          onValueChange={(next) => setView(next as 'inputs' | 'results')}
          options={[
            { value: 'results', label: 'Results' },
            { value: 'inputs', label: 'Inputs' },
          ]}
        />
        <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Remove ${label}`}>
          <IconTrash size={14} aria-hidden />
          Remove
        </Button>
      </div>
      {shown && (
        <div style={{ padding: spacing.lg, minWidth: 0 }}>
          {view === 'inputs' ? (
            <Stack style={{ gap: spacing.lg, minWidth: 0 }}>
              <HouseholdBuilderPanel
                household={household}
                countryId={countryId}
                year={year}
                onChange={setHousehold}
                disabled={running}
                suggestedVariables={suggestedVariables}
                onVariablePickerOpen={(entity) => trackHouseholdPickerOpened({ countryId, entity })}
                onVariableAdd={({ variable, source, entity }) =>
                  trackHouseholdVariableAdded({ countryId, variable, source, entity })
                }
              />
              {calculateBar}
            </Stack>
          ) : (
            <Stack style={{ gap: spacing.lg, minWidth: 0 }}>
              {!requested && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    Describe this household, then calculate it to see its results.
                  </Text>
                  <Button size="sm" variant="outline" onClick={() => setView('inputs')}>
                    <IconPencil size={14} aria-hidden />
                    Go to inputs
                  </Button>
                </div>
              )}

              {running && <HouseholdRunProgress startedAt={runStartedAt} />}

              {failed && <HouseholdRunFailure error={run.error} onRetry={tryAgain} />}

              {stale && (
                <div
                  role="status"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: spacing.md,
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: spacing.radius.element,
                    background: colors.gray[50],
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  The inputs changed after this result was calculated.
                  <Button size="sm" onClick={calculate} disabled={!validation.isValid}>
                    Calculate again
                  </Button>
                </div>
              )}

              {result && requestedSummary && (
                <HouseholdImpactResult
                  impact={result}
                  countryId={countryId}
                  describe={describeVariable}
                  methodology={{
                    baseline: result.provenance.baseline,
                    // One calculation served both policies: its methodology shows once.
                    reform: baselinePolicyId === reformPolicyId ? null : result.provenance.reform,
                  }}
                  summary={`${requestedSummary} · ${year}`}
                  breakdowns={breakdowns}
                  programmes={programmes}
                  variationStartedAt={variationStartedAt}
                  onVariationOpen={openVariation}
                />
              )}
            </Stack>
          )}
        </div>
      )}
      {variationRun && !failed && <HouseholdVariationKeeper source={variationRun} />}
    </section>
  );
}
