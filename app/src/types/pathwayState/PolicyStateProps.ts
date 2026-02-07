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
 *
 * In V2 API:
 * - id = null → current law (baseline)
 * - id = UUID string → reform policy
 * - id = undefined → not yet configured
 */
export interface PolicyStateProps {
  id?: string | null; // null = current law (V2), string = reform, undefined = not set
  label: string | null; // Required field, can be null
  parameters: Parameter[]; // Always present, empty array if no params
}
