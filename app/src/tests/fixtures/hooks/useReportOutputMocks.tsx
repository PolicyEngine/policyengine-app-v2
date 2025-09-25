import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import metadataReducer from '@/reducers/metadataReducer';
import type { Report } from '@/types/ingredients/Report';

// Mock report ID
export const MOCK_REPORT_ID = '123';

// Mock economy calculation data
export const mockEconomyCalculationComplete = {
  status: 'ok',
  result: { budget: { budgetary_impact: 1000 } },
};

export const mockEconomyCalculationPending = {
  status: 'computing',
  result: null,
};

export const mockEconomyCalculationError = {
  status: 'error',
  error: 'Calculation timed out',
};

// Mock household calculation data
export const mockHouseholdCalculationData = {
  household_id: 'household-456',
  baseline_net_income: 50000,
  reform_net_income: 52000,
};

export const mockHouseholdCalculationError = {
  error: 'Household calculation failed',
};

// Mock report outputs
export const mockReportOutput = { budget: { budgetary_impact: 2000 } } as any;
export const mockReportOutputLarge = { budget: { budgetary_impact: 3000 } } as any;

// Mock reports
export const createMockReport = (overrides?: Partial<Report>): Report => ({
  reportId: MOCK_REPORT_ID,
  label: 'Test Report',
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: ['sim-1'],
  status: 'complete',
  output: null,
  ...overrides,
});

// Mock useUserReportById return value
export const createMockUserReportByIdReturn = (report?: Report, error?: Error | null) => ({
  report,
  simulations: [],
  policies: [],
  households: [],
  userSimulations: undefined,
  userPolicies: undefined,
  userHouseholds: undefined,
  isLoading: false,
  error: error || null,
});

// Helper to create QueryClient wrapper with Redux for tests
export const createQueryClientWrapper = (countryId: string = 'us') => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Create a test store with metadata reducer
    const store = configureStore({
      reducer: {
        metadata: metadataReducer,
      },
      preloadedState: {
        metadata: {
          loading: false,
          error: null,
          currentCountry: countryId,
          variables: {},
          parameters: {},
          entities: {},
          variableModules: {},
          economyOptions: { region: [], time_period: [], datasets: [] },
          currentLawId: 0,
          basicInputs: [],
          modelledPolicies: { core: {}, filtered: {} },
          version: null,
          parameterTree: null,
        } as any,
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  };

  return { createWrapper, getQueryClient: () => queryClient };
};

// Mock useQuery return values
export const mockUseQueryReturn = {
  loading: {
    data: null,
    error: null,
    isLoading: true,
  },
  error: (error: any) => ({
    data: null,
    error,
    isLoading: false,
  }),
  success: (data: any) => ({
    data,
    error: null,
    isLoading: false,
  }),
};
