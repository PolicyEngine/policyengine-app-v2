import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import {
  commonHouseholdInputs,
  householdInputDescriptionOf,
  householdInputNameOf,
  householdTopicIcon,
} from '@/components/flagship/report/household/householdPickerInputs';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPayload } from '@/hooks/useFlagshipHousehold';
import type { CountryId } from '@/libs/countries';
import { describeHousehold, householdState } from '@/libs/flagship/householdDescription';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import {
  describesAHousehold,
  HOUSEHOLD_INCOME_SUBGROUPS,
  HOUSEHOLD_VARIABLE_GROUPS,
  householdVariableGroupOf,
  householdVariableSubgroupOf,
  listsForState,
} from '@/libs/flagship/householdVariableGroups';
import {
  hasParameterDependencies,
  loadParameterDependencies,
} from '@/libs/flagship/parameterDependencies';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { getInputVariables, type VariableInfo } from '@/utils/VariableResolver';

/** The countries whose results, inputs and currency the section knows. */
const HOUSEHOLD_COUNTRIES = new Set(['us', 'uk']);

/** Both policies run at once; a household new to the API takes about three minutes. */
const EXPECTED_MS = 3 * 60 * 1000;

/**
 * A new household: the household builder's own start, one adult and
 * nothing else set. A US household is measured against national poverty
 * thresholds; only the US model has them.
 */
function newHousehold(countryId: CountryId, year: string): Household {
  const household = Household.starter(countryId, year);
  return countryId === 'us' ? household.withSPM({ geography_kind: 'national' }) : household;
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
 * The report's household section: add households, describe each, then
 * see how the report's reform changes each one's net income against the
 * report's baseline, in the report's year. Nothing is filled in for the
 * reader, and nothing runs until a household's "Calculate".
 */
export default function HouseholdImpactSection({
  countryId,
  year,
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
  const add = () => {
    setKeys((current) => [...current, nextKey]);
    setNextKey((key) => key + 1);
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
          baselinePolicyId={baselinePolicyId}
          reformPolicyId={reformPolicyId}
          suggestedVariables={suggestedVariables}
          onRemove={() => setKeys((current) => current.filter((other) => other !== key))}
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
  baselinePolicyId,
  reformPolicyId,
  suggestedVariables,
  onRemove,
}: {
  /** "Household 2": its place in the list. */
  label: string;
  /** The report's country: the household's model, currency and inputs. */
  countryId: CountryId;
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  suggestedVariables: string[];
  onRemove: () => void;
}) {
  // The household as the builder edits it: every input the model takes,
  // per person and per household, as in the household builder.
  const metadata = useSelector((state: RootState) => state.metadata);
  const basicInputFields = useSelector(getBasicInputFields);
  const [household, setHousehold] = useState(() => newHousehold(countryId, year));
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
  // and only inputs that describe a household (no survey-reported totals).
  const stateCode = householdState(household, year, countryId);
  const variableFilter = useCallback(
    (variable: VariableInfo) =>
      listsForState(variable, stateCode) && describesAHousehold(variable, countryId),
    [stateCode, countryId]
  );
  // The picker's groups, featured inputs and names, for the country's model.
  const picker = useMemo(
    () => ({
      groupOf: householdVariableGroupOf(countryId),
      subgroupOf: householdVariableSubgroupOf(countryId),
      common: commonHouseholdInputs(countryId),
      nameOf: householdInputNameOf(countryId),
      describe: householdInputDescriptionOf(countryId),
    }),
    [countryId]
  );
  // Whether the household can run, as the household builder checks it.
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );

  const calculate = () => {
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
              // The household as it is now: an input fixed after the failure counts.
              onRetry={validation.isValid ? calculate : run.refetch}
            />
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
      </Stack>
    </section>
  );
}
