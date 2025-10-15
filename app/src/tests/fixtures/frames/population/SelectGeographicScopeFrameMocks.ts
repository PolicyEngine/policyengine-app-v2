/**
 * Mock data for SelectGeographicScopeFrame tests
 */

/**
 * Mock region options for testing
 * Includes US states, UK countries, and UK constituencies
 */
export const mockRegionOptions = [
  { name: 'us', label: 'United States' },
  { name: 'state/ca', label: 'California' },
  { name: 'state/ny', label: 'New York' },
  { name: 'state/tx', label: 'Texas' },
  { name: 'uk', label: 'United Kingdom' },
  { name: 'country/england', label: 'England' },
  { name: 'country/scotland', label: 'Scotland' },
  { name: 'constituency/london', label: 'London' },
  { name: 'constituency/manchester', label: 'Manchester' },
];

/**
 * Full metadata state template for testing
 * Can be extended with Partial<MetadataState> overrides
 */
export const mockMetadataState = {
  loading: false,
  error: null,
  currentCountry: 'us' as string,
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: { region: mockRegionOptions, time_period: [], datasets: [] },
  currentLawId: 0,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: null,
  parameterTree: null,
};
