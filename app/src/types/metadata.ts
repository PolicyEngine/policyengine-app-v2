import type { ParameterMetadataCollection } from './metadata/parameterMetadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from './regionTypes';
import type { SPMMetadata } from './spm';
import type { ValuesList } from './subIngredients/valueInterval';

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
 * The v2 catalog identities a v2 saved reform needs to create policies
 * (`POST /v2/policies` takes catalog UUIDs, not parameter paths).
 */
export interface V2CatalogReference {
  /** The PolicyEngine.py version the catalog belongs to; policies are created for it. */
  policyengineVersion: string;
  taxBenefitModelId: string;
  /** Each government parameter's catalog UUID, by parameter path. */
  parameterIds: Record<string, string>;
}

/** Which API routes model metadata was loaded from. */
export type MetadataRoutes = 'v1' | 'v2';

export interface MetadataApiPayload {
  status: string;
  message: string | null;
  result: {
    variables: Record<string, any>;
    parameters: ParameterMetadataCollection;
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
    spm?: SPMMetadata;
    /** Set only when the metadata came from the v2 routes. */
    v2Catalog?: V2CatalogReference;
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
  values?: ValuesList;
  economy?: boolean;
  household?: boolean;
}

export interface MetadataState {
  currentCountry: string | null;
  /** Only this request may resolve the current country's model information. */
  currentRequestId?: string;
  loading: boolean;
  error: string | null;
  /** Download progress percentage (0-100) for metadata fetch */
  progress: number;

  variables: Record<string, any>;
  parameters: ParameterMetadataCollection;
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
  spm?: SPMMetadata;
  /** The routes the current (or pending) metadata comes from; absent means v1. */
  routes?: MetadataRoutes;
  /** The v2 catalog identities, when the metadata came from the v2 routes. */
  v2Catalog?: V2CatalogReference | null;

  // Computed parameter tree for policy creation UI (built when metadata is fetched)
  parameterTree: ParameterTreeNode | null;
}
