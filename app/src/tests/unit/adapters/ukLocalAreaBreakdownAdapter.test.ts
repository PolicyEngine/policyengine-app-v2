import { describe, expect, test } from 'vitest';
import { countWithheldUKAreas, withheldUKAreasOf } from '@/adapters/ukLocalAreaBreakdownAdapter';
import {
  METADATA_CONSTITUENCY_COUNT,
  PUBLISHED_CONSTITUENCY_NAMES,
  UK_METADATA_REGIONS,
  UNLISTED_CONSTITUENCY_NAME,
} from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

describe('countWithheldUKAreas', () => {
  test('given a UK-wide breakdown then counts the listed constituencies it left out', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'uk',
      publishedNames: PUBLISHED_CONSTITUENCY_NAMES,
      regions: UK_METADATA_REGIONS,
    });

    // Then
    expect(result).toEqual({
      withheld: METADATA_CONSTITUENCY_COUNT - PUBLISHED_CONSTITUENCY_NAMES.length,
      total: METADATA_CONSTITUENCY_COUNT,
    });
  });

  test('given a report with no region then it is counted as UK-wide', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: undefined,
      publishedNames: PUBLISHED_CONSTITUENCY_NAMES,
      regions: UK_METADATA_REGIONS,
    });

    // Then
    expect(result?.withheld).toBe(2);
  });

  test('given local authorities then gives no count, as the area lists differ', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'local_authority',
      region: 'uk',
      publishedNames: ['Hartlepool'],
      regions: UK_METADATA_REGIONS,
    });

    // Then
    expect(result).toBeNull();
  });

  test('given a nation report then gives no count, as the metadata has no nation per area', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'country/scotland',
      publishedNames: PUBLISHED_CONSTITUENCY_NAMES,
      regions: UK_METADATA_REGIONS,
    });

    // Then
    expect(result).toBeNull();
  });

  test('given a published name the metadata does not list then gives no count', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'uk',
      publishedNames: [...PUBLISHED_CONSTITUENCY_NAMES, UNLISTED_CONSTITUENCY_NAME],
      regions: UK_METADATA_REGIONS,
    });

    // Then
    expect(result).toBeNull();
  });

  test('given no region metadata then gives no count', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'uk',
      publishedNames: PUBLISHED_CONSTITUENCY_NAMES,
      regions: [],
    });

    // Then
    expect(result).toBeNull();
  });
});

describe('withheldUKAreasOf', () => {
  test('given a UK-wide breakdown then counts constituencies and leaves local authorities uncounted', () => {
    // When
    const result = withheldUKAreasOf(NORMALIZED_BREAKDOWN, 'uk', UK_METADATA_REGIONS);

    // Then
    expect(result).toEqual({
      constituency: { withheld: 2, total: METADATA_CONSTITUENCY_COUNT },
      local_authority: null,
    });
  });

  test('given a level the API returned as null then counts it as publishing no areas', () => {
    // Given
    const breakdown = { ...NORMALIZED_BREAKDOWN, constituency_impact: null } as any;

    // When
    const result = withheldUKAreasOf(breakdown, 'uk', UK_METADATA_REGIONS);

    // Then
    expect(result.constituency).toEqual({ withheld: 3, total: METADATA_CONSTITUENCY_COUNT });
  });
});
