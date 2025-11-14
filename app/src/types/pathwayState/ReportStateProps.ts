import { countryIds } from '@/libs/countries';
import type { ReportOutput } from '@/types/ingredients/Report';
import { SimulationStateProps } from './SimulationStateProps';

/**
 * ReportStateProps - Local state interface for report within PathwayWrapper
 *
 * Replaces Redux-based Report interface for component-local state management.
 * Contains nested simulation state (which itself contains nested policy/population state).
 *
 * Key difference from Redux: Instead of storing simulationIds and managing
 * simulations in separate Redux slice, we store the full simulation objects
 * as an array within the report state.
 */
export interface ReportStateProps {
  id?: string; // Populated after API creation
  label: string | null; // Required field, can be null
  countryId: (typeof countryIds)[number]; // Required - determines which API to use
  apiVersion: string | null; // API version for calculations
  status: 'pending' | 'complete' | 'error'; // Report generation status
  outputType?: 'household' | 'economy'; // Discriminator for output type
  output?: ReportOutput | null; // Generated report output

  // Nested ingredient state - REPLACES separate Redux slices
  // Array of exactly 2 simulations (baseline and reform)
  simulations: [SimulationStateProps, SimulationStateProps];
}
