// Export all v2 API modules for easy access
export { apiClient, type ApiError, type ApiResponse, type PaginationParams } from '../apiClient';
export { datasetsAPI } from './datasets';
export { parametersAPI } from '../parameters';
export { policiesAPI } from './policies';
export { simulationsAPI } from './simulations';

// Re-export types
export type {
  DatasetResponse,
  DatasetCreate,
  DatasetUpdate,
  VersionedDatasetResponse,
  VersionedDatasetCreate,
} from './datasets';

export type {
  Parameter,
  ParameterValue,
  BaselineParameterValue,
  ParameterCreate,
  ParameterValueCreate,
  BaselineParameterValueCreate,
  ParameterValueUpdate,
} from '../parameters';

export type { PolicyResponse, PolicyCreate, PolicyUpdate, PolicyWithParameters } from './policies';

export type {
  SimulationResponse,
  SimulationCreate,
  SimulationUpdate,
  SimulationRunResult,
} from './simulations';