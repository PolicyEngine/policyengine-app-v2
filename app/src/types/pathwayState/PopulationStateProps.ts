import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';

/**
 * PopulationStateProps - Local state interface for population within PathwayWrapper
 *
 * Replaces Redux-based Population interface for component-local state management.
 * Mirrors the structure from types/ingredients/Population.ts but with required fields
 * for better type safety within PathwayWrappers.
 *
 * Can contain either a Household or Geography, but not both.
 * The `type` field helps track which population type is being managed.
 *
 * Configuration state is determined by presence of `household.id` or `geography.id`.
 * Use `isPopulationConfigured()` utility to check if population is ready for use.
 */
export interface PopulationStateProps {
  label: string | null; // Required field, can be null
  type: 'household' | 'geography' | null; // Tracks population type for easier management
  household: Household | null; // Mutually exclusive with geography
  geography: Geography | null; // Mutually exclusive with household
}
