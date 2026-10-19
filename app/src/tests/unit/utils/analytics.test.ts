import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  householdErrorCategory,
  regionKindOf,
  trackHouseholdCalculated,
  trackHouseholdVariableAdded,
  trackReportRunStarted,
  trackSimulationCompleted,
} from '@/utils/analytics';

describe('analytics', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockClear();
    window.gtag = gtag;
  });

  afterEach(() => {
    delete window.gtag;
  });

  test('given no gtag then events send nothing and nothing throws', () => {
    delete window.gtag;

    expect(() =>
      trackSimulationCompleted({ calcType: 'household', countryId: 'us' })
    ).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });

  test('given an existing event then it still sends as before', () => {
    trackSimulationCompleted({ calcType: 'household', countryId: 'us' });

    expect(gtag).toHaveBeenCalledWith('event', 'simulation_completed', {
      calcType: 'household',
      countryId: 'us',
    });
  });

  test('given a successful household run then no error category is sent', () => {
    trackHouseholdCalculated({
      countryId: 'uk',
      householdCount: 2,
      peopleCount: 3,
      nonDefaultInputs: 4,
      durationMs: 1234.6,
      success: true,
    });

    expect(gtag).toHaveBeenCalledWith('event', 'household_calculated', {
      country_id: 'uk',
      household_count: 2,
      people_count: 3,
      non_default_inputs: 4,
      duration_ms: 1235,
      success: true,
    });
  });

  test('given a failed household run then its category is sent', () => {
    trackHouseholdCalculated({
      countryId: 'us',
      householdCount: 1,
      peopleCount: 1,
      nonDefaultInputs: 0,
      durationMs: 10,
      success: false,
      errorCategory: 'timeout',
    });

    expect(gtag.mock.calls[0][2]).toMatchObject({ success: false, error_category: 'timeout' });
  });

  test('given a variable added then the model name, source and entity are sent', () => {
    trackHouseholdVariableAdded({
      countryId: 'us',
      variable: 'pre_subsidy_rent',
      source: 'search',
      entity: 'group',
    });

    expect(gtag).toHaveBeenCalledWith('event', 'household_variable_added', {
      country_id: 'us',
      variable: 'pre_subsidy_rent',
      source: 'search',
      entity: 'group',
    });
  });

  test('given a run started then the region kind is sent, not the region', () => {
    trackReportRunStarted({
      countryId: 'us',
      regionKind: regionKindOf('congressional_district/CA-12', 'us'),
      yearsInWindow: 10,
      provisionCount: 3,
      baseline: 'saved_reform',
    });

    expect(gtag).toHaveBeenCalledWith('event', 'report_run_started', {
      country_id: 'us',
      region_kind: 'district',
      years_in_window: 10,
      provision_count: 3,
      baseline: 'saved_reform',
    });
  });
});

describe('regionKindOf', () => {
  test.each([
    [undefined, 'us', 'national'],
    ['', 'us', 'national'],
    ['us', 'us', 'national'],
    ['uk', 'uk', 'national'],
    ['state/ca', 'us', 'state'],
    ['congressional_district/CA-12', 'us', 'district'],
    ['place/NY-51000', 'us', 'place'],
    ['country/scotland', 'uk', 'country'],
    ['constituency/Bedford', 'uk', 'constituency'],
    ['local_authority/Bedford', 'uk', 'local_authority'],
    ['something/else', 'us', 'other'],
  ])('given %s in %s then the kind is %s', (region, countryId, kind) => {
    expect(regionKindOf(region, countryId)).toBe(kind);
  });
});

describe('householdErrorCategory', () => {
  test('given a failed fetch then the category is network', () => {
    expect(householdErrorCategory(new TypeError('Failed to fetch'))).toBe('network');
    expect(
      householdErrorCategory(new Error('Could not reach PolicyEngine.', { cause: new TypeError() }))
    ).toBe('network');
  });

  test('given a timeout then the category is timeout', () => {
    expect(householdErrorCategory(new Error('The calculation took too long.'))).toBe('timeout');
  });

  test('given a result without net income then the category is invalid_result', () => {
    expect(householdErrorCategory(new Error('The result has no net income for 2026.'))).toBe(
      'invalid_result'
    );
  });

  test('given anything else then the category is other', () => {
    expect(householdErrorCategory(new Error('Household calculation failed'))).toBe('other');
    expect(householdErrorCategory('boom')).toBe('other');
  });
});
