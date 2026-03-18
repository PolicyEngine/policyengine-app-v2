import { describe, expect, test } from 'vitest';
import { resolveDefaultReportOutputSubpage } from '@/utils/reportOutputSubpage';

describe('resolveDefaultReportOutputSubpage', () => {
  test('given household output with no subpage then defaults to overview', () => {
    expect(resolveDefaultReportOutputSubpage('household', undefined)).toBe('overview');
  });

  test('given household output with an empty-string subpage then defaults to overview', () => {
    expect(resolveDefaultReportOutputSubpage('household', '')).toBe('overview');
  });

  test('given society-wide output with no subpage then defaults to migration', () => {
    expect(resolveDefaultReportOutputSubpage('societyWide', undefined)).toBe('migration');
  });

  test('given an explicit subpage then preserves it', () => {
    expect(resolveDefaultReportOutputSubpage('household', 'policy')).toBe('policy');
  });

  test('given an unknown output type with no subpage then returns an empty string', () => {
    expect(resolveDefaultReportOutputSubpage(undefined, undefined)).toBe('');
  });
});
