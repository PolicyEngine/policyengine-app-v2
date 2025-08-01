// Contains query keys for use with Tanstack Query to centralize cache management
export const associationKeys = {
  all: ['associations'] as const,
  byUser: (userId: string) => [...associationKeys.all, 'user_id', userId] as const,
  byPolicy: (policyId: string) => [...associationKeys.all, 'policy_id', policyId] as const,
  specific: (userId: string, policyId: string) =>
    [...associationKeys.all, 'specific', userId, policyId] as const,
};

export const policyKeys = {
  all: ['policies'] as const,
  byId: (policyId: string) => [...policyKeys.all, 'policy_id', policyId] as const,
  byUser: (userId: string) => [...policyKeys.all, 'user_id', userId] as const,
};

export const simulationKeys = {
  all: ['simulations'] as const,
  byId: (simulationId: string) => [...simulationKeys.all, 'simulation_id', simulationId] as const,
  byUser: (userId: string) => [...simulationKeys.all, 'user_id', userId] as const,
};
