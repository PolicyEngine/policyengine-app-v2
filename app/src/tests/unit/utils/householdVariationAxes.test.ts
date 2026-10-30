import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import { REMOVED_COUNTRY_IDS } from '@/tests/fixtures/libs/countriesMocks';
import {
  buildHouseholdVariationAxes,
  getHouseholdVariationIndexForEarnings,
  getHouseholdVariationMaxEarnings,
  HOUSEHOLD_VARIATION_POINT_COUNT,
} from '@/utils/householdVariationAxes';

const YEAR = '2026';

describe('buildHouseholdVariationAxes', () => {
  test('varies the requested person instead of defaulting to object order', () => {
    const household = Household.fromAppInput({
      id: 'variation-household',
      countryId: 'us',
      householdData: {
        people: {
          spouse: {
            employment_income: { [YEAR]: 60000 },
          },
          filer: {
            employment_income: { [YEAR]: 45000 },
          },
        },
      },
    });

    const result = buildHouseholdVariationAxes(household, YEAR, 'filer');

    expect(result.people.filer.employment_income?.[YEAR]).toBeNull();
    expect(result.people.spouse.employment_income?.[YEAR]).toBe(60000);
    expect(result.axes[0][0].count).toBe(HOUSEHOLD_VARIATION_POINT_COUNT);
  });
});

describe('getHouseholdVariationIndexForEarnings', () => {
  test('maps earnings back to the nearest variation index', () => {
    expect(getHouseholdVariationIndexForEarnings(0, 200000)).toBe(0);
    expect(getHouseholdVariationIndexForEarnings(200000, 200000)).toBe(
      HOUSEHOLD_VARIATION_POINT_COUNT - 1
    );
    expect(getHouseholdVariationIndexForEarnings(100000, 200000)).toBe(200);
  });
});

describe('getHouseholdVariationMaxEarnings', () => {
  test.each(['us', 'uk', ...REMOVED_COUNTRY_IDS])(
    'given low earnings in %s then the range reaches the 200,000 floor',
    (countryId) => {
      expect(getHouseholdVariationMaxEarnings(50_000, countryId)).toBe(200_000);
    }
  );

  test('given earnings above half the floor then the range reaches twice the earnings', () => {
    expect(getHouseholdVariationMaxEarnings(150_000, 'uk')).toBe(300_000);
  });
});
