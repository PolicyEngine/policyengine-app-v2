/**
 * Test fixtures for shareUtils tests
 */

import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

// ============================================================================
// Constants
// ============================================================================

export const TEST_USER_REPORT_IDS = {
  SOCIETY_WIDE: 'sur-abc123',
  HOUSEHOLD: 'sur-def456',
  TEST: 'sur-test1',
} as const;

export const TEST_BASE_REPORT_IDS = {
  SOCIETY_WIDE: '308',
  HOUSEHOLD: '309',
  TEST: '100',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// ============================================================================
// ReportIngredientsInput Fixtures - Society-wide report (geographies, no households)
// ============================================================================

export const VALID_SHARE_DATA: ReportIngredientsInput = {
  userReport: {
    id: TEST_USER_REPORT_IDS.SOCIETY_WIDE,
    reportId: TEST_BASE_REPORT_IDS.SOCIETY_WIDE,
    countryId: TEST_COUNTRIES.US,
    label: 'My Report',
  },
  userSimulations: [
    { simulationId: 'sim-1', countryId: TEST_COUNTRIES.US, label: 'Baseline' },
    { simulationId: 'sim-2', countryId: TEST_COUNTRIES.US, label: 'Reform' },
  ],
  userPolicies: [
    { policyId: 'policy-1', countryId: TEST_COUNTRIES.US, label: 'Current Law' },
    { policyId: 'policy-2', countryId: TEST_COUNTRIES.US, label: 'My Policy' },
  ],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: TEST_COUNTRIES.US,
      countryId: TEST_COUNTRIES.US,
      scope: 'national',
      label: 'United States',
    },
  ],
};

// ============================================================================
// ReportIngredientsInput Fixtures - Household report (households, no geographies)
// ============================================================================

export const VALID_HOUSEHOLD_SHARE_DATA: ReportIngredientsInput = {
  userReport: {
    id: TEST_USER_REPORT_IDS.HOUSEHOLD,
    reportId: TEST_BASE_REPORT_IDS.HOUSEHOLD,
    countryId: TEST_COUNTRIES.UK,
    label: 'Household Report',
  },
  userSimulations: [
    { simulationId: 'sim-3', countryId: TEST_COUNTRIES.UK, label: 'My Simulation' },
  ],
  userPolicies: [{ policyId: 'policy-3', countryId: TEST_COUNTRIES.UK, label: 'My Policy' }],
  userHouseholds: [
    {
      type: 'household',
      householdId: 'household-123',
      countryId: TEST_COUNTRIES.UK,
      label: 'My Household',
    },
  ],
  userGeographies: [],
};

// ============================================================================
// Full UserReport/UserSimulation/etc. fixtures (with userId for createShareData tests)
// ============================================================================

export const MOCK_USER_REPORT: UserReport = {
  id: TEST_USER_REPORT_IDS.TEST,
  userId: 'anonymous',
  reportId: TEST_BASE_REPORT_IDS.TEST,
  countryId: TEST_COUNTRIES.US,
  label: 'My Report',
};

export const MOCK_USER_SIMULATIONS: UserSimulation[] = [
  {
    userId: 'anonymous',
    simulationId: 'sim-1',
    countryId: TEST_COUNTRIES.US,
    label: 'Sim Label',
  },
];

export const MOCK_USER_POLICIES: UserPolicy[] = [
  {
    userId: 'anonymous',
    policyId: 'policy-1',
    countryId: TEST_COUNTRIES.US,
    label: 'Policy Label',
  },
];

export const MOCK_USER_GEOGRAPHIES: UserGeographyPopulation[] = [
  {
    type: 'geography',
    userId: 'anonymous',
    geographyId: 'geo-1',
    countryId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'Geography Label',
  },
];

export const MOCK_USER_HOUSEHOLDS: UserHouseholdPopulation[] = [];

// ============================================================================
// Invalid data fixtures for validation tests
// ============================================================================

export const createInvalidShareDataMissingUserReport = () => ({
  ...VALID_SHARE_DATA,
  userReport: undefined,
});

export const createInvalidShareDataNonArraySimulations = () => ({
  ...VALID_SHARE_DATA,
  userSimulations: 'not-an-array',
});

export const createInvalidShareDataNullSimulationId = () => ({
  ...VALID_SHARE_DATA,
  userSimulations: [{ simulationId: null, countryId: TEST_COUNTRIES.US }],
});

export const createInvalidShareDataBadCountryId = () => ({
  ...VALID_SHARE_DATA,
  userReport: { ...VALID_SHARE_DATA.userReport, countryId: 'invalid' },
});

export const createInvalidShareDataBadGeographyScope = () => ({
  ...VALID_SHARE_DATA,
  userGeographies: [
    { geographyId: TEST_COUNTRIES.US, countryId: TEST_COUNTRIES.US, scope: 'invalid' },
  ],
});

export const createShareDataWithoutId = () =>
  ({
    ...VALID_SHARE_DATA,
    userReport: {
      ...VALID_SHARE_DATA.userReport,
      id: undefined,
    },
  }) as unknown as ReportIngredientsInput;

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Create a UserReport without id field for testing null returns
 */
export const createUserReportWithoutId = (): UserReport =>
  ({
    id: undefined as unknown as string,
    userId: 'anonymous',
    reportId: TEST_BASE_REPORT_IDS.TEST,
    countryId: TEST_COUNTRIES.US,
  }) as UserReport;

/**
 * Create a UserReport without reportId field for testing null returns
 */
export const createUserReportWithoutReportId = (): UserReport =>
  ({
    id: TEST_USER_REPORT_IDS.TEST,
    userId: 'anonymous',
    reportId: undefined as unknown as string,
    countryId: TEST_COUNTRIES.US,
  }) as UserReport;
