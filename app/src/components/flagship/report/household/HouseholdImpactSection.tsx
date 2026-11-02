import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdComparison from '@/components/flagship/report/household/HouseholdComparison';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { money } from '@/components/flagship/report/household/householdMoney';
import {
  commonHouseholdInputs,
  householdInputDescriptionOf,
  householdInputNameOf,
  householdTopicIcon,
} from '@/components/flagship/report/household/householdPickerInputs';
import HouseholdSwitcher, {
  COMPARE_ALL,
  type HouseholdSelection,
  type HouseholdStatus,
} from '@/components/flagship/report/household/HouseholdSwitcher';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Button, SegmentedControl, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  useFlagshipHouseholdPayload,
  useSaveCalculatedHousehold,
} from '@/hooks/useFlagshipHousehold';
import type { CountryId } from '@/libs/countries';
import {
  describeHousehold,
  householdEarnings,
  householdState,
} from '@/libs/flagship/householdDescription';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import {
  describesAHousehold,
  HOUSEHOLD_INCOME_SUBGROUPS,
  HOUSEHOLD_VARIABLE_GROUPS,
  householdVariableGroupOf,
  householdVariableSubgroupOf,
  listsForState,
  twinsABasicInput,
} from '@/libs/flagship/householdVariableGroups';
import {
  hasParameterDependencies,
  loadParameterDependencies,
} from '@/libs/flagship/parameterDependencies';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
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
import { getInputVariables, type VariableInfo } from '@/utils/VariableResolver';

/** The countries whose results, inputs and currency the section knows. */
const HOUSEHOLD_COUNTRIES = new Set(['us', 'uk']);

/** Both policies run at once; a household new to the API takes about three minutes. */
const EXPECTED_MS = 3 * 60 * 1000;

/**
 * Where a household in each UK nation lives unless the reader says
 * otherwise: the nation's region, with its capital's local authority and
 * Broad Rental Market Area, so the three name one place. England has no
 * one region; its households keep the model's defaults.
 */
const UK_NATION_PLACES: Record<string, Record<string, string>> = {
  scotland: { region: 'SCOTLAND', local_authority: 'CITY_OF_EDINBURGH', brma: 'LOTHIAN' },
  wales: { region: 'WALES', local_authority: 'CARDIFF', brma: 'CARDIFF' },
  northern_ireland: { region: 'NORTHERN_IRELAND', local_authority: 'BELFAST', brma: 'BELFAST' },
};

/** A UK report's nation's place, for "country/scotland"; none for any other region. */
export function ukNationPlace(region: string | undefined): Record<string, string> | null {
  const match = /^country\/(.+)$/i.exec(region ?? '');
  return (match && UK_NATION_PLACES[match[1].toLowerCase()]) || null;
}

/**
 * A new household: the household builder's own start, one adult and
 * nothing else set. A US household is measured against national poverty
 * thresholds; only the US model has them. A UK household in a report on
 * Scotland, Wales or Northern Ireland starts there.
 */
function newHousehold(countryId: CountryId, year: string, region?: string): Household {
  const household = Household.starter(countryId, year);
  if (countryId === 'us') {
    return household.withSPM({ geography_kind: 'national' });
  }
  const place = countryId === 'uk' ? ukNationPlace(region) : null;
  const group = household.getPreferredGroupName('households');
  if (!place || !group) {
    return household;
  }
  return Object.entries(place).reduce(
    (current, [name, value]) =>
      current.setEntityVariableAtYear('households', group, name, year, value),
    household
  );
}

/**
 * A person's name as a country's builder shows it: a UK household's
 * dependants are its children ("your first child"), as the UK model's
 * benefits count them; the US keeps "dependent", which a tax unit's
 * dependants are called. Only the name shown changes, never the key.
 */
export function householdPersonNameOf(
  countryId: string
): ((personKey: string) => string) | undefined {
  return countryId === 'uk'
    ? (personKey) => personKey.replace(/\bdependent\b/, 'child')
    : undefined;
}

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
  const starter = newHousehold(countryId, year, region);
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
}

/**
 * The household inputs the reform's parameters read, nearest first; none
 * until the dependency map loads, or when it traces none of them, or for
 * a country without a traced map.
 */
function useSuggestedInputs(paths: string[], countryId: string): string[] {
  const metadata = useSelector((state: RootState) => state.metadata);
  const inputs = useMemo(
    () => new Set(getInputVariables(metadata).map((variable) => variable.name)),
    [metadata]
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
    loadParameterDependencies()
      .then((map) => {
        if (!cancelled) {
          setSuggested(
            suggestedHouseholdInputs(
              pathsKey.split('\n'),
              map,
              inputs,
              undefined,
              preferred,
              countryId
            )
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
}: HouseholdImpactSectionProps) {
  // A reform that changes nothing in the year makes no input worth suggesting.
  const suggestedVariables = useSuggestedInputs(reformChangesNothing ? [] : reformPaths, countryId);
  // Each household by a key of its own, so removing one keeps the others' inputs.
  const [households, setHouseholds] = useState<{ key: number; name: string }[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [selected, setSelected] = useState<HouseholdSelection | null>(null);
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
    setSelected(nextKey);
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
      setSelected(rest[Math.max(0, index - 1)]?.key ?? null);
    }
  };
  const rename = (key: number, name: string) =>
    setHouseholds((current) =>
      current.map((household) => (household.key === key ? { ...household, name } : household))
    );

  if (!HOUSEHOLD_COUNTRIES.has(countryId)) {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Household impacts are available for US and UK reports.
      </Text>
    );
  }

  if (households.length === 0) {
    return (
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
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          See how this reform changes the net income of households that you describe.
        </Text>
        <Button size="sm" onClick={add}>
          <IconPlus size={16} aria-hidden />
          Add a household
        </Button>
      </div>
    );
  }

  const tiles = households.map((household) => ({
    ...household,
    status: statuses[household.key],
  }));
  return (
    <Stack style={{ gap: spacing.md }}>
      <HouseholdSwitcher
        households={tiles}
        selected={selected}
        countryId={countryId as CountryId}
        onSelect={setSelected}
        onAdd={add}
      />
      {selected === COMPARE_ALL && (
        <HouseholdComparison
          households={tiles}
          countryId={countryId as CountryId}
          year={year}
          onOpen={setSelected}
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
  const basicInputFields = useSelector(getBasicInputFields);
  const [household, setHousehold] = useState(() => newHousehold(countryId, year, region));
  const [requested, setRequested] = useState<{
    payload: V1HouseholdCreateEnvelope;
    summary: string;
  } | null>(null);
  const run = useFlagshipHouseholdPayload({
    year,
    baselinePolicyId,
    reformPolicyId,
    payload: requested?.payload ?? null,
  });
  const composition = useMemo(() => household.deriveBuilderComposition(year), [household, year]);
  const basicNonPersonFields = useMemo(
    () =>
      Object.entries(basicInputFields)
        .filter(([key]) => key !== 'person')
        .flatMap(([, fields]) => fields),
    [basicInputFields]
  );
  // The variable search lists only the household's own state's programs,
  // only inputs that describe a household (no survey-reported totals), and
  // not the twin of a field the builder already shows.
  const stateCode = householdState(household, year, countryId);
  const basicPersonFields = basicInputFields.person;
  const variableFilter = useCallback(
    (variable: VariableInfo) =>
      listsForState(variable, stateCode) &&
      describesAHousehold(variable, countryId) &&
      !twinsABasicInput(variable, basicPersonFields ?? []),
    [stateCode, countryId, basicPersonFields]
  );
  // The picker's groups, featured inputs and names, for the country's model.
  const picker = useMemo(
    () => ({
      groupOf: householdVariableGroupOf(countryId),
      subgroupOf: householdVariableSubgroupOf(countryId),
      common: commonHouseholdInputs(countryId),
      nameOf: householdInputNameOf(countryId),
      describe: householdInputDescriptionOf(countryId),
      personNameOf: householdPersonNameOf(countryId),
    }),
    [countryId]
  );
  // Whether the household can run, as the household builder checks it.
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );
  // Who the household is, with its earnings, so households that differ
  // only in income read apart.
  const summary = useMemo(() => {
    const earnings = householdEarnings(household, year);
    const who = describeHousehold(household, year, countryId, metadata?.variables);
    return earnings > 0 ? `${who} · ${money(earnings, countryId)} earnings` : who;
  }, [household, year, countryId, metadata?.variables]);

  // The run on its way, for analytics: when it started and what it holds
  // (counts only). Cleared once its end is sent, so each run sends once.
  const pendingRun = useRef<{
    startedAt: number;
    peopleCount: number;
    nonDefaultInputs: number;
    sawRunning: boolean;
  } | null>(null);
  const startRun = () => {
    pendingRun.current = {
      startedAt: Date.now(),
      peopleCount: household.personCount,
      nonDefaultInputs: nonDefaultInputCount(household, countryId, year, region),
      sawRunning: false,
    };
  };

  // Inputs until the household first runs; its results from then on.
  const [view, setView] = useState<'inputs' | 'results'>('inputs');

  const calculate = () => {
    startRun();
    const payload = household.toV1CreationPayload();
    // The same household again, after a failure, asks once more.
    if (requested && JSON.stringify(requested.payload) === JSON.stringify(payload)) {
      void run.refetch();
    } else {
      setRequested({ payload, summary });
    }
    setView('results');
  };

  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;
  // A calculated household is saved to the user in the background; nothing
  // here shows it.
  useSaveCalculatedHousehold({
    countryId,
    household:
      result && requested ? { id: result.householdId, name: requested.summary } : undefined,
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

  const retry = () => {
    trackHouseholdCalculationRetried({ countryId });
    // The household as it is now: an input fixed after the failure counts.
    if (validation.isValid) {
      calculate();
    } else {
      startRun();
      void run.refetch();
    }
  };
  // The household on screen, or on its way, is the one in the builder.
  const sameAsShown =
    !!requested &&
    !failed &&
    JSON.stringify(requested.payload) === JSON.stringify(household.toV1CreationPayload());
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

  const calculateBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      <Button onClick={calculate} disabled={running || !validation.isValid || sameAsShown}>
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
              <HouseholdBuilderForm
                household={household}
                metadata={metadata}
                year={year}
                maritalStatus={composition.maritalStatus}
                numChildren={composition.numChildren}
                basicPersonFields={basicInputFields.person || []}
                basicNonPersonFields={basicNonPersonFields}
                onChange={setHousehold}
                onMaritalStatusChange={(status) =>
                  setHousehold(household.withBuilderMaritalStatus(year, status))
                }
                onNumChildrenChange={(count) =>
                  setHousehold(household.withBuilderChildCount(year, count))
                }
                disabled={running}
                // National poverty thresholds, the model's default, without the choice.
                hideSpmGeography
                layout="columns"
                suggestedVariables={suggestedVariables}
                suggestedLabel="Related to this reform"
                searchRanking="relevance"
                variableGroupOf={picker.groupOf}
                variableGroupOrder={HOUSEHOLD_VARIABLE_GROUPS}
                variableFilter={variableFilter}
                variableSubgroupOf={picker.subgroupOf}
                variableSubgroupOrder={HOUSEHOLD_INCOME_SUBGROUPS}
                searchByEntity
                variablePickerCommon={picker.common}
                variableGroupIcon={householdTopicIcon}
                variableNameOf={picker.nameOf}
                variableDescribe={picker.describe}
                personDisplayNameOf={picker.personNameOf}
                labelInputs
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

              {running && (
                <RunProgress title="Calculating this household" expectedMs={EXPECTED_MS} />
              )}

              {failed && (
                <ErrorState
                  compact
                  title="This household could not be calculated"
                  description={
                    // An API message can carry a long unbroken path.
                    run.error?.message && (
                      <span style={{ overflowWrap: 'anywhere' }}>{run.error.message}</span>
                    )
                  }
                  onRetry={retry}
                />
              )}

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

              {result && requested && (
                <HouseholdImpactResult
                  impact={result}
                  countryId={countryId}
                  summary={`${requested.summary} · ${year}`}
                  breakdowns={{
                    countryId,
                    year,
                    householdId: result.householdId,
                    baselinePolicyId,
                    reformPolicyId,
                    baseline: result.baseline,
                    reform: result.reform,
                    gains: Math.round(result.netIncome.change) > 0,
                  }}
                />
              )}
            </Stack>
          )}
        </div>
      )}
    </section>
  );
}
