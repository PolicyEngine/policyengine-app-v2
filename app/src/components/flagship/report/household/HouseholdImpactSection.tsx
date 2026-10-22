import { useEffect, useMemo, useRef, useState } from 'react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { commonHouseholdInputs } from '@/components/flagship/report/household/householdPickerInputs';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPayload } from '@/hooks/useFlagshipHousehold';
import type { CountryId } from '@/libs/countries';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import { describesAHousehold } from '@/libs/flagship/householdVariableGroups';
import {
  hasParameterDependencies,
  loadParameterDependencies,
} from '@/libs/flagship/parameterDependencies';
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
import { getInputVariables } from '@/utils/VariableResolver';

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
  ni: { region: 'NORTHERN_IRELAND', local_authority: 'BELFAST', brma: 'BELFAST' },
  northern_ireland: { region: 'NORTHERN_IRELAND', local_authority: 'BELFAST', brma: 'BELFAST' },
};

/** A UK report's nation's place, for "country/scotland"; none for any other region. */
export function ukNationPlace(region: string | undefined): Record<string, string> | null {
  const match = /^country\/(.+)$/i.exec(region ?? '');
  return (match && UK_NATION_PLACES[match[1].toLowerCase()]) || null;
}

/**
 * A new household: the household builder's own start, one adult and
 * nothing else set. A US household starts on national poverty
 * thresholds, which the builder's SPM geography choice can change to a
 * county's; only the US model has them. A UK household in a report on
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
 * The report's household section: add households, describe each, then
 * see how the report's reform changes each one's net income against the
 * report's baseline, in the report's year. Nothing is filled in for the
 * reader, and nothing runs until a household's "Calculate".
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
  const [keys, setKeys] = useState<number[]>([]);
  const [nextKey, setNextKey] = useState(1);
  // Counted from the list on screen, outside the updaters: strict mode
  // runs an updater twice, and an event in one would be sent twice.
  const add = () => {
    trackHouseholdAdded({ countryId, householdCount: keys.length + 1 });
    setKeys((current) => [...current, nextKey]);
    setNextKey((key) => key + 1);
  };
  const remove = (key: number) => {
    trackHouseholdRemoved({ countryId, householdCount: keys.length - 1 });
    setKeys((current) => current.filter((other) => other !== key));
  };

  if (!HOUSEHOLD_COUNTRIES.has(countryId)) {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Household impacts are available for US and UK reports.
      </Text>
    );
  }

  if (keys.length === 0) {
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

  return (
    <Stack style={{ gap: spacing.xl }}>
      {keys.map((key, index) => (
        <HouseholdCard
          key={key}
          label={`Household ${index + 1}`}
          countryId={countryId as CountryId}
          year={year}
          region={region}
          baselinePolicyId={baselinePolicyId}
          reformPolicyId={reformPolicyId}
          suggestedVariables={suggestedVariables}
          householdCount={keys.length}
          onRemove={() => remove(key)}
        />
      ))}
      <div>
        <Button size="sm" variant="outline" onClick={add}>
          <IconPlus size={16} aria-hidden />
          Add another household
        </Button>
      </div>
    </Stack>
  );
}

/** One household: its builder, its Calculate, and its result. */
function HouseholdCard({
  label,
  countryId,
  year,
  region,
  baselinePolicyId,
  reformPolicyId,
  suggestedVariables,
  householdCount,
  onRemove,
}: {
  /** "Household 2": its place in the list. */
  label: string;
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
  // Whether the household can run, as the household builder checks it.
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );

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

  const calculate = () => {
    startRun();
    const payload = household.toV1CreationPayload();
    // The same household again, after a failure, asks once more.
    if (requested && JSON.stringify(requested.payload) === JSON.stringify(payload)) {
      void run.refetch();
    } else {
      setRequested({
        payload,
        summary: describeHousehold(household, year, countryId, metadata?.variables),
      });
    }
    setEditing(false);
  };

  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;
  // Once a household runs, its result leads: the inputs fold to one line
  // until the reader edits them again.
  const [editing, setEditing] = useState(true);
  const showInputs = editing || !requested || failed;

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

  return (
    <section
      aria-label={label}
      style={{
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
          padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {label}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
        >
          <IconTrash size={14} aria-hidden />
          Remove
        </Button>
      </div>
      <Stack style={{ gap: spacing.lg, padding: spacing.lg }}>
        {!showInputs && (
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
              style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}
            >
              {describeHousehold(household, year, countryId, metadata?.variables)}
            </Text>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={running}>
              <IconPencil size={14} aria-hidden />
              Edit household
            </Button>
          </div>
        )}
        <div style={{ minWidth: 0, display: showInputs ? undefined : 'none' }}>
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spacing.md,
              marginTop: spacing.lg,
            }}
          >
            <Button
              size="sm"
              onClick={calculate}
              disabled={running || !validation.isValid || sameAsShown}
            >
              Calculate
            </Button>
            {!validation.isValid && validation.errors[0] && (
              <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                {validation.errors[0].message}
              </span>
            )}
          </div>
        </div>

        <Stack style={{ gap: spacing.md, minWidth: 0 }}>
          {running && <RunProgress title="Calculating this household" expectedMs={EXPECTED_MS} />}

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

          {result && requested && (
            <HouseholdImpactResult
              impact={result}
              countryId={countryId}
              methodology={{
                baseline: result.provenance.baseline,
                // One calculation served both policies: its methodology shows once.
                reform: baselinePolicyId === reformPolicyId ? null : result.provenance.reform,
              }}
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
      </Stack>
    </section>
  );
}
