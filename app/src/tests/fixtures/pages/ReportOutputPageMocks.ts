/**
 * Test fixtures for ReportOutput.page.tsx
 */

import type { Report } from '@/types/ingredients/Report';

export const MOCK_USER_REPORT_ID = 'test-user-report-123';
export const MOCK_REPORT_ID = 'test-report-123';

export const MOCK_USER_REPORT = {
  id: MOCK_USER_REPORT_ID,
  label: 'Test Report',
  reportId: MOCK_REPORT_ID,
  countryId: 'us',
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

export const MOCK_SIMULATION_GEOGRAPHY = {
  id: 'sim-1',
  countryId: 'us',
  populationType: 'geography' as const,
  populationId: 'us',
  policyId: 'policy-1',
  status: 'complete' as const,
  output: null,
  isCreated: true,
};

export const MOCK_SOCIETY_WIDE_OUTPUT = {
  budget: { budgetary_impact: 1000000 },
  poverty: { poverty: { all: { baseline: 0.1, reform: 0.09 } } },
  intra_decile: { all: { 'Gain more than 5%': 0.2, 'No change': 0.8 } },
};
