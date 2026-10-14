import { describe, expect, test } from 'vitest';
import { populationLabel } from '@/components/flagship/reform/PopulationPicker';

const REGIONS = [
  { name: 'state/ar', label: 'Arkansas' },
  { name: 'congressional_district/AR-01', label: "Arkansas's 1st congressional district" },
];

describe('populationLabel', () => {
  test('given the whole country then it reads Nationwide', () => {
    expect(populationLabel('', REGIONS)).toBe('Nationwide');
  });

  test('given regions from metadata then a state and a district read by name', () => {
    expect(populationLabel('state/ar', REGIONS)).toBe('Arkansas');
    expect(populationLabel('congressional_district/AR-01', REGIONS)).toBe("Arkansas's 1st");
  });

  test('given metadata still loading then a state reads by name, a district by its code', () => {
    expect(populationLabel('state/ar', [])).toBe('Arkansas');
    expect(populationLabel('state/dc', [])).toBe('District of Columbia');
    expect(populationLabel('congressional_district/AR-01', [])).toBe('AR-01');
  });
});
