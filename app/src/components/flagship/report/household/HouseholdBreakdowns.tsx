import { useMemo, type ReactNode } from 'react';
import { ErrorState } from '@/components/flagship/states';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import { Spinner, Stack, Text } from '@/components/ui';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHouseholdPolicies } from '@/hooks/useFlagshipHousehold';
import { normalizeHouseholdGroupAppKey } from '@/models/household/schema';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import MarginalTaxRatesSubPage from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';
import type {
  HouseholdCalculationData,
  HouseholdCalculationOutput,
} from '@/types/calculation/household';
import type { Simulation } from '@/types/ingredients/Simulation';

/** The v2 household outputs a v3 household result offers, after its own summary. */
export const HOUSEHOLD_BREAKDOWN_VIEWS = [
  { value: 'net-income', label: 'Net income' },
  { value: 'earnings-variation', label: 'Varying earnings' },
  { value: 'marginal-tax-rates', label: 'Marginal tax rates' },
] as const;

export type HouseholdBreakdownView = (typeof HOUSEHOLD_BREAKDOWN_VIEWS)[number]['value'];

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

/**
 * One v2 household output for a v3 household, with the v2 component
 * itself. The v2 components read the report's year from context and the
 * household and policies as a v2 report holds them (calculation outputs,
 * simulations, policies), so this gives them both.
 */
export default function HouseholdBreakdowns({
  view,
  source,
}: {
  view: HouseholdBreakdownView;
  source: HouseholdBreakdownSource;
}) {
  const { countryId, year, householdId, baselinePolicyId, reformPolicyId } = source;
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
  // Only the variation outputs send the policies; fetched when one opens.
  const needsPolicies = view === 'earnings-variation' || view === 'marginal-tax-rates';
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
    const Output =
      view === 'earnings-variation' ? EarningsVariationSubPage : MarginalTaxRatesSubPage;
    content = (
      <Output
        baseline={baseline}
        reform={reform}
        simulations={simulations}
        policies={policyQuery.policies}
      />
    );
  }

  return <ReportYearProvider year={year}>{content}</ReportYearProvider>;
}
