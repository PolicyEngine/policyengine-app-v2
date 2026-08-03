import { describe, expect, it } from 'vitest';
import {
  buildParameterSearchEntries,
  createParameterSearchIndex,
  searchParameters,
} from '@/libs/parameterSearch';
import US_METADATA from '@/mocks/US_Metadata.json';

const SMALL_COLLECTION = {
  'gov.irs': { type: 'parameterNode', parameter: 'gov.irs', label: 'IRS' },
  'gov.irs.credits': { type: 'parameterNode', parameter: 'gov.irs.credits', label: 'credits' },
  'gov.irs.credits.ctc': {
    type: 'parameterNode',
    parameter: 'gov.irs.credits.ctc',
    label: 'child tax credit',
  },
  'gov.irs.credits.ctc.amount': {
    type: 'parameter',
    parameter: 'gov.irs.credits.ctc.amount',
    label: 'amount',
    unit: 'currency-USD',
    description: 'Base CTC amount per child',
    economy: true,
    household: true,
  },
  'gov.taxsim.thing': {
    type: 'parameter',
    parameter: 'gov.taxsim.thing',
    label: 'taxsim thing',
    economy: true,
    household: true,
  },
  'gov.abolitions.ctc': {
    type: 'parameter',
    parameter: 'gov.abolitions.ctc',
    label: 'abolish ctc',
    economy: true,
    household: true,
  },
  'gov.hidden.param': {
    type: 'parameter',
    parameter: 'gov.hidden.param',
    label: 'hidden',
    economy: false,
    household: false,
  },
} as any;

describe('buildParameterSearchEntries', () => {
  it('given a collection then entries carry full hierarchical breadcrumbs', () => {
    const entries = buildParameterSearchEntries(SMALL_COLLECTION);

    const ctc = entries.find((e) => e.path === 'gov.irs.credits.ctc.amount');
    expect(ctc?.breadcrumb).toBe('IRS → Credits → Child tax credit → Amount');
    expect(ctc?.unit).toBe('currency-USD');
  });

  it('given excluded and non-simulatable parameters then they are not indexed', () => {
    const entries = buildParameterSearchEntries(SMALL_COLLECTION);
    const paths = entries.map((e) => e.path);

    expect(paths).not.toContain('gov.taxsim.thing');
    expect(paths).not.toContain('gov.abolitions.ctc');
    expect(paths).not.toContain('gov.hidden.param');
    expect(paths).not.toContain('gov.irs.credits.ctc'); // nodes are not leaves
  });
});

describe('searchParameters', () => {
  const entries = buildParameterSearchEntries(SMALL_COLLECTION);
  const index = createParameterSearchIndex(entries);

  it('given a multi-word query spanning breadcrumb levels then the parameter is found', () => {
    const results = searchParameters(index, 'child tax credit amount');
    expect(results[0]?.path).toBe('gov.irs.credits.ctc.amount');
  });

  it('given a one-character query then no results are returned', () => {
    expect(searchParameters(index, 'c')).toEqual([]);
  });

  it('given a blank query then no results are returned', () => {
    expect(searchParameters(index, '   ')).toEqual([]);
  });
});

describe('search quality against real US metadata (52k parameters)', () => {
  const parameters = (US_METADATA as any).result.parameters;
  const entries = buildParameterSearchEntries(parameters);
  const index = createParameterSearchIndex(entries);

  it('given the full metadata then tens of thousands of parameters are indexed', () => {
    expect(entries.length).toBeGreaterThan(10000);
  });

  it.each([
    ['child tax credit amount', 'ctc'],
    ['earned income credit maximum', 'eitc'],
    ['snap', 'snap'],
    ['standard deduction', 'standard'],
    ['ssi', 'ssi'],
  ])('given the query "%s" then a matching path appears in the top results', (query, fragment) => {
    const results = searchParameters(index, query, 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.path.toLowerCase().includes(fragment))).toBe(true);
  });

  it('given a typo ("chid tax credit") then the CTC still surfaces', () => {
    const results = searchParameters(index, 'chid tax credit', 10);
    expect(results.some((r) => r.path.includes('ctc'))).toBe(true);
  });

  it('given the limit then no more than that many results return', () => {
    expect(searchParameters(index, 'tax', 5)).toHaveLength(5);
  });

  it('given a common multi-word query then the fast path answers in as-you-type latency', () => {
    searchParameters(index, 'child tax'); // warm up
    const start = performance.now();
    searchParameters(index, 'child tax credit amount');
    const elapsed = performance.now() - start;

    // Full fuzzy scan over 52k entries took ~1300ms; the token prefilter
    // must keep the common case well under typeahead latency. Generous
    // bound to stay CI-safe while still catching a full-scan regression.
    expect(elapsed).toBeLessThan(500);
  });
});
