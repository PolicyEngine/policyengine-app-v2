import { vi } from 'vitest';
import type { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';

export const TEST_REPORT_ID = 'report-123';
export const TEST_SIMULATION_IDS = ['sim-1', 'sim-2'];

export const mockCalcConfig = {
  reportId: TEST_REPORT_ID,
  simulationIds: TEST_SIMULATION_IDS,
  metadata: { country: 'us' },
};

export const mockOrchestrator = {
  startReport: vi.fn(),
  cancel: vi.fn(),
  getProgress: vi.fn(() => ({ completed: 0, total: 2 })),
};

export const mockViewModel = () => ({
  shouldStartCalculations: vi.fn(() => false),
  buildCalculationConfig: vi.fn(() => mockCalcConfig),
  simulationStates: { isPending: false },
} as unknown as HouseholdReportViewModel);

export const mockViewModelShouldStart = () => ({
  shouldStartCalculations: vi.fn(() => true),
  buildCalculationConfig: vi.fn(() => mockCalcConfig),
  simulationStates: { isPending: false },
} as unknown as HouseholdReportViewModel);

export const mockViewModelShouldNotStart = () => ({
  shouldStartCalculations: vi.fn(() => false),
  buildCalculationConfig: vi.fn(() => mockCalcConfig),
  simulationStates: { isPending: false },
} as unknown as HouseholdReportViewModel);

export const mockViewModelNoConfig = () => ({
  shouldStartCalculations: vi.fn(() => true),
  buildCalculationConfig: vi.fn(() => null),
  simulationStates: { isPending: false },
} as unknown as HouseholdReportViewModel);

// Mock for @/hooks/household module
export const mockHouseholdHookModule = () => ({
  useHouseholdReportOrchestrator: vi.fn(() => mockOrchestrator),
});
