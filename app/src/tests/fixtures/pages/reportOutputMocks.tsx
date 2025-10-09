import { vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';

/**
 * Mock data for ReportOutput page tests
 */

// Mock UserReport
export const mockUserReport = {
  id: 'sur-test123',
  userId: MOCK_USER_ID.toString(),
  reportId: 'base-report-456',
  label: 'Test Report',
  createdAt: '2025-01-15T10:00:00Z',
  isCreated: true,
};

// Mock report data (normalized)
export const mockReportData = {
  id: 'base-report-456',
  label: 'Test Report',
  countryId: 'us',
  status: 'complete' as const,
};

// Mock economy output
export const mockEconomyOutput = {
  budget: {
    baseline_net_income: 5000000000000,
    benefit_spending_impact: 15000000000,
    budgetary_impact: -20200000000,
    households: 130000000,
    state_tax_revenue_impact: -5000000000,
    tax_revenue_impact: -15000000000,
  },
  poverty: {
    poverty: {
      all: {
        baseline: 0.124,
        reform: 0.118,
      },
    },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.08,
      'Gain less than 5%': 0.03,
      'Lose more than 5%': 0.02,
      'Lose less than 5%': 0.035,
      'No change': 0.835,
    },
  },
  poverty_by_age_group: {},
  poverty_by_gender: {},
};

// Mock household data
export const mockHouseholdData = {
  earnings: { 2025: 50000 },
};

/**
 * Mock subpage components
 */
export const createMockOverviewSubPage = () =>
  vi.fn(() => <div data-testid="overview-subpage">Overview</div>);

export const createMockLoadingPage = () =>
  vi.fn(({ message }: { message?: string }) => (
    <div data-testid="loading-subpage">{message || 'Loading...'}</div>
  ));

export const createMockErrorPage = () =>
  vi.fn(({ error }: { error?: Error }) => (
    <div data-testid="error-subpage">Error: {error?.message || 'Unknown error'}</div>
  ));

export const createMockNotFoundSubPage = () =>
  vi.fn(() => <div data-testid="not-found-subpage">Not Found</div>);

/**
 * Setup function for all mocks
 */
export function setupReportOutputMocks(vi: any) {
  // Mock Plotly
  vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

  // Mock subpage components
  vi.mock('@/pages/report-output/OverviewSubPage', () => ({
    default: createMockOverviewSubPage(),
  }));

  vi.mock('@/pages/report-output/LoadingPage', () => ({
    default: createMockLoadingPage(),
  }));

  vi.mock('@/pages/report-output/ErrorPage', () => ({
    default: createMockErrorPage(),
  }));

  vi.mock('@/pages/report-output/NotFoundSubPage', () => ({
    default: createMockNotFoundSubPage(),
  }));
}
