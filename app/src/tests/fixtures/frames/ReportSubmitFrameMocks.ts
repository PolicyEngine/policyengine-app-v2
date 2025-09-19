import { vi } from 'vitest';
import { FlowFrame } from '@/types/flow';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';

// Mock simulations
export const mockSimulation1: Simulation = {
  id: '1',
  label: 'Test Simulation 1',
  policyId: '1',
  populationId: '1',
  populationType: 'household',
  isCreated: true,
};

export const mockSimulation2: Simulation = {
  id: '2',
  label: 'Test Simulation 2',
  policyId: '2',
  populationId: '2',
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

// Mock report state - must be complete Report, not Partial
export const mockReportWithLabel: Report = {
  reportId: '',
  label: 'My Test Report',
  countryId: 'us' as const,
  simulationIds: ['1', '2'],
  apiVersion: 'v1',
  status: 'pending' as const,
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockReportNoLabel: Report = {
  ...mockReportWithLabel,
  label: null,
};

// Mock Redux state - using position-based storage
export const createMockReportState = () => ({
  report: {
    reportId: undefined,
    label: 'My Test Report',
    countryId: 'us' as const,
    simulationIds: ['1', '2'],
    apiVersion: 'v1',
    status: 'pending' as const,
    output: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeSimulationPosition: 0 as 0 | 1,
    mode: 'report' as const,
  },
  simulations: {
    simulations: [mockSimulation1, mockSimulation2] as [Simulation | null, Simulation | null],
    activePosition: null as 0 | 1 | null,
  },
});

export const createMockReportStateNoLabels = () => ({
  report: {
    reportId: undefined,
    label: null,
    countryId: 'us' as const,
    simulationIds: ['1', '2'],
    apiVersion: 'v1',
    status: 'pending' as const,
    output: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeSimulationPosition: 0 as 0 | 1,
    mode: 'report' as const,
  },
  simulations: {
    simulations: [mockSimulation1NoLabel, mockSimulation2NoLabel] as [Simulation | null, Simulation | null],
    activePosition: null as 0 | 1 | null,
  },
});

// Mock hooks
export const mockCreateReport = vi.fn();
export const mockResetIngredient = vi.fn();
export const mockOnNavigate = vi.fn();
export const mockOnReturn = vi.fn();

// Mock flow config
export const mockFlowConfig: FlowFrame = {
  component: 'ReportSubmitFrame',
  on: {
    submit: '__return__',
  },
};

// Default flow props
export const defaultFlowProps = {
  onNavigate: mockOnNavigate,
  onReturn: mockOnReturn,
  flowConfig: mockFlowConfig,
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
