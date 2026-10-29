import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import {
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import {
  buildHouseholdVariationAxes,
  getHouseholdVariationIndexForEarnings,
  HOUSEHOLD_VARIATION_POINT_COUNT,
  v2EarningsVariationAxes,
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

describe('v2EarningsVariationAxes', () => {
  test('given a stored household and its head then the earnings axis varies that person, by position', () => {
    expect(
      v2EarningsVariationAxes(
        US_SINGLE_PARENT_V2_BODY.household_data,
        V2_CODEC_YEAR,
        'us',
        'your first dependent'
      )
    ).toEqual([
      [
        {
          name: 'employment_income',
          period: V2_CODEC_YEAR,
          min: 0,
          max: 200000,
          count: HOUSEHOLD_VARIATION_POINT_COUNT,
          index: 1,
        },
      ],
    ]);
  });

  test('given no head then the axis varies "you", up to twice their earnings', () => {
    const document = {
      ...US_SINGLE_PARENT_V2_BODY.household_data,
      people: US_SINGLE_PARENT_V2_BODY.household_data.people.map((person) =>
        person.source_name === 'you'
          ? { ...person, values: { ...person.values, employment_income: { 2026: 150000 } } }
          : person
      ),
    };

    expect(v2EarningsVariationAxes(document, V2_CODEC_YEAR, 'us', null)[0][0]).toMatchObject({
      max: 300000,
      index: 0,
    });
  });
});
