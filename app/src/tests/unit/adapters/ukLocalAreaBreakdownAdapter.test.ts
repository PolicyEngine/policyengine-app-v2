import { describe, expect, test } from 'vitest';
import {
  breakdownLevelsWithheld,
  countWithheldUKAreas,
  localAreaOutput,
  outputServesLocalAreaBreakdowns,
  servesLocalAreaBreakdowns,
  withheldUKAreasOf,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import {
  METADATA_CONSTITUENCY_COUNT,
  PUBLISHED_CONSTITUENCY_NAMES,
  UK_METADATA_REGIONS,
  UNLISTED_CONSTITUENCY_NAME,
} from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
import {
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD } from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';

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

describe('localAreaOutput per level', () => {
  const savedConstituenciesOnly = MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD as any;

  test('given saved constituencies and no breakdown then returns the result as it is', () => {
    // When
    const result = localAreaOutput(savedConstituenciesOnly, null);

    // Then
    expect(result).toBe(savedConstituenciesOnly);
  });

  test('given saved constituencies and a breakdown then keeps them and takes only the local authorities', () => {
    // When
    const result = localAreaOutput(savedConstituenciesOnly, NORMALIZED_BREAKDOWN) as any;

    // Then
    expect(result.constituency_impact).toBe(savedConstituenciesOnly.constituency_impact);
    expect(result.local_authority_impact).toBe(NORMALIZED_BREAKDOWN.local_authority_impact);
  });
});

describe('breakdownLevelsWithheld', () => {
  test('given a saved level then it gets no withheld count, and only the breakdown levels do', () => {
    // When
    const result = breakdownLevelsWithheld(MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD as any, {
      constituency: { withheld: 2, total: 3 },
      local_authority: null,
    });

    // Then
    expect(result).toEqual({ local_authority: null });
  });

  test('given no counts then gives none', () => {
    // Then
    expect(
      breakdownLevelsWithheld(MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD as any, undefined)
    ).toBeUndefined();
  });
});

describe('servesLocalAreaBreakdowns', () => {
  test.each([
    ['6.10.0', true],
    ['6.10.1', true],
    ['6.11.0', true],
    ['7.0.0', true],
    ['v6.10.0', true],
    ['6.9.9', false],
    ['6.7.5', false],
    ['5.20.0', false],
  ])('given .py %s then returns %s', (version, expected) => {
    // Then
    expect(servesLocalAreaBreakdowns(version)).toBe(expected);
  });

  test.each([null, undefined, '', 'latest'])(
    'given an unreadable version %s then returns false',
    (version) => {
      // Then
      expect(servesLocalAreaBreakdowns(version)).toBe(false);
    }
  );
});

describe('outputServesLocalAreaBreakdowns', () => {
  test.each([
    ['a 6.10.0 national result', NATIONAL_OUTPUT_WITHOUT_AREAS, true],
    ['an older release result', OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES, false],
    ['a stored result with no version', UNVERSIONED_OUTPUT_WITHOUT_AREAS, false],
  ])('given %s then returns %s', (_label, output, expected) => {
    // Then
    expect(outputServesLocalAreaBreakdowns(output)).toBe(expected);
  });
});
