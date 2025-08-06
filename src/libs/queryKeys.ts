export const policyAssociationKeys = {
  all: ['policy-associations'] as const,
  byUser: (userId: string) => [...policyAssociationKeys.all, 'user_id', userId] as const,
  byPolicy: (policyId: string) => [...policyAssociationKeys.all, 'policy_id', policyId] as const,
  specific: (userId: string, policyId: string) =>
    [...policyAssociationKeys.all, 'specific', userId, policyId] as const,
  // Household association keys
  householdsByUser: (userId: string) =>
    [...associationKeys.all, 'user_id', userId, 'households'] as const,
  byHousehold: (householdId: string) =>
    [...associationKeys.all, 'household_id', householdId] as const,
  specificHousehold: (userId: string, householdId: string) =>
    [...associationKeys.all, 'specific_household', userId, householdId] as const,
};

export const simulationAssociationKeys = {
  all: ['simulation-associations'] as const,
  byUser: (userId: string) => [...simulationAssociationKeys.all, 'user_id', userId] as const,
  bySimulation: (simulationId: string) =>
    [...simulationAssociationKeys.all, 'simulation_id', simulationId] as const,
  specific: (userId: string, simulationId: string) =>
    [...simulationAssociationKeys.all, 'specific', userId, simulationId] as const,
};

// Keep your existing keys unchanged
export const policyKeys = {
  all: ['policies'] as const,
  byId: (policyId: string) => [...policyKeys.all, 'policy_id', policyId] as const,
  byUser: (userId: string) => [...policyKeys.all, 'user_id', userId] as const,
};

export const householdKeys = {
  all: ['households'] as const,
  byId: (householdId: string) => [...householdKeys.all, 'household_id', householdId] as const,
  byUser: (userId: string) => [...householdKeys.all, 'user_id', userId] as const,
};

export const simulationKeys = {
  all: ['simulations'] as const,
  byId: (simulationId: string) => [...simulationKeys.all, 'simulation_id', simulationId] as const,
  byUser: (userId: string) => [...simulationKeys.all, 'user_id', userId] as const,
};
