import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { STATE_NAMES } from '@/api/billFeed';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPayload } from '@/hooks/useFlagshipHousehold';
import { stateFromRegion } from '@/libs/flagship/householdRun';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

/** Both policies run at once; one household typically takes under a minute. */
const EXPECTED_MS = 45 * 1000;

/** Where the household starts: the report's state, else California, the model's default. */
const DEFAULT_STATE = 'CA';
const DEFAULT_EARNINGS = 50000;

/**
 * The household to start from: the builder's own, in the report's state,
 * earning $50,000 a year, measured against national poverty thresholds —
 * so "Calculate" works at once, and anything can be changed or added.
 */
function starterHousehold(year: string, region?: string): Household {
  let household = Household.starter('us', year).withSPM({ geography_kind: 'national' });
  const householdKey = Object.keys(household.householdData.households ?? {})[0];
  if (householdKey) {
    household = household.setGroupVariableAtYear(
      'households',
      householdKey,
      'state_name',
      year,
      stateFromRegion(region) ?? DEFAULT_STATE
    );
  }
  const { primaryPersonKey } = household.deriveBuilderComposition(year);
  return primaryPersonKey
    ? household.setPersonVariableAtYear(
        primaryPersonKey,
        'employment_income',
        year,
        DEFAULT_EARNINGS
      )
    : household;
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
  /** The report's year: the household runs in it. */
  year: string;
  /** The report's population; a state's report starts the household there. */
  region?: string;
  baselinePolicyId: string;
  reformPolicyId: string;
}

/**
 * The report's household section: describe one household, then see how
 * the report's reform changes its net income against the report's
 * baseline, in the report's year. Nothing runs until "Calculate".
 */
export default function HouseholdImpactSection({
  countryId,
  year,
  region,
  baselinePolicyId,
  reformPolicyId,
}: HouseholdImpactSectionProps) {
  // The household as the builder edits it: every input the model takes,
  // per person and per household, as in the household builder.
  const metadata = useSelector((state: RootState) => state.metadata);
  const basicInputFields = useSelector(getBasicInputFields);
  const [household, setHousehold] = useState(() => starterHousehold(year, region));
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

  if (countryId !== 'us') {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Household impacts are available for US reports.
      </Text>
    );
  }

  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;
  // The household on screen, or on its way, is the one in the builder.
  const sameAsShown =
    !!requested &&
    !failed &&
    JSON.stringify(requested.payload) === JSON.stringify(household.toV1CreationPayload());

  return (
    <Stack style={{ gap: spacing.lg }}>
      <div
        style={{
          padding: spacing.lg,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
          background: colors.secondary[50],
        }}
      >
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
            setHousehold((current) => current.withBuilderMaritalStatus(year, status))
          }
          onNumChildrenChange={(count) =>
            setHousehold((current) => current.withBuilderChildCount(year, count))
          }
          disabled={running}
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
  );
}
