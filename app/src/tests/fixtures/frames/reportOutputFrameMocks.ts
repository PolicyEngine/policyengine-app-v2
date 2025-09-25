import { vi } from 'vitest';
import type { UseReportOutputResult } from '@/hooks/useReportOutput';

// Mock report IDs
export const MOCK_REPORT_ID = '123';

// Mock report data
export const mockEconomyReportData = {
  budget: {
    budgetary_impact: -1000000000,
  },
  poverty: {
    poverty_rate_change: -0.05,
  },
};

export const mockHouseholdReportData = {
  household_id: 'household-123',
  baseline_net_income: 50000,
  reform_net_income: 52000,
};


// Mock useReportOutput return values
export const mockPendingReportOutput: UseReportOutputResult = {
  status: 'pending',
  data: null,
  isPending: true,
  error: null,
};

export const mockCompleteEconomyReportOutput: UseReportOutputResult = {
  status: 'complete',
  data: mockEconomyReportData,
  isPending: false,
  error: null,
};

export const mockCompleteHouseholdReportOutput: UseReportOutputResult = {
  status: 'complete',
  data: mockHouseholdReportData,
  isPending: false,
  error: null,
};

// Helper functions for creating error mocks
export const mockErrorReportOutput = (errorMessage: string = 'Failed to fetch calculation'): UseReportOutputResult => ({
  status: 'error',
  data: null,
  isPending: false,
  error: errorMessage,
});

export const mockErrorObjectReportOutput = (error: { message: string } = { message: 'API Error' }): UseReportOutputResult => ({
  status: 'error',
  data: null,
  isPending: false,
  error,
});

// Helper to create default frame props
export const createDefaultFrameProps = (route?: any) => ({
  onNavigate: vi.fn(),
  onReturn: vi.fn(),
  flowConfig: {
    component: 'ReportOutputFrame',
    on: {},
  } as any,
  isInSubflow: false,
  flowDepth: 0,
  route,
});