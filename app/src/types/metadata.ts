import { UK_REGION_TYPES, US_REGION_TYPES } from './regionTypes';

/**
 * V2 API response types - raw data from the API
 * These represent the exact shape of data returned by the V2 API endpoints.
 */

export interface V2VariableMetadata {
  id: string;
  name: string;
  entity: string;
  description: string;
  data_type: string;
  possible_values: string[] | null;
  tax_benefit_model_version_id: string;
  created_at: string;
}

export interface V2ParameterMetadata {
  id: string;
  name: string;
  label: string;
  description: string;
  data_type: string;
  unit: string | null;
  tax_benefit_model_version_id: string;
  created_at: string;
}

export interface V2DatasetMetadata {
  id: string;
  name: string;
  description: string;
  filepath: string;
  year: number;
  is_output_dataset: boolean;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * V2 API parameter value - represents a single value entry for a parameter
 * Fetched on-demand when parameter values are needed (e.g., in policy creator)
 */
export interface V2ParameterValueMetadata {
  id: string;
  parameter_id: string;
  policy_id: string | null;
  dynamic_id: string | null;
  start_date: string; // ISO timestamp (e.g., "2025-01-01T00:00:00")
  end_date: string | null; // ISO timestamp or null for indefinite
  value_json: number | string | boolean; // The actual parameter value
  created_at: string;
}

/**
 * Region entry from API metadata
 * All regions have: name, label, type
 * Congressional districts also have: state_abbreviation, state_name
 */
export interface MetadataRegionEntry {
  name: string;
  label: string;
  type:
    | (typeof US_REGION_TYPES)[keyof typeof US_REGION_TYPES]
    | (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES];
  // Congressional district specific fields
  state_abbreviation?: string;
  state_name?: string;
}

/**
 * Variable metadata - represents a variable in the tax-benefit model
 * Based on V2 API response with computed label for display
 *
 * TODO: Migrate fully to V2VariableMetadata. This intermediate type exists because:
 * 1. `label` is computed from `name` in MetadataAdapter (V2 API doesn't provide labels)
 * 2. `adds`/`subtracts` are V1 fields used by VariableArithmetic for breakdown display
 *
 * KNOWN ISSUES:
 * - `adds`/`subtracts` are NEVER POPULATED from V2 API, so VariableArithmetic
 *   breakdown functionality is currently broken. V1 API included these fields
 *   directly in the response to describe variable arithmetic formulas.
 * - `label` is auto-generated from `name` (e.g., "employment_income" -> "Employment income")
 *   using sentence case. V1 API provided human-curated labels. V2 API should add
 *   a `label` field to match V1's quality.
 */
export interface VariableMetadata {
  // Core fields from V2 API
  id?: string;
  name: string;
  entity: string;
  description: string | null;
  data_type?: string;
  possible_values?: string[] | Record<string, string> | null;
  tax_benefit_model_version_id?: string;
  created_at?: string;

  // Auto-generated from name (sentence case) - V2 API should provide this field
  label?: string;

  // Variable arithmetic (for breakdown calculations)
  // WARNING: These fields are NOT populated from V2 API - see note above
  adds?: string | string[];
  subtracts?: string | string[];
}

/**
 * Parameter metadata - represents a policy parameter
 */
export interface ParameterMetadata {
  // Core fields
  id?: string;
  name?: string;
  label: string;
  description?: string | null;
  unit?: string | null;
  data_type?: string;
  tax_benefit_model_version_id?: string;
  created_at?: string;

  // Parameter tree fields
  type?: 'parameter' | 'parameterNode';
  parameter: string; // Dot-separated path to parameter

  // Values indexed by date
  values?: Record<string, unknown>;

  // Scope flags
  economy?: boolean;
  household?: boolean;

  // Period for time-based parameters
  period?: string | null;
}

/**
 * Collection of parameter metadata indexed by parameter name
 */
export type ParameterMetadataCollection = Record<string, ParameterMetadata>;

/**
 * Entity metadata - represents an entity type (person, household, etc.)
 */
export interface EntityMetadata {
  label: string;
  plural: string;
  documentation?: string;
  is_person?: boolean;
}

/**
 * Module metadata - represents a variable module
 */
export interface ModuleMetadata {
  label: string;
  documentation?: string;
}

/**
 * Modelled policy metadata
 */
export interface ModelledPolicy {
  label: string;
  id: number;
}

// Re-export ParameterTreeNode type from buildParameterTree
export interface ParameterTreeNode {
  name: string;
  label: string;
  index: number;
  children?: ParameterTreeNode[];
  type?: 'parameterNode' | 'parameter';
  parameter?: string;
  description?: string | null;
  unit?: string | null;
  period?: string | null;
  values?: Record<string, unknown>;
  economy?: boolean;
  household?: boolean;
}

/**
 * MetadataState - Redux state for API-driven metadata
 *
 * This state contains only data fetched from the API.
 * Static metadata (entities, basicInputs, timePeriods, regions, modelledPolicies, currentLawId)
 * is accessed via hooks from @/hooks/useStaticMetadata or @/hooks/useDerivedMetadata.
 */
export interface MetadataState {
  currentCountry: string | null;
  /** Download progress percentage (0-100) for metadata fetch */
  progress: number;

  // Unified loading state
  loading: boolean;
  loaded: boolean;
  error: string | null;

  // API-driven data
  variables: Record<string, VariableMetadata>;
  parameters: Record<string, ParameterMetadata>;
  datasets: Array<{
    name: string;
    label: string;
    title: string;
    default: boolean;
  }>;
  version: string | null;

  // Computed parameter tree for policy creation UI (built when metadata is fetched)
  parameterTree: ParameterTreeNode | null;
}
