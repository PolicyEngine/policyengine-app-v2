import { Household } from '@/models/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

export const HOUSEHOLD_CALCULATION_CONFIG_IDS = {
  REPORT: 'report-household-1',
  BASELINE_SIMULATION: 'simulation-baseline',
  REFORM_SIMULATION: 'simulation-reform',
  HOUSEHOLD: 'household-1',
  BASELINE_POLICY: 'policy-baseline',
  REFORM_POLICY: 'policy-reform',
} as const;

export const HOUSEHOLD_CALCULATION_YEAR = '2026';

export const HOUSEHOLD_REPORT: Report = {
  id: HOUSEHOLD_CALCULATION_CONFIG_IDS.REPORT,
  countryId: 'us',
  year: HOUSEHOLD_CALCULATION_YEAR,
  apiVersion: null,
  simulationIds: [
    HOUSEHOLD_CALCULATION_CONFIG_IDS.BASELINE_SIMULATION,
    HOUSEHOLD_CALCULATION_CONFIG_IDS.REFORM_SIMULATION,
  ],
  status: 'pending',
};

export const HOUSEHOLD_SIMULATIONS: Simulation[] = [
  {
    id: HOUSEHOLD_CALCULATION_CONFIG_IDS.BASELINE_SIMULATION,
    countryId: 'us',
    policyId: HOUSEHOLD_CALCULATION_CONFIG_IDS.BASELINE_POLICY,
    populationId: HOUSEHOLD_CALCULATION_CONFIG_IDS.HOUSEHOLD,
    populationType: 'household',
    label: 'Current law',
    isCreated: true,
    status: 'pending',
  },
  {
    id: HOUSEHOLD_CALCULATION_CONFIG_IDS.REFORM_SIMULATION,
    countryId: 'us',
    policyId: HOUSEHOLD_CALCULATION_CONFIG_IDS.REFORM_POLICY,
    populationId: HOUSEHOLD_CALCULATION_CONFIG_IDS.HOUSEHOLD,
    populationType: 'household',
    label: 'Reform',
    isCreated: true,
    status: 'pending',
  },
];

export const HOUSEHOLD_POPULATION = Household.fromDraft({
  id: HOUSEHOLD_CALCULATION_CONFIG_IDS.HOUSEHOLD,
  countryId: 'us',
  year: Number(HOUSEHOLD_CALCULATION_YEAR),
  householdData: {
    people: {
      adult: {
        age: { [HOUSEHOLD_CALCULATION_YEAR]: 30 },
      },
    },
  },
});
