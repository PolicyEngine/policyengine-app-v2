import { Parameter } from '@/types/subIngredients/parameter';

/**
 * PolicyStateProps - Local state interface for policy within PathwayWrapper
 *
 * Replaces Redux-based Policy interface for component-local state management.
 * Mirrors the structure from types/ingredients/Policy.ts but with required fields
 * for better type safety within PathwayWrappers.
 */
export interface PolicyStateProps {
  id?: string; // Populated after API creation
  label: string | null; // Required field, can be null
  parameters: Parameter[]; // Always present, empty array if no params
  isCreated: boolean; // Tracks whether policy has been successfully created
}
