import { useEffect, useMemo, useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { STATE_NAMES } from '@/api/billFeed';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPayload } from '@/hooks/useFlagshipHousehold';
import { suggestedHouseholdInputs } from '@/libs/flagship/householdSuggestions';
import { loadParameterDependencies } from '@/libs/flagship/parameterDependencies';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { getInputVariables } from '@/utils/VariableResolver';

/** Both policies run at once; one household typically takes under a minute. */
const EXPECTED_MS = 45 * 1000;

/**
 * A new household: the household builder's own start, one adult and
 * nothing else set, measured against national poverty thresholds.
 */
function newHousehold(year: string): Household {
  return Household.starter('us', year).withSPM({ geography_kind: 'national' });
}

/** "Married · 2 children · New York": who a result is for. */
function describeHousehold(household: Household, year: string): string {
  const { maritalStatus, numChildren } = household.deriveBuilderComposition(year);
  const householdKey = Object.keys(household.householdData.households ?? {})[0];
  const state = householdKey
    ? (household.householdData.households?.[householdKey] as any)?.state_name?.[year]
    : undefined;
  return [
    maritalStatus === 'married' ? 'Married' : 'Single',
    numChildren === 0 ? 'no children' : numChildren === 1 ? '1 child' : `${numChildren} children`,
    ...(typeof state === 'string' ? [STATE_NAMES[state] ?? state] : []),
  ].join(' · ');
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
}

/**
 * The household inputs the reform's parameters read, nearest first; none
 * until the dependency map loads, or when it traces none of them.
 */
function useSuggestedInputs(paths: string[]): string[] {
  const metadata = useSelector((state: RootState) => state.metadata);
  const inputs = useMemo(
    () => new Set(getInputVariables(metadata).map((variable) => variable.name)),
    [metadata]
  );
  const pathsKey = paths.join('\n');
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
          setSuggested(suggestedHouseholdInputs(pathsKey.split('\n'), map, inputs));
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
  }, [pathsKey, inputs]);
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
}: HouseholdImpactSectionProps) {
  const suggestedVariables = useSuggestedInputs(reformPaths);
  // Each household by a key of its own, so removing one keeps the others' inputs.
  const [keys, setKeys] = useState<number[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const add = () => {
    setKeys((current) => [...current, nextKey]);
    setNextKey((key) => key + 1);
  };

  if (countryId !== 'us') {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Household impacts are available for US reports.
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
  year,
  baselinePolicyId,
  reformPolicyId,
  suggestedVariables,
  onRemove,
}: {
  /** "Household 2": its place in the list. */
  label: string;
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
  const [household, setHousehold] = useState(() => newHousehold(year));
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
  // Whether the household can run, as the household builder checks it.
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, 'us', year, metadata),
    [household, year, metadata]
  );

  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;
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
        <div style={{ minWidth: 0 }}>
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
              onClick={() => {
                const payload = household.toV1CreationPayload();
                // The same household again, after a failure, asks once more.
                if (requested && JSON.stringify(requested.payload) === JSON.stringify(payload)) {
                  void run.refetch();
                } else {
                  setRequested({ payload, summary: describeHousehold(household, year) });
                }
              }}
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
              onRetry={run.refetch}
            />
          )}

          {result && requested && (
            <HouseholdImpactResult impact={result} summary={`${requested.summary} · ${year}`} />
          )}
        </Stack>
      </Stack>
    </section>
  );
}
