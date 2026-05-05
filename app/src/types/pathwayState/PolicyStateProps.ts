import { Parameter } from '@/types/subIngredients/parameter';

/**
 * PolicyStateProps - Local state interface for policy within PathwayWrapper
 *
 * Replaces Redux-based Policy interface for component-local state management.
 * Mirrors the structure from types/ingredients/Policy.ts but with required fields
 * for better type safety within PathwayWrappers.
 *
 * Configuration state is determined by presence of `id` field.
 * Use `isPolicyConfigured()` utility to check if policy is ready for use.
 */
export interface PolicyStateProps {
  id?: string; // Populated after API creation, current law selection, or loading existing
  label: string | null; // Required field, can be null
  parameters: Parameter[]; // Always present, empty array if no params
}
