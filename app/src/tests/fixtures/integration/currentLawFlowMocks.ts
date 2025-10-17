import { vi } from 'vitest';
import { countryIds } from '@/libs/countries';
import type { Population } from '@/types/ingredients/Population';

// Test constants for current law integration tests
export const INTEGRATION_TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const INTEGRATION_TEST_CURRENT_LAW_IDS = {
  US: 2,
  UK: 1,
} as const;

// Mock metadata for US with current law ID
export const mockUSMetadata = {
  status: 'success',
  message: null,
  result: {
    variables: {},
    parameters: {},
    entities: {},
    variableModules: {},
    economy_options: {
      region: [{ name: 'us', label: 'United States' }],
      time_period: [{ name: 2025, label: '2025' }],
      datasets: [],
    },
    current_law_id: INTEGRATION_TEST_CURRENT_LAW_IDS.US,
    basicInputs: [],
    modelled_policies: { core: {}, filtered: {} },
    version: '1.0.0',
  },
};

// Mock metadata for UK with current law ID
export const mockUKMetadata = {
  status: 'success',
  message: null,
  result: {
    variables: {},
    parameters: {},
    entities: {},
    variableModules: {},
    economy_options: {
      region: [{ name: 'uk', label: 'United Kingdom' }],
      time_period: [{ name: 2025, label: '2025' }],
      datasets: [],
    },
    current_law_id: INTEGRATION_TEST_CURRENT_LAW_IDS.UK,
    basicInputs: [],
    modelled_policies: { core: {}, filtered: {} },
    version: '1.0.0',
  },
};

// Expected current law policy objects after creation
export const expectedCurrentLawPolicyUS = {
  id: INTEGRATION_TEST_CURRENT_LAW_IDS.US.toString(),
  label: 'Current law',
  parameters: [],
  isCreated: true,
  countryId: INTEGRATION_TEST_COUNTRIES.US,
};

export const expectedCurrentLawPolicyUK = {
  id: INTEGRATION_TEST_CURRENT_LAW_IDS.UK.toString(),
  label: 'Current law',
  parameters: [],
  isCreated: true,
  countryId: INTEGRATION_TEST_COUNTRIES.UK,
};

// Mock population for simulation setup
export const mockPopulation: Population = {
  label: 'Test Population',
  isCreated: true,
  household: {
    id: 'household-123',
    countryId: 'us' as (typeof countryIds)[number],
    householdData: {
      people: {},
    },
  },
  geography: null,
};

// Helper to create mock fetch implementation for metadata
export const createMetadataFetchMock = (country: string) => {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes(`/${country}/metadata`)) {
      const metadata = country === 'us' ? mockUSMetadata : mockUKMetadata;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(metadata),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });
  });
};
