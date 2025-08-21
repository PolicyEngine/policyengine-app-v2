import { countryIds } from '@/libs/countries';
import { Parameter } from './parameter';

// ============================================================================
// Base immutable types for API communication
// ============================================================================

/**
 * Base Policy type containing only immutable values sent to the API
 */
export interface Policy {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  parameters: Parameter[];
}

/**
 * Base Population type containing only immutable values sent to the API
 * (Currently implemented as households in the system)
 * COMMENTED OUT - DO NOT USE YET
 * TODO: Need to confirm with Sakshi how this is implemented/broken down
 */
/*
export interface Population {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_data: PopulationData;
}

export interface PopulationData {
  people: Record<string, PopulationPerson>;
  families: Record<string, MemberGroup>;
  tax_units: Record<string, MemberGroup>;
  spm_units: Record<string, MemberGroup>;
  households: Record<string, MemberGroup & { state_name?: Record<string, string> }>;
  marital_units: Record<string, MemberGroup & { marital_unit_id?: Record<string, number> }>;
}

export interface PopulationPerson {
  age: Record<string, number>;
  employment_income?: Record<string, number>;
  is_tax_unit_dependent?: Record<string, boolean>;
}

export interface MemberGroup {
  members: string[];
}
*/

/**
 * Base Simulation type containing only immutable values sent to the API
 */
export interface Simulation {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_id: number;
  policy_id: number;
}

/**
 * Base Report type containing only immutable values sent to the API
 * NOTE: This is a template and open to modification in the future
 */
export interface Report {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  simulation_id: number;
  report_data: ReportData;
  report_hash: string;
}

export interface ReportData {
  [key: string]: any; // TODO: Define specific report data structure when available
}

// ============================================================================
// User-specific mutable types that connect users to ingredients
// ============================================================================

/**
 * UserPolicy type containing mutable user-specific data
 */
export interface UserPolicy {
  id: number;
  userId: number;
  policyId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}

/**
 * UserPopulation type containing mutable user-specific data
 * COMMENTED OUT - DO NOT USE YET
 */
/*
export interface UserPopulation {
  id: number;
  userId: number;
  populationId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}
*/

/**
 * UserSimulation type containing mutable user-specific data
 */
export interface UserSimulation {
  id: number;
  userId: number;
  simulationId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}

/**
 * UserReport type containing mutable user-specific data
 */
export interface UserReport {
  id: number;
  userId: number;
  reportId: number;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}

// ============================================================================
// Helper types and utilities
// ============================================================================

/**
 * Union type for all base ingredient types
 * Note: Population is commented out for now
 */
export type BaseIngredient = Policy | Simulation | Report; // | Population

/**
 * Union type for all user ingredient types
 * Note: UserPopulation is commented out for now
 */
export type UserIngredient = UserPolicy | UserSimulation | UserReport; // | UserPopulation

/**
 * Type guard to check if an object is a Policy
 */
export function isPolicy(obj: BaseIngredient): obj is Policy {
  return 'parameters' in obj && !('population_id' in obj) && !('report_data' in obj);
}

/**
 * Type guard to check if an object is a Population
 * COMMENTED OUT - DO NOT USE YET
 */
/*
export function isPopulation(obj: BaseIngredient): obj is Population {
  return 'population_data' in obj;
}
*/

/**
 * Type guard to check if an object is a Simulation
 */
export function isSimulation(obj: BaseIngredient): obj is Simulation {
  return 'population_id' in obj && 'policy_id' in obj;
}

/**
 * Type guard to check if an object is a Report
 */
export function isReport(obj: BaseIngredient): obj is Report {
  return 'report_data' in obj && 'simulation_id' in obj;
}

/**
 * Type guard to check if an object is a UserPolicy
 */
export function isUserPolicy(obj: UserIngredient): obj is UserPolicy {
  return 'policyId' in obj && !('simulationId' in obj) && !('reportId' in obj);
}

/**
 * Type guard to check if an object is a UserPopulation
 * COMMENTED OUT - DO NOT USE YET
 */
/*
export function isUserPopulation(obj: UserIngredient): obj is UserPopulation {
  return 'populationId' in obj;
}
*/

/**
 * Type guard to check if an object is a UserSimulation
 */
export function isUserSimulation(obj: UserIngredient): obj is UserSimulation {
  return 'simulationId' in obj && !('reportId' in obj);
}

/**
 * Type guard to check if an object is a UserReport
 */
export function isUserReport(obj: UserIngredient): obj is UserReport {
  return 'reportId' in obj;
}