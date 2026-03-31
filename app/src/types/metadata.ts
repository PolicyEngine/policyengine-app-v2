import { UK_REGION_TYPES, US_REGION_TYPES } from './regionTypes';

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

export interface MetadataApiPayload {
  status: string;
  message: string | null;
  result: {
    variables: Record<string, any>;
    parameters: Record<string, any>;
    entities: Record<string, any>;
    variableModules: Record<string, any>;
    economy_options: {
      region: MetadataRegionEntry[];
      time_period: Array<{ name: number; label: string }>;
      datasets: Array<{ name: string; label: string; title: string; default: boolean }>;
    };
    current_law_id: number;
    basicInputs: string[];
    modelled_policies: {
      core: Record<string, any>;
      filtered: Record<string, any>;
    };
    version: string;
  };
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
  values?: Record<string, any>;
  economy?: boolean;
  household?: boolean;
}

// ============================================================================
// V2 API metadata types (used by app/src/api/v2/ module)
// ============================================================================

export interface V2VariableMetadata {
  id: string;
  name: string;
  label: string | null;
  entity: string;
  description: string;
  data_type: string;
  possible_values: string[] | null;
  default_value: string | number | boolean | null;
  adds: string[] | null;
  subtracts: string[] | null;
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

export interface V2ParameterValueMetadata {
  id: string;
  parameter_id: string;
  policy_id: string | null;
  dynamic_id: string | null;
  start_date: string;
  end_date: string | null;
  value_json: number | string | boolean;
  created_at: string;
}

export interface MetadataState {
  currentCountry: string | null;
  loading: boolean;
  error: string | null;
  /** Download progress percentage (0-100) for metadata fetch */
  progress: number;

  variables: Record<string, any>;
  parameters: Record<string, any>;
  entities: Record<string, any>;
  variableModules: Record<string, any>;
  economyOptions: {
    region: MetadataRegionEntry[];
    time_period: Array<{ name: number; label: string }>;
    datasets: Array<{ name: string; label: string; title: string; default: boolean }>;
  };
  currentLawId: number;
  basicInputs: string[];
  modelledPolicies: {
    core: Record<string, any>;
    filtered: Record<string, any>;
  };
  version: string | null;

  // Computed parameter tree for policy creation UI (built when metadata is fetched)
  parameterTree: ParameterTreeNode | null;
}
