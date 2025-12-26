import { PolicyStateProps } from './PolicyStateProps';
import { PopulationStateProps } from './PopulationStateProps';

/**
 * SimulationStateProps - Local state interface for simulation within PathwayWrapper
 *
 * Replaces Redux-based Simulation interface for component-local state management.
 * Contains nested policy and population state for composition.
 *
 * This structure allows a SimulationPathwayWrapper OR a parent ReportPathwayWrapper
 * to manage complete simulation state including its dependencies.
 *
 * Configuration state is determined by presence of `id` field OR by checking
 * if both nested ingredients are configured.
 * Use `isSimulationConfigured()` utility to check if simulation is ready.
 */
export interface SimulationStateProps {
  id?: string; // Populated after API creation
  label: string | null; // Required field, can be null
  countryId?: string; // Optional - may be inherited from parent
  apiVersion?: string; // Optional - may be inherited from parent
  status?: 'pending' | 'complete' | 'error'; // Calculation status
  output?: unknown | null; // Calculation result (for household simulations)

  // Nested ingredient state - REPLACES separate Redux slices
  policy: PolicyStateProps; // Owned policy state
  population: PopulationStateProps; // Owned population state
}
