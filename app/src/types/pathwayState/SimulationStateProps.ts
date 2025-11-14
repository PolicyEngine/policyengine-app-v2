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
 */
export interface SimulationStateProps {
  id?: string; // Populated after API creation
  label: string | null; // Required field, can be null
  countryId?: string; // Optional - may be inherited from parent
  apiVersion?: string; // Optional - may be inherited from parent
  isCreated: boolean; // Tracks whether simulation has been successfully created
  status?: 'pending' | 'complete' | 'error'; // Calculation status
  output?: unknown | null; // Calculation result (for household simulations)

  // Nested ingredient state - REPLACES separate Redux slices
  policy: PolicyStateProps; // Owned policy state
  population: PopulationStateProps; // Owned population state
}
