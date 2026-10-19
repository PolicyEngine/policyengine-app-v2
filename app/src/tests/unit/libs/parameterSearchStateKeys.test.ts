import { describe, expect, test } from 'vitest';
import {
  buildParameterSearchEntries,
  buildStateNames,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  searchParameters,
} from '@/libs/parameterSearch';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const parameter = (path: string, label: string) => ({
  parameter: path,
  label,
  type: 'parameter',
  unit: 'currency-USD',
  economy: true,
  household: true,
  values: { '2020-01-01': 100 },
});
const node = (path: string, label: string) => ({ parameter: path, label, type: 'parameterNode' });

const PARAMETERS = {
  'gov.states.mt': node('gov.states.mt', 'Montana'),
  'gov.states.vt': node('gov.states.vt', 'Vermont'),
  'gov.states.mn': node('gov.states.mn', 'Minnesota'),
  'gov.usda.snap': node('gov.usda.snap', 'Supplemental Nutrition Assistance Program (SNAP)'),
  'gov.usda.snap.child_support': node(
    'gov.usda.snap.child_support',
    'SNAP child support deduction'
  ),
  'gov.usda.snap.child_support.MT': parameter('gov.usda.snap.child_support.MT', 'MT'),
  'gov.usda.snap.child_support.VT': parameter('gov.usda.snap.child_support.VT', 'VT'),
  'gov.usda.snap.child_support.MN': parameter('gov.usda.snap.child_support.MN', 'MN'),
  'gov.usda.snap.min_allotment.rate': parameter(
    'gov.usda.snap.min_allotment.rate',
    'SNAP minimum allotment rate'
  ),
  'gov.states.mt.dhs.tanf.max_unit_size': parameter(
    'gov.states.mt.dhs.tanf.max_unit_size',
    'Montana TANF maximum unit size'
  ),
} as unknown as ParameterMetadataCollection;

describe('state-keyed federal parameters', () => {
  const entries = buildParameterSearchEntries(PARAMETERS);
  const index = createParameterSearchIndex(entries, [], new Map(), buildStateNames(PARAMETERS));

  test("given a federal program's value for a state then it carries that state", () => {
    expect(
      entries.find((entry) => entry.path === 'gov.usda.snap.child_support.MT')?.stateCode
    ).toBe('mt');
  });

  test('given a state and a federal program then that state’s value of the program leads', () => {
    const paths = searchParameters(index, 'montana snap', 5, DEFAULT_SEARCH_FILTERS).map(
      (entry) => entry.path
    );
    expect(paths[0]).toBe('gov.usda.snap.child_support.MT');
    // Another state's value of it comes after, if at all.
    expect(paths.indexOf('gov.usda.snap.child_support.VT')).not.toBe(0);
  });

  test('given the jurisdiction filter then a state keeps its values and Federal leaves them out', () => {
    const paths = (stateScope: string) =>
      searchParameters(index, 'snap', 10, { ...DEFAULT_SEARCH_FILTERS, stateScope }).map(
        (entry) => entry.path
      );
    expect(paths('mt')).toEqual(['gov.usda.snap.child_support.MT']);
    expect(paths('mn')).toEqual(['gov.usda.snap.child_support.MN']);
    expect(paths('federal')).not.toContain('gov.usda.snap.child_support.MT');
    expect(paths('federal')).not.toContain('gov.usda.snap.child_support.VT');
  });

  test('given all jurisdictions then a federal parameter’s values by state are one result', () => {
    const found = searchParameters(index, 'snap child support', 10, DEFAULT_SEARCH_FILTERS);
    const breakdowns = found.filter((entry) =>
      entry.path.startsWith('gov.usda.snap.child_support')
    );
    expect(breakdowns).toHaveLength(1);
    expect(breakdowns[0]).toMatchObject({
      breakdownPath: 'gov.usda.snap.child_support',
      jurisdictionCount: 3,
      stateCode: null,
      label: 'SNAP child support deduction',
    });
    expect(breakdowns[0].breadcrumb).not.toMatch(/→ (MT|VT|MN)$/);
  });

  test('given a word that starts like a state then that state’s values do not match', () => {
    const paths = searchParameters(index, 'snap minimum', 10, DEFAULT_SEARCH_FILTERS, {
      fuzzyFallback: false,
    }).map((entry) => entry.path);
    expect(paths).toEqual(['gov.usda.snap.min_allotment.rate']);
  });
});
