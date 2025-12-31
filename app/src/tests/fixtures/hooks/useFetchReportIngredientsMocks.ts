/**
 * Test fixtures for useFetchReportIngredients tests
 */

import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';

// ============================================================================
// Constants
// ============================================================================

export const TEST_IDS = {
  REPORT: {
    ID: 'sur-ingredients-123',
    BASE_ID: '308',
  },
  SIMULATIONS: {
    BASELINE: 'sim-baseline-1',
    REFORM: 'sim-reform-2',
  },
  POLICIES: {
    CURRENT_LAW: 'policy-1',
    REFORM: 'policy-2',
  },
  HOUSEHOLDS: {
    SINGLE: 'hh-single-1',
  },
  GEOGRAPHIES: {
    NATIONAL: 'us',
    SUBNATIONAL: 'enhanced_us-ca',
  },
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_USER_IDS = {
  ANONYMOUS: 'anonymous',
  SHARED: 'shared',
  CUSTOM: 'custom-user-id',
} as const;

// ============================================================================
// ReportIngredientsInput Fixtures
// ============================================================================

/**
 * Basic society-wide report input (geography-based, no households)
 */
export const SOCIETY_WIDE_INPUT: ReportIngredientsInput = {
  userReport: {
    id: TEST_IDS.REPORT.ID,
    reportId: TEST_IDS.REPORT.BASE_ID,
    countryId: TEST_COUNTRIES.US,
    label: 'Society-Wide Report',
  },
  userSimulations: [
    {
      simulationId: TEST_IDS.SIMULATIONS.BASELINE,
      countryId: TEST_COUNTRIES.US,
      label: 'Baseline',
    },
    { simulationId: TEST_IDS.SIMULATIONS.REFORM, countryId: TEST_COUNTRIES.US, label: 'Reform' },
  ],
  userPolicies: [
    { policyId: TEST_IDS.POLICIES.CURRENT_LAW, countryId: TEST_COUNTRIES.US, label: 'Current Law' },
    { policyId: TEST_IDS.POLICIES.REFORM, countryId: TEST_COUNTRIES.US, label: 'My Reform' },
  ],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: TEST_IDS.GEOGRAPHIES.NATIONAL,
      countryId: TEST_COUNTRIES.US,
      scope: 'national',
      label: 'United States',
    },
  ],
};

/**
 * Household report input (household-based, no geographies)
 */
export const HOUSEHOLD_INPUT: ReportIngredientsInput = {
  userReport: {
    id: 'sur-hh-456',
    reportId: '309',
    countryId: TEST_COUNTRIES.UK,
    label: 'Household Report',
  },
  userSimulations: [
    { simulationId: 'sim-hh-1', countryId: TEST_COUNTRIES.UK, label: 'Household Sim' },
  ],
  userPolicies: [{ policyId: 'policy-hh-1', countryId: TEST_COUNTRIES.UK, label: 'HH Policy' }],
  userHouseholds: [
    {
      type: 'household',
      householdId: TEST_IDS.HOUSEHOLDS.SINGLE,
      countryId: TEST_COUNTRIES.UK,
      label: 'My Household',
    },
  ],
  userGeographies: [],
};

/**
 * Input without userReport.id (tests fallback to reportId)
 */
export const INPUT_WITHOUT_ID: ReportIngredientsInput = {
  userReport: {
    reportId: TEST_IDS.REPORT.BASE_ID,
    countryId: TEST_COUNTRIES.US,
    label: 'Legacy Report',
  },
  userSimulations: [
    { simulationId: TEST_IDS.SIMULATIONS.BASELINE, countryId: TEST_COUNTRIES.US, label: 'Sim' },
  ],
  userPolicies: [],
  userHouseholds: [],
  userGeographies: [],
};

/**
 * Empty arrays input (minimal valid input)
 */
export const MINIMAL_INPUT: ReportIngredientsInput = {
  userReport: {
    id: 'sur-minimal',
    reportId: '100',
    countryId: TEST_COUNTRIES.US,
  },
  userSimulations: [],
  userPolicies: [],
  userHouseholds: [],
  userGeographies: [],
};

// ============================================================================
// Expected Results for expandUserAssociations
// ============================================================================

export const createExpectedExpandedSocietyWide = (userId: string = TEST_USER_IDS.SHARED) => ({
  userReport: {
    id: TEST_IDS.REPORT.ID,
    reportId: TEST_IDS.REPORT.BASE_ID,
    countryId: TEST_COUNTRIES.US,
    label: 'Society-Wide Report',
    userId,
  },
  userSimulations: [
    {
      simulationId: TEST_IDS.SIMULATIONS.BASELINE,
      countryId: TEST_COUNTRIES.US,
      label: 'Baseline',
      userId,
    },
    {
      simulationId: TEST_IDS.SIMULATIONS.REFORM,
      countryId: TEST_COUNTRIES.US,
      label: 'Reform',
      userId,
    },
  ],
  userPolicies: [
    {
      policyId: TEST_IDS.POLICIES.CURRENT_LAW,
      countryId: TEST_COUNTRIES.US,
      label: 'Current Law',
      userId,
    },
    {
      policyId: TEST_IDS.POLICIES.REFORM,
      countryId: TEST_COUNTRIES.US,
      label: 'My Reform',
      userId,
    },
  ],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: TEST_IDS.GEOGRAPHIES.NATIONAL,
      countryId: TEST_COUNTRIES.US,
      scope: 'national',
      label: 'United States',
      userId,
    },
  ],
});

export const createExpectedExpandedWithoutId = (userId: string = TEST_USER_IDS.SHARED) => ({
  userReport: {
    id: TEST_IDS.REPORT.BASE_ID, // Falls back to reportId
    reportId: TEST_IDS.REPORT.BASE_ID,
    countryId: TEST_COUNTRIES.US,
    label: 'Legacy Report',
    userId,
  },
  userSimulations: [
    {
      simulationId: TEST_IDS.SIMULATIONS.BASELINE,
      countryId: TEST_COUNTRIES.US,
      label: 'Sim',
      userId,
    },
  ],
  userPolicies: [],
  userHouseholds: [],
  userGeographies: [],
});

// ============================================================================
// API Response Fixtures
// ============================================================================

export const MOCK_REPORT_METADATA = {
  id: 308,
  country_id: TEST_COUNTRIES.US,
  year: '2024',
  simulation_1_id: '1',
  simulation_2_id: '2',
  status: 'complete',
  api_version: '1.0.0',
  output: null,
};

export const MOCK_SIMULATION_GEOGRAPHY_METADATA = {
  id: 1,
  country_id: TEST_COUNTRIES.US,
  year: '2024',
  population_type: 'geography',
  population_id: TEST_COUNTRIES.US,
  policy_id: 1,
  api_version: '1.0.0',
};

export const MOCK_SIMULATION_HOUSEHOLD_METADATA = {
  id: 2,
  country_id: TEST_COUNTRIES.UK,
  year: '2024',
  population_type: 'household',
  population_id: TEST_IDS.HOUSEHOLDS.SINGLE,
  policy_id: 2,
  api_version: '1.0.0',
};

export const MOCK_POLICY_METADATA = {
  id: '1',
  country_id: TEST_COUNTRIES.US,
  label: 'Current Law',
  policy_json: {},
  api_version: '1.0.0',
  policy_hash: 'hash123',
};

export const MOCK_HOUSEHOLD_METADATA = {
  id: TEST_IDS.HOUSEHOLDS.SINGLE,
  country_id: TEST_COUNTRIES.UK,
  label: 'Test Household',
  household_json: {},
  api_version: '1.0.0',
  household_hash: 'hhhash456',
};
