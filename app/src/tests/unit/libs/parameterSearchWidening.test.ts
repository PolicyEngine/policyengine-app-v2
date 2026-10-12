import { describe, expect, test } from 'vitest';
import {
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  isDraftableValue,
  ParameterSearchEntry,
  searchParametersWidening,
} from '@/libs/parameterSearch';

const entry = (
  path: string,
  breadcrumb: string,
  stateCode: string | null = null,
  isContrib = false
): ParameterSearchEntry => ({
  path,
  label: breadcrumb.split(' → ').pop()!.toLowerCase(),
  breadcrumb,
  unit: 'currency-USD',
  description: null,
  isContrib,
  stateCode,
});

const ENTRIES = [
  entry('gov.irs.credits.ctc.amount', 'IRS → Credits → Child tax credit → Amount'),
  entry('gov.states.ut.tax.income.credits.ctc.amount', 'Utah → Child tax credit → Amount', 'ut'),
  entry('gov.states.al.sales.rate', 'Alabama → Sales → Rate', 'al'),
  entry('gov.contrib.baby_bonus.amount', 'Contributed → Baby bonus → Amount', null, true),
];

const index = createParameterSearchIndex(ENTRIES);

describe('searchParametersWidening', () => {
  test('given matches under the filters then they come back with those filters', () => {
    const filters = { ...DEFAULT_SEARCH_FILTERS, stateScope: 'ut' };

    const result = searchParametersWidening(index, 'child tax credit', 10, filters);

    expect(result.filters).toBe(filters);
    expect(result.entries.map((e) => e.path)).toEqual([
      'gov.states.ut.tax.income.credits.ctc.amount',
    ]);
  });

  test('given a state with no match then the scope widens to all jurisdictions', () => {
    const filters = { ...DEFAULT_SEARCH_FILTERS, stateScope: 'al' };

    const result = searchParametersWidening(index, 'child tax credit', 10, filters);

    expect(result.filters).toEqual({ ...filters, stateScope: 'all' });
    expect(result.entries.map((e) => e.path)).toContain('gov.irs.credits.ctc.amount');
  });

  test('given only contributed parameters match then contributed ones are included', () => {
    const result = searchParametersWidening(index, 'baby bonus', 10, DEFAULT_SEARCH_FILTERS);

    expect(result.filters).toEqual({ stateScope: 'all', includeContrib: true });
    expect(result.entries.map((e) => e.path)).toEqual(['gov.contrib.baby_bonus.amount']);
  });

  test('given a query too short to search then nothing widens', () => {
    const result = searchParametersWidening(index, 'c', 10, DEFAULT_SEARCH_FILTERS);

    expect(result).toEqual({ entries: [], filters: DEFAULT_SEARCH_FILTERS });
  });
});

describe('isDraftableValue', () => {
  test('given numbers and switches then they can be changed; lists and text cannot', () => {
    expect(isDraftableValue(2200)).toBe(true);
    expect(isDraftableValue('Infinity')).toBe(true);
    expect(isDraftableValue(false)).toBe(true);
    expect(isDraftableValue(['employee_medicare_tax'])).toBe(false);
    expect(isDraftableValue('CITIZEN')).toBe(false);
  });
});
