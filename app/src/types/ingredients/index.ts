// This file contains type guards and union types for ingredients

import { Geography } from './Geography';
import { Household } from './Household';
import { Policy } from './Policy';
import { Population } from './Population';
import { Report } from './Report';
import { Simulation } from './Simulation';
import { UserPolicy } from './UserPolicy';
import { UserHouseholdPopulation, UserPopulation } from './UserPopulation';
import { UserReport } from './UserReport';
import { UserSimulation } from './UserSimulation';

// Union types for all ingredients
export type BaseIngredient = Policy | Simulation | Report | Household | Geography;
export type UserIngredient = UserPolicy | UserSimulation | UserReport | UserPopulation;

/**
 * Type guard to check if an object is a Policy
 */
export function isPolicy(obj: BaseIngredient): obj is Policy {
  return 'parameters' in obj && !('populationId' in obj) && !('reportData' in obj);
}

/**
 * Type guard to check if an object is a Simulation
 */
export function isSimulation(obj: BaseIngredient): obj is Simulation {
  return 'populationId' in obj && 'policyId' in obj;
}

/**
 * Type guard to check if an object is a Household
 */
export function isHousehold(obj: BaseIngredient): obj is Household {
  return 'householdData' in obj;
}

/**
 * Type guard to check if an object is a Geography
 */
export function isGeography(obj: BaseIngredient): obj is Geography {
  return 'regionCode' in obj && 'countryId' in obj && !('householdData' in obj);
}

/**
 * Type guard to check if an object is a Report
 */
export function isReport(obj: BaseIngredient): obj is Report {
  return 'reportId' in obj && 'simulationIds' in obj && 'status' in obj;
}

/**
 * Type guard to check if an object is a UserPolicy
 */
export function isUserPolicy(obj: UserIngredient): obj is UserPolicy {
  return 'policyId' in obj && !('simulationId' in obj) && !('reportId' in obj);
}

/**
 * Type guard to check if an object is a UserPopulation (household only)
 */
export function isUserPopulation(obj: UserIngredient): obj is UserPopulation {
  return 'type' in obj && 'householdId' in obj;
}

/**
 * Type guard to check if a UserPopulation is for a household
 */
export function isUserHouseholdPopulation(obj: UserPopulation): obj is UserHouseholdPopulation {
  return obj.type === 'household';
}

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

// Export all types
export type { Geography, Household, Policy, Population, Report, Simulation };
export type { UserPolicy, UserHouseholdPopulation, UserPopulation, UserReport, UserSimulation };
