export const policyAssociationKeys = {
  all: ['policy-associations'] as const,
  byId: (userPolicyId: string) => [...policyAssociationKeys.all, 'id', userPolicyId] as const,
  byUser: (userId: string, countryId?: string) =>
    countryId
      ? ([...policyAssociationKeys.all, 'user_id', userId, 'country', countryId] as const)
      : ([...policyAssociationKeys.all, 'user_id', userId] as const),
  byPolicy: (policyId: string) => [...policyAssociationKeys.all, 'policy_id', policyId] as const,
  specific: (userId: string, policyId: string) =>
    [...policyAssociationKeys.all, 'specific', userId, policyId] as const,
};

export const householdAssociationKeys = {
  all: ['household-associations'] as const,
  byUser: (userId: string, countryId?: string) =>
    countryId
      ? ([...householdAssociationKeys.all, 'user_id', userId, 'country', countryId] as const)
      : ([...householdAssociationKeys.all, 'user_id', userId] as const),
  byHousehold: (householdId: string) =>
    [...householdAssociationKeys.all, 'household_id', householdId] as const,
  specific: (userId: string, householdId: string) =>
    [...householdAssociationKeys.all, 'specific', userId, householdId] as const,
};

export const simulationAssociationKeys = {
  all: ['simulation-associations'] as const,
  byUser: (userId: string, countryId?: string) =>
    countryId
      ? ([...simulationAssociationKeys.all, 'user_id', userId, 'country', countryId] as const)
      : ([...simulationAssociationKeys.all, 'user_id', userId] as const),
  bySimulation: (simulationId: string) =>
    [...simulationAssociationKeys.all, 'simulation_id', simulationId] as const,
  specific: (userId: string, simulationId: string) =>
    [...simulationAssociationKeys.all, 'specific', userId, simulationId] as const,
};

export const reportAssociationKeys = {
  all: ['report-associations'] as const,
  byUser: (userId: string, countryId?: string) =>
    countryId
      ? ([...reportAssociationKeys.all, 'user_id', userId, 'country', countryId] as const)
      : ([...reportAssociationKeys.all, 'user_id', userId] as const),
  byReport: (reportId: string) => [...reportAssociationKeys.all, 'report_id', reportId] as const,
  specific: (userId: string, reportId: string) =>
    [...reportAssociationKeys.all, 'specific', userId, reportId] as const,
  byUserReportId: (userReportId: string) =>
    [...reportAssociationKeys.all, 'user_report_id', userReportId] as const,
};

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

export const geographicAssociationKeys = {
  all: ['geographic-associations'] as const,
  byUser: (userId: string, countryId?: string) =>
    countryId
      ? ([...geographicAssociationKeys.all, 'user', userId, 'country', countryId] as const)
      : ([...geographicAssociationKeys.all, 'user', userId] as const),
  byGeography: (geographyId: string) =>
    [...geographicAssociationKeys.all, 'geography', geographyId] as const,
  specific: (userId: string, geographyId: string) =>
    [...geographicAssociationKeys.all, 'user', userId, 'geography', geographyId] as const,
};

export const simulationKeys = {
  all: ['simulations'] as const,
  byId: (simulationId: string) => [...simulationKeys.all, 'simulation_id', simulationId] as const,
  byUser: (userId: string) => [...simulationKeys.all, 'user_id', userId] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  byId: (reportId: string) => [...reportKeys.all, 'report_id', reportId] as const,
  byUser: (userId: string) => [...reportKeys.all, 'user_id', userId] as const,
};

export const calculationKeys = {
  all: ['calculations'] as const,
  byReportId: (reportId: string) => ['calculations', 'report', reportId] as const,
  bySimulationId: (simId: string) => ['calculations', 'simulation', simId] as const,
};

export const householdVariationKeys = {
  all: ['household-variations'] as const,
  byParams: (householdId: string, policyId: string, year: string, countryId: string) =>
    [
      ...householdVariationKeys.all,
      'household',
      householdId,
      'policy',
      policyId,
      'year',
      year,
      'country',
      countryId,
    ] as const,
};

export const parameterValueKeys = {
  all: ['parameter-values'] as const,
  /** Query key for values of a parameter under a specific policy */
  byPolicyAndParameter: (policyId: string, parameterId: string) =>
    [...parameterValueKeys.all, 'policy', policyId, 'parameter', parameterId] as const,
};
