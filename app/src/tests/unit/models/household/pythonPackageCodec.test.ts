import { describe, expect, test } from 'vitest';
import { getPythonPackageHouseholdVariationMaxEarnings } from '@/models/household/pythonPackageCodec';

const VARIATION_FLOOR = 200_000;
const LOW_EARNINGS = 50_000;
const HIGH_EARNINGS = 150_000;

describe('getPythonPackageHouseholdVariationMaxEarnings', () => {
  test.each(['us', 'uk'])(
    'given %s earnings below half the floor then the range ends at the floor',
    (countryId) => {
      expect(getPythonPackageHouseholdVariationMaxEarnings(LOW_EARNINGS, countryId)).toBe(
        VARIATION_FLOOR
      );
    }
  );

  test('given earnings above half the floor then the range ends at twice the earnings', () => {
    expect(getPythonPackageHouseholdVariationMaxEarnings(HIGH_EARNINGS, 'us')).toBe(
      2 * HIGH_EARNINGS
    );
  });

  test('given the removed Nigeria code then no country-specific floor applies', () => {
    expect(getPythonPackageHouseholdVariationMaxEarnings(LOW_EARNINGS, 'ng')).toBe(VARIATION_FLOOR);
  });
});
