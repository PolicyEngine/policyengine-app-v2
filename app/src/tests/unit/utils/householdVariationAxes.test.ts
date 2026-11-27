import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import {
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import {
  buildHouseholdVariationAxes,
  getHouseholdVariationIndexForEarnings,
  getHouseholdVariationMaxEarnings,
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

describe('getHouseholdVariationMaxEarnings', () => {
  test('given low earnings then the range reaches the 200,000 floor', () => {
    expect(getHouseholdVariationMaxEarnings(50_000)).toBe(200_000);
  });

  test('given earnings above half the floor then the range reaches twice the earnings', () => {
    expect(getHouseholdVariationMaxEarnings(150_000)).toBe(300_000);
  });
});

describe('v2EarningsVariationAxes', () => {
  test('given a stored household and its head then the earnings axis varies that person, by position', () => {
    // When
    const axes = v2EarningsVariationAxes(
      US_SINGLE_PARENT_V2_BODY.household_data,
      V2_CODEC_YEAR,
      'your first dependent'
    );

    // Then
    expect(axes).toEqual([
      [
        {
          name: 'employment_income',
          period: V2_CODEC_YEAR,
          min: 0,
          max: 200_000,
          count: HOUSEHOLD_VARIATION_POINT_COUNT,
          index: 1,
        },
      ],
    ]);
  });

  test('given no head then the axis varies "you", wherever they are stored, up to twice their earnings', () => {
    // Given: "you" stored second, after the dependent
    const [you, dependent] = US_SINGLE_PARENT_V2_BODY.household_data.people;
    const document = {
      ...US_SINGLE_PARENT_V2_BODY.household_data,
      people: [
        dependent,
        { ...you, values: { ...you.values, employment_income: { 2026: 150_000 } } },
      ],
    };

    // When
    const [[axis]] = v2EarningsVariationAxes(document, V2_CODEC_YEAR, null);

    // Then
    expect(axis).toMatchObject({ max: 300_000, index: 1 });
  });
});
