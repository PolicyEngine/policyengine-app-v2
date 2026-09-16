import metadataReducer from '@/reducers/metadataReducer';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { NATIONAL_SPM, SPM_RECEIPT, SPM_TEST_YEAR, stateOnlyHousehold } from './spmMocks';

// Synthetic inputs/receipts for UI integration tests; never published artifacts or results.
export const reviewMetadata = {
  ...metadataReducer(undefined, { type: 'test/init' }),
  currentCountry: 'us',
  version: 'test-model',
  spm: { available: true },
  variables: {
    employment_income: { entity: 'person', label: 'Employment income', isInputVariable: true },
    marginal_tax_rate: { entity: 'person', label: 'Marginal tax rate' },
    household_net_income: { entity: 'household', label: 'Net income' },
  },
  entities: { person: { plural: 'people' }, household: { plural: 'households' } },
};

export const reviewHousehold = stateOnlyHousehold()
  .withId('review-household')
  .withLabel('Review household')
  .withSPM({ ...NATIONAL_SPM, forecast_content_sha256: 'b'.repeat(64) });

export const reviewAssociation: UserHouseholdPopulation = {
  id: 'review-association',
  countryId: 'us',
  userId: 'test-user',
  householdId: reviewHousehold.id!,
  type: 'household',
  label: reviewHousehold.label!,
};

export const spmSaveErrors = [
  { code: 'SPM_SETTINGS_INVALID', message: 'The selected forecast artifact is unavailable.' },
  { code: 'SPM_GEOGRAPHY_UNAVAILABLE', message: 'County 06001 is unavailable in this artifact.' },
  { code: 'SPM_COMPOSITION_REQUIRED', message: 'Adult composition is missing for this household.' },
  { code: 'SPM_GEOGRAPHY_REQUIRED', message: 'An explicit county FIPS code is required.' },
];

export function reviewOutput(
  role: 'baseline' | 'reform',
  variation = false
): HouseholdCalculationOutput {
  const value = (point: number) => ({
    [SPM_TEST_YEAR]: variation ? Array(401).fill(point) : point,
  });
  return {
    id: `review-${role}`,
    countryId: 'us',
    spmConfig: NATIONAL_SPM,
    spmProvenance: { ...SPM_RECEIPT, forecast_id: `test-${role}-${variation ? 'axes' : 'point'}` },
    householdData: {
      people: { you: { employment_income: value(30000), marginal_tax_rate: value(0.2) } },
      households: { household: { members: ['you'], household_net_income: value(25000) } },
    },
  };
}

export const reviewSimulations: Simulation[] = ['baseline', 'reform'].map((role) => ({
  id: `simulation-${role}`,
  label: role,
  countryId: 'us',
  policyId: `policy-${role}`,
  populationId: `review-${role}`,
  populationType: 'household',
  isCreated: true,
  status: 'complete',
  output: null,
}));
