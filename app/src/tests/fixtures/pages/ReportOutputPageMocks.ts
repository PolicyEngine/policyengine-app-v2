/**
 * Test fixtures for ReportOutput.page.tsx
 */

import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';

export const MOCK_USER_REPORT_ID = 'test-user-report-123';
export const MOCK_REPORT_ID = 'test-report-123';

export const MOCK_USER_REPORT = {
  id: MOCK_USER_REPORT_ID,
  userId: 'test-user-1',
  label: 'Test Report',
  reportId: MOCK_REPORT_ID,
  countryId: 'us' as const,
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_USER_REPORT_UK = {
  id: MOCK_USER_REPORT_ID,
  userId: 'test-user-1',
  label: 'Test UK Report',
  reportId: MOCK_REPORT_ID,
  countryId: 'uk' as const,
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_REPORT_WITH_YEAR: Report = {
  id: MOCK_REPORT_ID,
  countryId: 'us',
  year: '2024',
  label: 'Test Society-Wide Report',
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: '1.0.0',
  status: 'complete',
  output: null,
};

export const MOCK_REPORT_UK_NATIONAL: Report = {
  id: MOCK_REPORT_ID,
  countryId: 'uk',
  year: '2024',
  label: 'Test UK National Report',
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: '1.0.0',
  status: 'complete',
  output: null,
};

export const MOCK_REPORT_UK_SUBNATIONAL: Report = {
  id: MOCK_REPORT_ID,
  countryId: 'uk',
  year: '2024',
  label: 'Test UK Subnational Report',
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: '1.0.0',
  status: 'complete',
  output: null,
};

export const MOCK_SIMULATION_GEOGRAPHY = {
  id: 'sim-1',
  countryId: 'us' as const,
  populationType: 'geography' as const,
  populationId: 'us',
  policyId: 'policy-1',
  status: 'complete' as const,
  output: null,
  label: null,
  isCreated: true,
};

export const MOCK_SIMULATION_GEOGRAPHY_UK = {
  id: 'sim-1',
  countryId: 'uk' as const,
  populationType: 'geography' as const,
  populationId: 'uk',
  policyId: 'policy-1',
  status: 'complete' as const,
  output: null,
  label: null,
  isCreated: true,
};

export const MOCK_GEOGRAPHY_UK_NATIONAL: Geography = {
  countryId: 'uk',
  regionCode: 'uk',
};

export const MOCK_GEOGRAPHY_UK_COUNTRY: Geography = {
  countryId: 'uk',
  regionCode: 'country/england',
};

export const MOCK_GEOGRAPHY_UK_CONSTITUENCY: Geography = {
  countryId: 'uk',
  regionCode: 'constituency/Sheffield Central',
};

export const MOCK_GEOGRAPHY_UK_LOCAL_AUTHORITY: Geography = {
  countryId: 'uk',
  regionCode: 'local_authority/Manchester',
};

export const MOCK_SOCIETY_WIDE_OUTPUT = {
  budget: { budgetary_impact: 1000000 },
  poverty: { poverty: { all: { baseline: 0.1, reform: 0.09 } } },
  intra_decile: { all: { 'Gain more than 5%': 0.2, 'No change': 0.8 } },
};

export const MOCK_SOCIETY_WIDE_OUTPUT_UK = {
  budget: { budgetary_impact: 1000000 },
  poverty: { poverty: { all: { baseline: 0.1, reform: 0.09 } } },
  intra_decile: { all: { 'Gain more than 5%': 0.2, 'No change': 0.8 } },
  constituency_impact: {
    by_constituency: {},
    outcomes_by_region: {},
  },
  local_authority_impact: {
    by_local_authority: {},
  },
};
