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

export interface MetadataState {
  currentCountry: string | null;
  loading: boolean;
  error: string | null;
  /** Download progress percentage (0-100) for metadata fetch */
  progress: number;

  // V2 tiered loading states
  coreLoading: boolean;
  coreLoaded: boolean;
  coreError: string | null;
  parametersLoading: boolean;
  parametersLoaded: boolean;
  parametersError: string | null;

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
