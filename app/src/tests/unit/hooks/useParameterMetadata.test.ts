import { describe, expect, test } from 'vitest';
import { getParameterMetadataState } from '@/hooks/useParameterMetadata';
import type { MetadataState } from '@/types/metadata';

const READY_METADATA: MetadataState = {
  currentCountry: 'us',
  loading: false,
  error: null,
  progress: 100,
  variables: {},
  parameters: {
    tax_rate: {
      label: 'Tax rate',
      type: 'parameter',
      parameter: 'tax_rate',
      values: { '2024-01-01': 0.2 },
    },
  },
  entities: {},
  variableModules: {},
  economyOptions: { region: [], time_period: [], datasets: [] },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '1.0.0',
  parameterTree: null,
};

describe('getParameterMetadataState', () => {
  test('given metadata for the requested country then returns ready metadata', () => {
    // When
    const result = getParameterMetadataState(READY_METADATA, 'us');

    // Then
    expect(result).toEqual({
      parameters: READY_METADATA.parameters,
      isReady: true,
    });
  });

  test.each([
    ['metadata is loading', { loading: true }],
    ['metadata has no version', { version: null }],
    ['metadata has an error', { error: 'Metadata failed' }],
    ['metadata belongs to another country', { currentCountry: 'uk' }],
  ])('given %s then returns metadata that is not ready', (_description, overrides) => {
    // Given
    const metadata = { ...READY_METADATA, ...overrides } satisfies MetadataState;

    // When
    const result = getParameterMetadataState(metadata, 'us');

    // Then
    expect(result.isReady).toBe(false);
  });
});
