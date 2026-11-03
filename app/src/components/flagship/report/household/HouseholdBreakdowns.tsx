import { useEffect, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import { Spinner, Stack, Text } from '@/components/ui';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPolicies } from '@/hooks/useFlagshipHousehold';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import { normalizeHouseholdGroupAppKey } from '@/models/household/schema';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import MarginalTaxRatesSubPage from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';
import type { RootState } from '@/store';
import type {
  HouseholdCalculationData,
  HouseholdCalculationOutput,
} from '@/types/calculation/household';
import type { Simulation } from '@/types/ingredients/Simulation';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';

/** The v2 household outputs a v3 household result offers, after its own summary. */
export const HOUSEHOLD_BREAKDOWN_VIEWS = [
  { value: 'net-income', label: 'Net income' },
  { value: 'earnings-variation', label: 'Varying earnings' },
  { value: 'marginal-tax-rates', label: 'Marginal tax rates' },
] as const;

export type HouseholdBreakdownView = (typeof HOUSEHOLD_BREAKDOWN_VIEWS)[number]['value'];

/**
 * A variation calculates the household across a range of earnings under
 * each policy: like a household run, a few minutes on the API today.
 */
const VARIATION_EXPECTED_MS = 3 * 60 * 1000;

/** What the v2 breakdowns read: the household run, its policies and its year. */
export interface HouseholdBreakdownSource {
  countryId: string;
  year: string;
  /** The household's id in the API, as created for the run. */
  householdId: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household calculated under each policy. */
  baseline: HouseholdCalculationData;
  reform: HouseholdCalculationData;
  /** Whether the reform raises the household's net income: the breakdown's accent. */
  gains: boolean;
}

/**
 * The household as the v2 outputs read it: the API names its groups in
 * snake case ("tax_units"), the v2 readers by the app's keys ("taxUnits").
 */
export function toAppCalculationData(data: HouseholdCalculationData): HouseholdCalculationData {
  return Object.fromEntries(
    Object.entries(data as unknown as Record<string, unknown>).map(([key, value]) => [
      key === 'people' ? key : (normalizeHouseholdGroupAppKey(key) ?? key),
      value,
    ])
  ) as unknown as HouseholdCalculationData;
}

/** The household run as the v2 outputs hold it: calculation outputs and simulations. */
function useBreakdownInputs(source: HouseholdBreakdownSource) {
  const { countryId, householdId, baselinePolicyId, reformPolicyId } = source;
  const samePolicy = baselinePolicyId === reformPolicyId;
  const baseline = useMemo<HouseholdCalculationOutput>(
    () => ({
      id: householdId,
      countryId: countryId as HouseholdCalculationOutput['countryId'],
      householdData: toAppCalculationData(source.baseline),
    }),
    [countryId, householdId, source.baseline]
  );
  const reform = useMemo<HouseholdCalculationOutput | null>(
    () =>
      samePolicy
        ? null
        : {
            id: householdId,
            countryId: countryId as HouseholdCalculationOutput['countryId'],
            householdData: toAppCalculationData(source.reform),
          },
    [countryId, householdId, samePolicy, source.reform]
  );
  // The household under each policy, as v2 holds a report's simulations.
  const simulations = useMemo<Simulation[]>(
    () =>
      (samePolicy ? [baselinePolicyId] : [baselinePolicyId, reformPolicyId]).map((policyId) => ({
        countryId: countryId as Simulation['countryId'],
        policyId,
        populationId: householdId,
        populationType: 'household',
        label: null,
        isCreated: true,
      })),
    [baselinePolicyId, countryId, householdId, reformPolicyId, samePolicy]
  );
  const policyIds = useMemo(
    () => simulations.map((simulation) => simulation.policyId!),
    [simulations]
  );
  return { baseline, reform, simulations, policyIds };
}

/** What a household's variation run needs: the stored household, as it was sent. */
export interface HouseholdVariationSource {
  countryId: string;
  year: string;
  /** The household's id in the API, as created for the run. */
  householdId: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household's people and groups, as sent to the API. */
  household: HouseholdCalculationData;
}

/**
 * Runs a household's variation (Varying earnings, Marginal tax rates) in
 * the background, from when the household is stored, beside its own run:
 * either output then opens on the chart, or on the bar already running.
 * The v2 outputs ask for the same two variations (the same query keys),
 * so they read this run rather than start one; and as the household's
 * card holds it, the run carries on while another household or tab is
 * open. It shows nothing.
 */
export function HouseholdVariationKeeper({ source }: { source: HouseholdVariationSource }) {
  const { countryId, year, householdId, baselinePolicyId, reformPolicyId } = source;
  const samePolicy = baselinePolicyId === reformPolicyId;
  const policyIds = useMemo(
    () => (samePolicy ? [baselinePolicyId] : [baselinePolicyId, reformPolicyId]),
    [baselinePolicyId, reformPolicyId, samePolicy]
  );
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const { policies } = useFlagshipHouseholdPolicies({ countryId, policyIds, enabled: true });
  const baselinePolicy = policies.find((policy) => policy.id === baselinePolicyId);
  const reformPolicy = samePolicy
    ? undefined
    : policies.find((policy) => policy.id === reformPolicyId);
  const baselinePolicyData = useMemo(
    () => (baselinePolicy ? PolicyAdapter.toCreationPayload(baselinePolicy, parameters).data : {}),
    [baselinePolicy, parameters]
  );
  const reformPolicyData = useMemo(
    () => (reformPolicy ? PolicyAdapter.toCreationPayload(reformPolicy, parameters).data : {}),
    [reformPolicy, parameters]
  );
  // The person the outputs vary, as they choose it: the same people under
  // each policy, so the same person for both.
  const personName = useMemo(
    () =>
      getHeadOfHouseholdPersonName(
        { householdData: toAppCalculationData(source.household) } as HouseholdCalculationOutput,
        year
      ),
    [source.household, year]
  );
  useHouseholdVariation({
    householdId,
    policyId: baselinePolicyId,
    policyData: baselinePolicyData,
    year,
    countryId,
    personName,
    enabled: !!baselinePolicy,
  });
  useHouseholdVariation({
    householdId,
    policyId: reformPolicyId,
    policyData: reformPolicyData,
    year,
    countryId,
    personName,
    enabled: !!reformPolicy,
  });
  return null;
}

/**
 * One v2 household output for a v3 household, with the v2 component
 * itself. The v2 components read the report's year from context and the
 * household and policies as a v2 report holds them (calculation outputs,
 * simulations, policies), so this gives them both.
 */
export default function HouseholdBreakdowns({
  view,
  source,
  variationStartedAt,
  onVariationOpen,
}: {
  view: HouseholdBreakdownView;
  source: HouseholdBreakdownSource;
  /** When the household's variation run started, if it has. */
  variationStartedAt?: number;
  /** Called when a variation output opens: the run starts, or carries on. */
  onVariationOpen?: () => void;
}) {
  const { countryId, year } = source;
  const { baseline, reform, simulations, policyIds } = useBreakdownInputs(source);
  // Only the variation outputs send the policies; fetched when one opens.
  const needsPolicies = view === 'earnings-variation' || view === 'marginal-tax-rates';
  // Both outputs read one variation run, held by the household's card: its
  // clock starts when either first opens, and carries on when either opens again.
  useEffect(() => {
    if (needsPolicies) {
      onVariationOpen?.();
    }
  }, [needsPolicies, onVariationOpen]);
  const policyQuery = useFlagshipHouseholdPolicies({
    countryId,
    policyIds,
    enabled: needsPolicies,
  });

  let content: ReactNode;
  if (view === 'net-income') {
    content = (
      <Stack style={{ gap: spacing.md }}>
        <HouseholdBreakdown
          baseline={baseline}
          reform={reform}
          borderColor={source.gains ? colors.primary[700] : colors.text.secondary}
          unchangedShowsValue
        />
        <Text
          style={{
            margin: 0,
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            textAlign: 'center',
          }}
        >
          Click on any item to see its detailed breakdown
        </Text>
      </Stack>
    );
  } else if (policyQuery.error) {
    content = (
      <ErrorState
        compact
        title="The report's policies could not be loaded"
        description={policyQuery.error.message}
        onRetry={policyQuery.retry}
      />
    );
  } else if (policyQuery.isLoading) {
    content = (
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <Spinner size="sm" />
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm }}>
          Loading the report&apos;s policies...
        </Text>
      </div>
    );
  } else {
    const outputProps = {
      baseline,
      reform,
      simulations,
      policies: policyQuery.policies,
      // v3 households use national thresholds, so the footnote says nothing new.
      hideSpmFootnote: true,
      renderLoading: () => (
        <RunProgress
          title={
            view === 'earnings-variation'
              ? 'Calculating the household across earnings'
              : 'Calculating marginal tax rates across earnings'
          }
          expectedMs={VARIATION_EXPECTED_MS}
          startedAt={variationStartedAt}
          note="Both views use this one calculation, so the other opens at once."
        />
      ),
    };
    content =
      view === 'earnings-variation' ? (
        <EarningsVariationSubPage {...outputProps} tidyChart />
      ) : (
        <MarginalTaxRatesSubPage {...outputProps} currencyAwareText tidyChart />
      );
  }

  return <ReportYearProvider year={year}>{content}</ReportYearProvider>;
}
