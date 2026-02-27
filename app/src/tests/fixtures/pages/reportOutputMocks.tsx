import { vi } from 'vitest';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { MOCK_USER_ID } from '@/constants';
import {
  createMockBudgetSummary,
  createMockEconomicImpactResponse,
  createMockIntraDecile,
  createMockPovertyPair,
} from '@/tests/fixtures/v2MockFactory';

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

// Mock household data
export const mockHouseholdData = {
  earnings: { 2025: 50000 },
};

/**
 * Factory function for creating mock EconomicImpactResponse for SocietyWideOverview tests.
 * Accepts simple numeric overrides and produces proper v2 data.
 */
export const createMockSocietyWideOutput = (opts?: {
  budgetaryImpact?: number;
  povertyBaseline?: number;
  povertyReform?: number;
  gainMore5?: number;
  gainLess5?: number;
  noChange?: number;
  loseLess5?: number;
  loseMore5?: number;
}): EconomicImpactResponse => {
  const budgetaryImpact = opts?.budgetaryImpact ?? 1_000_000;
  const povertyBaseline = opts?.povertyBaseline ?? 0.1;
  const povertyReform = opts?.povertyReform ?? 0.09;
  const gainMore5 = opts?.gainMore5 ?? 0.2;
  const gainLess5 = opts?.gainLess5 ?? 0.1;
  const noChange = opts?.noChange ?? 0.6;
  const loseLess5 = opts?.loseLess5 ?? 0.05;
  const loseMore5 = opts?.loseMore5 ?? 0.05;

  return createMockEconomicImpactResponse({
    budget_summary: createMockBudgetSummary({
      taxRevenue: budgetaryImpact,
      stateTaxRevenue: 0,
      benefitSpending: 0,
      countPeople: 130_000_000,
      netIncome: 5_000_000_000_000,
    }),
    poverty: [...createMockPovertyPair('spm', null, povertyBaseline, povertyReform)],
    intra_decile: createMockIntraDecile({
      gain5: gainMore5,
      gainLess5,
      noChange,
      loseLess5,
      lose5: loseMore5,
    }),
  });
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
