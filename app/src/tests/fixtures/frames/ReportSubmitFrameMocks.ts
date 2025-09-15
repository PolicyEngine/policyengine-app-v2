import { vi } from 'vitest';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';

// Mock simulations
export const mockSimulation1: Simulation = {
  id: 'sim-1',
  label: 'Test Simulation 1',
  policyId: 'policy-1',
  populationId: 'pop-1',
  populationType: 'household',
  isCreated: true,
};

export const mockSimulation2: Simulation = {
  id: 'sim-2',
  label: 'Test Simulation 2',
  policyId: 'policy-2',
  populationId: 'pop-2',
  populationType: 'household',
  isCreated: true,
};

export const mockSimulation1NoLabel: Simulation = {
  ...mockSimulation1,
  label: null,
};

export const mockSimulation2NoLabel: Simulation = {
  ...mockSimulation2,
  label: null,
};

// Mock report state
export const mockReportWithLabel: Partial<Report> = {
  reportId: '',
  label: 'My Test Report',
  countryId: 'us' as const,
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: 'v1',
  status: 'pending' as const,
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockReportNoLabel: Partial<Report> = {
  ...mockReportWithLabel,
  label: null,
};

// Mock Redux state
export const createMockReportState = (report: Partial<Report> = mockReportWithLabel) => ({
  report,
  simulations: {
    ids: ['sim-1', 'sim-2'],
    entities: {
      'sim-1': mockSimulation1,
      'sim-2': mockSimulation2,
    },
    activeId: null,
  },
});

export const createMockReportStateNoLabels = () => ({
  report: mockReportNoLabel,
  simulations: {
    ids: ['sim-1', 'sim-2'],
    entities: {
      'sim-1': mockSimulation1NoLabel,
      'sim-2': mockSimulation2NoLabel,
    },
    activeId: null,
  },
});

// Mock hooks
export const mockCreateReport = vi.fn();
export const mockResetIngredient = vi.fn();
export const mockOnNavigate = vi.fn();
export const mockOnReturn = vi.fn();


// Default flow props
export const defaultFlowProps = {
  onNavigate: mockOnNavigate,
  onReturn: mockOnReturn,
  flowConfig: {},
  isInSubflow: false,
  flowDepth: 0,
};

// Clear all mocks helper
export const clearAllMocks = () => {
  mockCreateReport.mockClear();
  mockResetIngredient.mockClear();
  mockOnNavigate.mockClear();
  mockOnReturn.mockClear();
};