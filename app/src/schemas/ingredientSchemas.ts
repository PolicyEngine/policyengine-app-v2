import { schema } from 'normy';

/**
 * Normalization schemas for ingredient entities using normy
 * These schemas define how to normalize nested data structures into flat, searchable collections
 */

// Base ingredient schemas
export const policySchema = new schema.Entity('policies');
export const populationSchema = new schema.Entity('populations');
export const simulationSchema = new schema.Entity('simulations');
export const reportSchema = new schema.Entity('reports');

// User ingredient association schemas
export const userPolicySchema = new schema.Entity('userPolicies');
export const userPopulationSchema = new schema.Entity('userPopulations');
export const userSimulationSchema = new schema.Entity('userSimulations');
export const userReportSchema = new schema.Entity('userReports');

// Define relationships between entities

// A simulation references a policy and population
simulationSchema.define({
  policy: policySchema,
  population: populationSchema,
});

// A report references one or more simulations
reportSchema.define({
  simulations: [simulationSchema],
  // Single simulation for simple reports
  simulation: simulationSchema,
});

// User associations reference their base entities
userPolicySchema.define({
  policy: policySchema,
});

userPopulationSchema.define({
  population: populationSchema,
});

userSimulationSchema.define({
  simulation: simulationSchema,
  userPolicy: userPolicySchema,
  userPopulation: userPopulationSchema,
});

userReportSchema.define({
  report: reportSchema,
  userSimulations: [userSimulationSchema],
  // Single user simulation for simple reports
  userSimulation: userSimulationSchema,
});

/**
 * Normalized state shape after using these schemas:
 * {
 *   entities: {
 *     policies: { [id]: Policy },
 *     populations: { [id]: Population },
 *     simulations: { [id]: Simulation },
 *     reports: { [id]: Report },
 *     userPolicies: { [id]: UserPolicy },
 *     userPopulations: { [id]: UserPopulation },
 *     userSimulations: { [id]: UserSimulation },
 *     userReports: { [id]: UserReport },
 *   },
 *   result: [...ids]
 * }
 */