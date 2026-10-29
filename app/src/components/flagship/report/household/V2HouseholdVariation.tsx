import { useMemo, type ReactNode } from 'react';
import { ErrorState } from '@/components/flagship/states';
import { useV2HouseholdVariation } from '@/hooks/useV2HouseholdVariation';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import MarginalTaxRatesSubPage from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Simulation } from '@/types/ingredients/Simulation';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';
import type { HouseholdBreakdownSource } from './HouseholdBreakdowns';

/**
 * The earnings variation or the marginal tax rates of a v3 household on the
 * Public API's v2 routes. The household the run stored is calculated
 * across its head's earnings under each policy, through
 * `/v2/household-calculations`, and the v2 page is given those
 * calculations, so it sends nothing itself and needs no policy's
 * parameters. Both pages read the same two calculations.
 */
export default function V2HouseholdVariation({
  view,
  source,
  baseline,
  reform,
  simulations,
  renderLoading,
}: {
  view: 'earnings-variation' | 'marginal-tax-rates';
  source: HouseholdBreakdownSource;
  baseline: HouseholdCalculationOutput;
  reform: HouseholdCalculationOutput | null;
  simulations: Simulation[];
  renderLoading: () => ReactNode;
}) {
  const { countryId, year, householdId } = source;
  // The person the v2 pages focus on, as they find them.
  const personName = useMemo(() => getHeadOfHouseholdPersonName(baseline, year), [baseline, year]);
  const baselineVariation = useV2HouseholdVariation({
    countryId,
    year,
    householdId,
    policyId: source.baselinePolicyId,
    personName,
    enabled: true,
  });
  const reformVariation = useV2HouseholdVariation({
    countryId,
    year,
    householdId,
    policyId: source.reformPolicyId,
    personName,
    enabled: !!reform,
  });

  const failedRole = baselineVariation.error
    ? 'baseline'
    : reform && reformVariation.error
      ? 'reform'
      : null;
  if (failedRole) {
    const failedQuery = failedRole === 'baseline' ? baselineVariation : reformVariation;
    return (
      <ErrorState
        compact
        title={`Could not calculate the ${failedRole} across earnings`}
        description={failedQuery.error?.message}
        onRetry={() => failedQuery.refetch()}
      />
    );
  }
  if (!baselineVariation.data || (reform && !reformVariation.data)) {
    return <>{renderLoading()}</>;
  }

  const outputProps = {
    baseline,
    reform,
    simulations,
    baselineVariation: baselineVariation.data,
    reformVariation: reform ? (reformVariation.data ?? null) : null,
  };
  return view === 'earnings-variation' ? (
    <EarningsVariationSubPage {...outputProps} alsoOfferInputs={source.householdInputs} />
  ) : (
    <MarginalTaxRatesSubPage {...outputProps} currencyAwareText />
  );
}
