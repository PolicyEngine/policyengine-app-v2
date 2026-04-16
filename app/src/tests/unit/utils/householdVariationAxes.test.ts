import { describe, expect, test } from 'vitest';
import {
  HOUSEHOLD_VARIATION_POINT_COUNT,
  buildHouseholdVariationAxes,
  getHouseholdVariationIndexForEarnings,
} from '@/utils/householdVariationAxes';

const YEAR = '2026';

describe('buildHouseholdVariationAxes', () => {
  test('varies the requested person instead of defaulting to object order', () => {
    const householdInput = {
      people: {
        spouse: {
          employment_income: { [YEAR]: 60000 },
        },
        filer: {
          employment_income: { [YEAR]: 45000 },
        },
      },
    };

    const result = buildHouseholdVariationAxes(householdInput, YEAR, 'us', 'filer');

    expect(result.people.filer.employment_income[YEAR]).toBeNull();
    expect(result.people.spouse.employment_income[YEAR]).toBe(60000);
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
