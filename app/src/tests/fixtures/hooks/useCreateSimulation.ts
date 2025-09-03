import { vi } from 'vitest';

// Mock function for createSimulation
export const mockCreateSimulationFn = vi.fn();

// Default mock return value
export const DEFAULT_USE_CREATE_SIMULATION_RETURN = {
  createSimulation: mockCreateSimulationFn,
  isPending: false,
};

// Loading state mock return value
export const LOADING_USE_CREATE_SIMULATION_RETURN = {
  createSimulation: mockCreateSimulationFn,
  isPending: true,
};