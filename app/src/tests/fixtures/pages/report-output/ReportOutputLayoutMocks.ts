/**
 * Test fixtures for ReportOutputLayout component
 */

export const MOCK_REPORT_ID = 'test-report-123';
export const MOCK_REPORT_LABEL = 'Test Economic Impact Report';
export const MOCK_REPORT_YEAR = '2024';
export const MOCK_TIMESTAMP = 'Ran today at 05:23:41';

export const MOCK_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'comparative-analysis', label: 'Comparative analysis' },
  { value: 'policy', label: 'Policy' },
  { value: 'population', label: 'Population' },
  { value: 'dynamics', label: 'Dynamics' },
];

export const MOCK_TABS_WITH_CONSTITUENCY = [
  ...MOCK_TABS,
  { value: 'constituency', label: 'Constituencies' },
];
