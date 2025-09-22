import { vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { Household } from '@/types/ingredients/Household';
import { EconomyReportOutput } from '@/api/economy';
import { ComponentKey } from '@/flows/registry';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';

// Test IDs and constants
export const TEST_REPORT_IDS = {
  EXISTING: 'report-123',
  NEW: 'report-456',
} as const;

export const TEST_SIMULATION_IDS = {
  BASELINE: 'sim-baseline-001',
  REFORM: 'sim-reform-002',
  HOUSEHOLD: 'sim-household-003',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'policy-baseline-001',
  REFORM: 'policy-reform-002',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  EXISTING: 'household-12345',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Mock simulations
export const mockBaselineSimulation: Simulation = {
  id: TEST_SIMULATION_IDS.BASELINE,
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  policyId: TEST_POLICY_IDS.BASELINE,
  populationId: 'ca', // California region
  populationType: 'geography',
  label: 'Baseline Policy',
  isCreated: true,
};

export const mockReformSimulation: Simulation = {
  id: TEST_SIMULATION_IDS.REFORM,
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  policyId: TEST_POLICY_IDS.REFORM,
  populationId: 'ca',
  populationType: 'geography',
  label: 'Reform Policy',
  isCreated: true,
};

export const mockHouseholdSimulation: Simulation = {
  id: TEST_SIMULATION_IDS.HOUSEHOLD,
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  policyId: TEST_POLICY_IDS.BASELINE,
  populationId: TEST_HOUSEHOLD_IDS.EXISTING,
  populationType: 'household',
  label: 'Household Baseline',
  isCreated: true,
};

export const mockHouseholdReformSimulation: Simulation = {
  ...mockHouseholdSimulation,
  id: 'sim-household-reform',
  policyId: TEST_POLICY_IDS.REFORM,
  label: 'Household Reform',
};

// Mock report state
export const mockReportState: Report = {
  reportId: TEST_REPORT_IDS.EXISTING,
  label: 'Test Report',
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_IDS.BASELINE, TEST_SIMULATION_IDS.REFORM],
  status: 'pending',
  output: null,
};

// Mock economy calculation responses
export const mockEconomyPendingResponse = {
  status: 'pending' as const,
  queue_position: 3,
  average_time: 240, // 4 minutes
  result: null,
};

export const mockEconomyProcessingResponse = {
  status: 'pending' as const,
  queue_position: 0,
  average_time: 300, // 5 minutes
  result: null,
};

export const mockEconomyCompletedResponse = {
  status: 'completed' as const,
  result: {
    budget: {
      budgetary_impact: -5000000000,
      benefit_spending_impact: 2000000000,
      tax_revenue_impact: -7000000000,
    },
    distributional: {
      deciles: {
        income: [15000, 25000, 35000, 45000, 55000, 65000, 75000, 85000, 100000, 150000],
        relative_change: [0.05, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01, 0.005, 0.003, -0.001],
        absolute_change: [750, 1000, 1050, 900, 1100, 650, 750, 425, 300, -150],
      }
    },
    poverty: {
      poverty_rate_change: -0.02,
      deep_poverty_rate_change: -0.01,
      child_poverty_rate_change: -0.025,
    },
    inequality: {
      gini_index_change: -0.015,
      top_1_percent_share_change: -0.005,
      top_10_percent_share_change: -0.008,
    }
  } as unknown as EconomyReportOutput,
};

export const mockEconomyErrorResponse = {
  status: 'error' as const,
  result: null,
  error: 'Calculation failed due to invalid parameters',
};

// Mock household calculation responses
export const mockHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  countryId: TEST_COUNTRIES.US,
  householdData: {
    people: {
      person1: {
        age: { 2024: 30 },
        employment_income: { 2024: 50000 },
      },
      person2: {
        age: { 2024: 28 },
        employment_income: { 2024: 45000 },
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
        family_size: { 2024: 2 },
      },
    },
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2'],
        adjusted_gross_income: { 2024: 95000 },
      },
    },
    households: {
      household1: {
        members: ['person1', 'person2'],
        household_size: { 2024: 2 },
      },
    },
  },
};

export const mockReformHouseholdResult: Household = {
  ...mockHouseholdResult,
  householdData: {
    ...mockHouseholdResult.householdData,
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2'],
        adjusted_gross_income: { 2024: 93000 }, // Lower due to reform
      },
    },
  },
};

// Helper functions for mocking hooks
export const mockUseEconomyCalculation = (overrides?: Partial<any>) => ({
  data: null,
  isLoading: false,
  isPending: false,
  isCompleted: false,
  isErrored: false,
  result: null,
  queuePosition: undefined,
  calculationError: undefined,
  retry: vi.fn(),
  ...overrides,
});

export const mockUseHouseholdCalculation = (overrides?: Partial<any>) => ({
  data: null,
  isLoading: false,
  household: null,
  retry: vi.fn(),
  ...overrides,
});

// Mock navigation function
export const createMockNavigate = () => vi.fn();

// Mock flow component props
export const createMockFlowProps = (overrides?: Partial<any>) => ({
  onNavigate: createMockNavigate(),
  onReturn: vi.fn(),
  flowConfig: {
    component: 'ReportCalculationFrame' as ComponentKey,
    on: {
      complete: '__return__',
      cancel: 'ReportSetupFrame',
      error: 'ReportSetupFrame',
    },
  },
  isInSubflow: false,
  flowDepth: 0,
  ...overrides,
});

// Error messages that match the implementation
export const ERROR_MESSAGES = {
  ECONOMY_TIMEOUT: 'Economy calculation timed out after 25 minutes, the max length for a Google Cloud economy-wide simulation Workflow',
  ECONOMY_FAILED: 'Calculation failed due to invalid parameters',
  HOUSEHOLD_TIMEOUT: 'Household calculation timed out after 50 seconds (client-side timeout)',
  HOUSEHOLD_FAILED: 'Household calculation failed',
  UPDATE_REPORT_FAILED: 'Failed to update report status',
  UPDATE_REPORT_ERROR_FAILED: 'Failed to update report error status',
} as const;

// Create a helper to create store with initial state
export const createMockStore = (
  reportState: Report = mockReportState,
  simulations: (Simulation | null)[] = [mockBaselineSimulation, mockReformSimulation]
) => {
  // Create full report state with required fields
  const fullReportState = {
    ...reportState,
    activeSimulationPosition: 0 as const,
    mode: 'report' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Ensure simulations array is exactly 2 elements
  const simulationsArray: [Simulation | null, Simulation | null] = [
    simulations[0] || null,
    simulations[1] || null,
  ];

  return configureStore({
    reducer: {
      report: reportReducer,
      simulations: simulationsReducer,
    },
    preloadedState: {
      report: fullReportState,
      simulations: {
        simulations: simulationsArray,
      },
    },
  });
};