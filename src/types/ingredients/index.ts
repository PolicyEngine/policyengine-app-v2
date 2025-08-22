
import { Policy } from './Policy';
import { Simulation } from './Simulation';
import { Report } from './Report';
import { UserPolicy } from './UserPolicy';
import { UserSimulation } from './UserSimulation';
import { UserReport } from './UserReport';

// Union types for all ingredients
export type BaseIngredient = Policy | Simulation | Report; // | Population
export type UserIngredient = UserPolicy | UserSimulation | UserReport; // | UserPopulation

/**
 * Type guard to check if an object is a Policy
 */
export function isPolicy(obj: BaseIngredient): obj is Policy {
  return 'parameters' in obj && !('populationId' in obj) && !('reportData' in obj);
}

/**
 * Type guard to check if an object is a Population
 * COMMENTED OUT - DO NOT USE YET
 */
/*
export function isPopulation(obj: BaseIngredient): obj is Population {
  return 'populationData' in obj;
}
*/

/**
 * Type guard to check if an object is a Simulation
 */
export function isSimulation(obj: BaseIngredient): obj is Simulation {
  return 'populationId' in obj && 'policyId' in obj;
}

/**
 * Type guard to check if an object is a Report
 */
export function isReport(obj: BaseIngredient): obj is Report {
  return 'reportData' in obj && 'simulationId' in obj;
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