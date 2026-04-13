import { describe, expect, test } from 'vitest';
import { getPopulationLaunchPrefill } from '@/pathways/population/launchPrefill';

describe('getPopulationLaunchPrefill', () => {
  test('given household scope then returns household prefill', () => {
    expect(getPopulationLaunchPrefill('?scope=household')).toBe('household');
  });

  test('given custom-household scope then returns household prefill', () => {
    expect(getPopulationLaunchPrefill('?scope=custom-household')).toBe('household');
  });

  test('given unrelated query then returns null', () => {
    expect(getPopulationLaunchPrefill('?scope=national')).toBeNull();
    expect(getPopulationLaunchPrefill('?view=reports')).toBeNull();
    expect(getPopulationLaunchPrefill('')).toBeNull();
  });
});
