import { Household } from '@/models/Household';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import type { Report } from '@/types/ingredients/Report';
import { COUNTY_SPM, NATIONAL_SPM, SPM_TEST_YEAR, stateOnlyHousehold } from './spmMocks';

export function ownershipReportState(): ReportBuilderState {
  const baseline = stateOnlyHousehold()
    .withId('ownership-baseline')
    .withLabel('National household')
    .withSPM(NATIONAL_SPM);
  const reform = stateOnlyHousehold()
    .withId('ownership-reform')
    .withLabel('County household')
    .withSPM(COUNTY_SPM)
    .setGroupVariableAtYear('households', 'your household', 'county_fips', SPM_TEST_YEAR, '06001');
  return {
    id: 'ownership-report',
    label: 'Independent households',
    year: SPM_TEST_YEAR,
    simulations: [baseline, reform].map((household, index) => ({
      id: `ownership-simulation-${index}`,
      countryId: 'us',
      label: index === 0 ? 'Baseline' : 'Reform',
      policy: {
        id: `ownership-policy-${index}`,
        label: index === 0 ? 'Custom baseline' : 'Custom reform',
        parameters: [
          {
            name: 'gov.test.parameter',
            values: [{ startDate: '2024-01-01', endDate: '2027-12-31', value: index + 1 }],
          },
        ],
      },
      population: { type: 'household', label: household.label, household, geography: null },
    })),
  };
}

export function ownershipHydrationData(source: string, countryId: 'us' | 'uk' = 'us') {
  const state = ownershipReportState();
  const households = state.simulations.map((simulation) =>
    Household.fromAppInput({
      ...simulation.population.household!.toJSON(),
      id: `${source}-${simulation.population.household!.id}`,
      countryId,
      spm: countryId === 'us' ? simulation.population.household!.spm : undefined,
    })
  );
  const simulations = state.simulations.map((simulation, index) => ({
    id: `${source}-${simulation.id}`,
    countryId,
    label: simulation.label,
    populationType: 'household' as const,
    populationId: households[index].id,
    policyId: simulation.policy.id!,
    isCreated: true,
  }));
  const report: Report = {
    id: source,
    countryId,
    year: state.year,
    apiVersion: null,
    simulationIds: simulations.map((simulation) => simulation.id),
    status: 'error',
    outputType: 'household',
  };
  return {
    userReport: { id: `${source}-association`, reportId: source, countryId, userId: 'test-user' },
    report,
    simulations,
    households,
    policies: state.simulations.map((simulation) => ({ ...simulation.policy, countryId })),
    geographies: [],
    userSimulations: [],
    userPolicies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  };
}
