import { describe, expect, it } from 'vitest';
import {
  buildParameterSearchEntries,
  countHiddenByFilters,
  createParameterSearchIndex,
  groupSearchResults,
  listStateCodes,
  ParameterSearchEntry,
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

describe('groupSearchResults', () => {
  const entry = (path: string, breadcrumb: string): ParameterSearchEntry => ({
    path,
    label: breadcrumb.split(' → ').pop() ?? path,
    breadcrumb,
    unit: null,
    description: null,
    isContrib: false,
    stateCode: null,
  });

  it('given results sharing a folder then they cluster under it, folders before standalones', () => {
    const groups = groupSearchResults([
      entry('gov.a.solo', 'A → Solo'),
      entry('gov.b.ctc.amount', 'B → CTC → Amount'),
      entry('gov.b.ctc.phase_out', 'B → CTC → Phase-out'),
      entry('gov.c.other', 'C → Other'),
    ]);

    expect(groups[0].folder).toBe('B → CTC');
    expect(groups[0].entries.map((e) => e.path)).toEqual([
      'gov.b.ctc.amount',
      'gov.b.ctc.phase_out',
    ]);
    expect(groups[1].entries[0].path).toBe('gov.a.solo');
    expect(groups[2].entries[0].path).toBe('gov.c.other');
  });

  it('given only singleton results then every group is standalone in rank order', () => {
    const groups = groupSearchResults([entry('gov.a.x', 'A → X'), entry('gov.b.y', 'B → Y')]);

    expect(groups.map((g) => g.entries.length)).toEqual([1, 1]);
    expect(groups[0].entries[0].path).toBe('gov.a.x');
  });

  it('given no results then no groups return', () => {
    expect(groupSearchResults([])).toEqual([]);
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

  it('given the entries then contrib and state parameters are tagged', () => {
    const contribEntry = entries.find((e) => e.path.startsWith('gov.contrib.'));
    const stateEntry = entries.find((e) => e.path.startsWith('gov.states.ca.'));

    expect(contribEntry?.isContrib).toBe(true);
    expect(stateEntry?.stateCode).toBe('ca');
    expect(listStateCodes(entries).length).toBeGreaterThan(40);
  });

  it('given default filters then contributed parameters never surface', () => {
    const results = searchParameters(index, 'ctc additional bracket', 10);
    expect(results.every((r) => !r.isContrib)).toBe(true);
  });

  it('given contributed opted in then contributed parameters can surface', () => {
    const results = searchParameters(index, 'ctc additional bracket', 10, {
      includeContrib: true,
      stateScope: 'all',
    });
    expect(results.some((r) => r.isContrib)).toBe(true);
  });

  it('given federal-only scope then a generic query returns no state parameters', () => {
    const results = searchParameters(index, 'income tax rate', 10, {
      includeContrib: false,
      stateScope: 'federal',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.stateCode === null)).toBe(true);
  });

  it('given a single-state scope then other states are excluded but that state matches', () => {
    const results = searchParameters(index, 'income tax rate', 20, {
      includeContrib: false,
      stateScope: 'ut',
    });
    expect(results.every((r) => r.stateCode === null || r.stateCode === 'ut')).toBe(true);
  });

  it('given filters hiding matches then countHiddenByFilters reports them', () => {
    const hidden = countHiddenByFilters(index, 'ctc additional bracket threshold', 10, {
      includeContrib: false,
      stateScope: 'all',
    });
    expect(hidden).toBeGreaterThan(0);
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

describe('derived ranking priors', () => {
  const PRIOR_COLLECTION = {
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
      economy: true,
      household: true,
    },
    'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount': {
      type: 'parameter',
      parameter: 'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount',
      label: 'amount',
      unit: 'currency-USD',
      economy: true,
      household: true,
    },
  } as any;
  const priorIndex = createParameterSearchIndex(buildParameterSearchEntries(PRIOR_COLLECTION));

  it('given a conversational question then coverage matching still finds the parameter', () => {
    const results = searchParameters(
      priorIndex,
      'why does the child tax credit amount phase out',
      5
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].path).toContain('gov.irs.credits.ctc');
  });

  it('given an acronym only in the path then it still matches', () => {
    const results = searchParameters(priorIndex, 'ctc amount', 5);
    expect(results[0].path).toContain('gov.irs.credits.ctc');
  });

  it('given equal matches then the shallow canonical parameter outranks the bracketed internal', () => {
    const results = searchParameters(priorIndex, 'child tax credit amount', 5);
    expect(results[0].path).toBe('gov.irs.credits.ctc.amount');
  });

  it('given live usage then the used parameter floats above unused siblings', async () => {
    const { registerUsagePaths, resetUsagePaths } = await import('@/libs/searchPriors');
    resetUsagePaths();
    registerUsagePaths([
      'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount',
      'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount',
      'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount',
      'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount',
    ]);

    const results = searchParameters(priorIndex, 'child tax credit amount', 5);
    expect(results[0].path).toBe(
      'gov.irs.credits.ctc.phase_out.arpa.threshold.deep.amount[3].amount'
    );

    resetUsagePaths();
  });
});
