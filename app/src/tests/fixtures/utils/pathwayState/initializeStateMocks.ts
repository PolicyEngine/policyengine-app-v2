// Test constants for pathway state initialization
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const EXPECTED_REPORT_STATE_STRUCTURE = {
  id: undefined,
  label: null,
  apiVersion: null,
  status: 'pending',
  outputType: undefined,
  output: null,
  simulations: expect.any(Array),
} as const;

export const EXPECTED_SIMULATION_STATE_STRUCTURE = {
  id: undefined,
  label: null,
  countryId: undefined,
  apiVersion: undefined,
  status: undefined,
  output: null,
  policy: expect.any(Object),
  population: expect.any(Object),
} as const;

export const EXPECTED_POLICY_STATE_STRUCTURE = {
  id: null,
  label: null,
  parameters: [],
} as const;

export const EXPECTED_POPULATION_STATE_STRUCTURE = {
  label: null,
  type: null,
  household: null,
  geography: null,
} as const;
