import { describe, expect, test } from 'vitest';
import { LOAD_API_REGION_SHADOW, REGION_SURFACE_SOURCE } from '@/config/regionSource';

describe('regionSource', () => {
  test('regions are surfaced from v1 metadata and the api region shadow is disabled', () => {
    expect(REGION_SURFACE_SOURCE).toBe('metadata');
    expect(LOAD_API_REGION_SHADOW).toBe(false);
  });
});
