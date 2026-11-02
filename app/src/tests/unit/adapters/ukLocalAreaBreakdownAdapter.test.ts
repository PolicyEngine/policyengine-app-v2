import { describe, expect, test } from 'vitest';
import {
  breakdownLevelsWithheld,
  countWithheldUKAreas,
  localAreaOutput,
  outputServesLocalAreaBreakdowns,
  servesLocalAreaBreakdowns,
  withheldUKAreasOf,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import { withheldUKHexAreas } from '@/components/visualization/choropleth/ukHexLayout';
import {
  ARDS_AND_NORTH_DOWN_CODE,
  BREAKDOWN_CONSTITUENCY_CODES,
  BREAKDOWN_LOCAL_AUTHORITY_CODES,
  ENGLISH_CONSTITUENCY_CODE,
  PRE_2023_LOCAL_AUTHORITY_CODE,
  PUBLISHED_WELSH_CONSTITUENCY_CODES,
  SCOTLAND_CONSTITUENCY_COUNT,
  UK_CONSTITUENCY_COUNT,
  UK_LOCAL_AUTHORITY_COUNT,
  UK_WIDE_WITHHELD_CONSTITUENCIES,
  UK_WIDE_WITHHELD_LOCAL_AUTHORITIES,
  WALES_LOCAL_AUTHORITY_COUNT,
  WALES_WITHHELD_CONSTITUENCIES,
} from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
import {
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
  SAVED_OLDER_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY,
  SAVED_OUTPUT_WITH_BUNDLE_WITHOUT_VERSIONS,
  SAVED_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY,
  NORMALIZED_BREAKDOWN,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD } from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

describe('countWithheldUKAreas', () => {
  test('given a UK-wide breakdown then counts the constituencies it left out, by code, against the layout', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'uk',
      publishedCodes: BREAKDOWN_CONSTITUENCY_CODES,
    });

    // Then
    expect(result).toEqual(UK_WIDE_WITHHELD_CONSTITUENCIES);
  });

  test('given a report with no region then it is counted as UK-wide', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: undefined,
      publishedCodes: BREAKDOWN_CONSTITUENCY_CODES,
    });

    // Then
    expect(result).toEqual(UK_WIDE_WITHHELD_CONSTITUENCIES);
  });

  test('given a UK-wide breakdown then counts the local authorities it left out, as for constituencies', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'local_authority',
      region: 'uk',
      publishedCodes: BREAKDOWN_LOCAL_AUTHORITY_CODES,
    });

    // Then
    expect(result).toEqual(UK_WIDE_WITHHELD_LOCAL_AUTHORITIES);
  });

  test('given a UK-wide breakdown that publishes Ards and North Down then counts it, whatever the region list holds', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'local_authority',
      region: 'uk',
      publishedCodes: [...BREAKDOWN_LOCAL_AUTHORITY_CODES, ARDS_AND_NORTH_DOWN_CODE],
    });

    // Then
    expect(result).toEqual({
      withheld: UK_LOCAL_AUTHORITY_COUNT - 2,
      total: UK_LOCAL_AUTHORITY_COUNT,
    });
  });

  test('given a nation report then counts its published areas by code against the nation’s areas', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'constituency',
      region: 'country/wales',
      publishedCodes: PUBLISHED_WELSH_CONSTITUENCY_CODES,
    });

    // Then
    expect(result).toEqual(WALES_WITHHELD_CONSTITUENCIES);
  });

  test('given a nation report that publishes no areas then all of the nation’s areas are withheld', () => {
    // When
    const result = countWithheldUKAreas({
      level: 'local_authority',
      region: 'country/wales',
      publishedCodes: [],
    });

    // Then
    expect(result).toEqual({
      withheld: WALES_LOCAL_AUTHORITY_COUNT,
      total: WALES_LOCAL_AUTHORITY_COUNT,
    });
  });

  test.each([
    [
      'a nation report that publishes an area of another nation',
      'constituency',
      'country/wales',
      [...PUBLISHED_WELSH_CONSTITUENCY_CODES, ENGLISH_CONSTITUENCY_CODE],
    ],
    [
      'an area without a code',
      'constituency',
      'country/wales',
      [PUBLISHED_WELSH_CONSTITUENCY_CODES[0], undefined],
    ],
    [
      'a UK-wide area without a code',
      'local_authority',
      'uk',
      [...BREAKDOWN_LOCAL_AUTHORITY_CODES, undefined],
    ],
    [
      'a code the layout lacks',
      'local_authority',
      'uk',
      [...BREAKDOWN_LOCAL_AUTHORITY_CODES, PRE_2023_LOCAL_AUTHORITY_CODE],
    ],
    [
      'a region that is neither the UK nor a nation',
      'constituency',
      'constituency/Aldershot',
      BREAKDOWN_CONSTITUENCY_CODES,
    ],
  ] as const)(
    'given %s then the result cannot be matched by code, and gives no count',
    (_, level, region, publishedCodes) => {
      // When
      const result = countWithheldUKAreas({ level, region, publishedCodes: [...publishedCodes] });

      // Then
      expect(result).toBeNull();
    }
  );

  test.each([
    [
      'UK-wide local authorities',
      'local_authority',
      'uk',
      [...BREAKDOWN_LOCAL_AUTHORITY_CODES, ARDS_AND_NORTH_DOWN_CODE],
    ],
    ['Welsh constituencies', 'constituency', 'country/wales', PUBLISHED_WELSH_CONSTITUENCY_CODES],
  ] as const)(
    'given %s then the count is the number of areas the hex map draws as withheld',
    (_, level, region, publishedCodes) => {
      // Given
      const points = publishedCodes.map((code) => ({ code }));

      // When
      const result = countWithheldUKAreas({ level, region, publishedCodes: [...publishedCodes] });

      // Then
      expect(result?.withheld).toBe(withheldUKHexAreas(level, points, region).length);
    }
  );
});

describe('withheldUKAreasOf', () => {
  test('given a UK-wide breakdown then counts constituencies and local authorities by the same rule', () => {
    // When
    const result = withheldUKAreasOf(NORMALIZED_BREAKDOWN, 'uk');

    // Then
    expect(result).toEqual({
      constituency: UK_WIDE_WITHHELD_CONSTITUENCIES,
      local_authority: UK_WIDE_WITHHELD_LOCAL_AUTHORITIES,
    });
  });

  test('given a breakdown that publishes a local authority under a name the region list lacks then counts it by its code', () => {
    // Given
    const breakdown = COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY.result as LocalAreaBreakdown;

    // When
    const result = withheldUKAreasOf(breakdown, 'uk');

    // Then
    expect(result).toEqual({
      constituency: UK_WIDE_WITHHELD_CONSTITUENCIES,
      local_authority: { withheld: UK_LOCAL_AUTHORITY_COUNT - 2, total: UK_LOCAL_AUTHORITY_COUNT },
    });
  });

  test('given a Scotland report then its Scottish constituency is counted and an English local authority leaves its level uncounted', () => {
    // When
    const result = withheldUKAreasOf(NORMALIZED_BREAKDOWN, 'country/scotland');

    // Then
    expect(result).toEqual({
      constituency: {
        withheld: SCOTLAND_CONSTITUENCY_COUNT - 1,
        total: SCOTLAND_CONSTITUENCY_COUNT,
      },
      local_authority: null,
    });
  });

  test('given a level the API returned as null then counts it as publishing no areas', () => {
    // Given
    const breakdown = { ...NORMALIZED_BREAKDOWN, constituency_impact: null } as any;

    // When
    const result = withheldUKAreasOf(breakdown, 'uk');

    // Then
    expect(result.constituency).toEqual({
      withheld: UK_CONSTITUENCY_COUNT,
      total: UK_CONSTITUENCY_COUNT,
    });
    expect(result.local_authority).toEqual(UK_WIDE_WITHHELD_LOCAL_AUTHORITIES);
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
      constituency: UK_WIDE_WITHHELD_CONSTITUENCIES,
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
    ['a 6.10.0 national result', true, NATIONAL_OUTPUT_WITHOUT_AREAS],
    ['an older release result', false, OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES],
    ['a stored result with no version', false, UNVERSIONED_OUTPUT_WITHOUT_AREAS],
    [
      'a saved 6.10.0 result with the version only in its bundle',
      true,
      SAVED_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY,
    ],
    [
      'a saved 6.7.5 result with the version only in its bundle',
      false,
      SAVED_OLDER_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY,
    ],
    [
      'a saved result whose bundle has no version',
      false,
      SAVED_OUTPUT_WITH_BUNDLE_WITHOUT_VERSIONS,
    ],
  ])('given %s then returns %s', (_label, expected, output) => {
    // Then
    expect(outputServesLocalAreaBreakdowns(output)).toBe(expected);
  });
});
