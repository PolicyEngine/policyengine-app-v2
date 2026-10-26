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
 * Which API routes model metadata was loaded from: v1's
 * `GET /{country}/metadata`, or the Public API's v2 catalog routes, which v3
 * reads on demand. v3's choice between them (V3ApiRoutes in
 * libs/flagship/v3ApiRoutes) is the same type.
 */
export type MetadataRoutes = 'v1' | 'v2';

/**
 * The v2 catalog version metadata came from, for what v3 creates against
 * it (`POST /v2/policies` takes the tax-benefit model's catalog ID).
 */
export interface V2CatalogReference {
  /** The PolicyEngine.py version the catalog version belongs to. */
  policyengineVersion: string;
  taxBenefitModelId: string;
}

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
  /** The v2 catalog version, when the metadata came from the v2 routes. */
  v2Catalog?: V2CatalogReference | null;
  /**
   * On the v2 routes, `parameters` holds only what has been loaded on
   * demand; these are the catalog IDs of those parameters (which
   * `/v2/policies` takes) and the names the catalog version does not have.
   */
  v2ParameterIds?: Record<string, string>;
  v2MissingParameterNames?: string[];
  /**
   * Which load of the v2 model catalog the store holds: a new load empties
   * the parameters loaded on demand, so their queries are keyed by it.
   */
  v2LoadId?: string;
  /**
   * On the v2 routes, `variables` starts empty and fills once, in the
   * background, with every variable of the catalog version named here;
   * absent until they are in.
   */
  v2VariablesVersion?: string;
  /**
   * On the v2 routes, the dated values of each parameter a variable's adds
   * or subtracts names (a list of variable names per date), which the
   * household breakdown reads for the report's year.
   */
  v2PartParameterValues?: Record<string, ValuesList>;

  // Computed parameter tree for policy creation UI (built when metadata is fetched)
  parameterTree: ParameterTreeNode | null;
}
