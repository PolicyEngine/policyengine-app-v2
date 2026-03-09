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

// Mock society-wide output (base data)
export const mockSocietyWideOutput = {
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
 * Factory function for creating mock SocietyWideReportOutput with overrides.
 * Deep-merges poverty and poverty.poverty so tests can override just `all`
 * without losing `child`, `adult`, `senior` data.
 */
export const createMockSocietyWideOutput = (overrides?: any) => {
  const defaults = {
    budget: {
      budgetary_impact: 1_000_000,
      baseline_net_income: 5_000_000_000,
      benefit_spending_impact: 500_000,
      households: 10000,
      state_tax_revenue_impact: 200_000,
      tax_revenue_impact: 300_000,
    },
    poverty: {
      baseline: {},
      reform: {},
      poverty: {
        all: { baseline: 0.1, reform: 0.09 },
        child: { baseline: 0.15, reform: 0.13 },
        adult: { baseline: 0.08, reform: 0.07 },
        senior: { baseline: 0.09, reform: 0.085 },
      },
      deep_poverty: {
        all: { baseline: 0.05, reform: 0.045 },
        child: { baseline: 0.07, reform: 0.06 },
        adult: { baseline: 0.04, reform: 0.035 },
        senior: { baseline: 0.03, reform: 0.028 },
      },
    },
    inequality: {
      gini: { baseline: 0.45, reform: 0.44 },
      top_10_pct_share: { baseline: 0.35, reform: 0.34 },
      top_1_pct_share: { baseline: 0.15, reform: 0.14 },
    },
    intra_decile: {
      all: {
        'Gain more than 5%': 0.2,
        'Gain less than 5%': 0.1,
        'Lose more than 5%': 0.05,
        'Lose less than 5%': 0.05,
        'No change': 0.6,
      },
    },
    decile: {
      average: {
        '1': -50,
        '2': -30,
        '3': -10,
        '4': 5,
        '5': 20,
        '6': 35,
        '7': 50,
        '8': 70,
        '9': 100,
        '10': 150,
      },
      relative: {
        '1': -0.02,
        '2': -0.01,
        '3': -0.005,
        '4': 0.002,
        '5': 0.005,
        '6': 0.008,
        '7': 0.01,
        '8': 0.012,
        '9': 0.015,
        '10': 0.02,
      },
    },
    poverty_by_race: null,
    data_version: '2024.1.0',
  };

  if (!overrides) {
    return defaults;
  }

  // Deep merge poverty to preserve child/adult/senior when only all is overridden
  const mergedPoverty = overrides.poverty
    ? {
        ...defaults.poverty,
        ...overrides.poverty,
        poverty: {
          ...defaults.poverty.poverty,
          ...(overrides.poverty.poverty || {}),
        },
        deep_poverty: {
          ...defaults.poverty.deep_poverty,
          ...(overrides.poverty.deep_poverty || {}),
        },
      }
    : defaults.poverty;

  const { poverty: _poverty, ...restOverrides } = overrides;

  return {
    ...defaults,
    ...restOverrides,
    poverty: mergedPoverty,
  };
};

/**
 * Mock Report for SocietyWideReportOutput tests
 */
export const mockSocietyWideReport = {
  id: 'test-report-123',
  countryId: 'us',
  label: 'Test Society-Wide Report',
  simulationIds: ['sim-1'],
  apiVersion: '1.0.0',
  status: 'complete' as const,
  output: null,
};

/**
 * Mock Simulation for SocietyWideReportOutput tests
 */
export const mockSocietyWideSimulation = {
  id: 'sim-1',
  label: 'Test Simulation',
  countryId: 'us',
  populationType: 'geography' as const,
  populationId: 'us',
  policyId: 'policy-1',
  status: 'complete' as const,
  output: null,
  isCreated: true,
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
