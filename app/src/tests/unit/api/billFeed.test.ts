import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  billRunYear,
  changesFromTrackerProvisions,
  fetchTrackerBills,
  provisionsFromReformParams,
} from '@/api/billFeed';
import { CURRENT_YEAR } from '@/constants';

describe('provisionsFromReformParams', () => {
  test('given dated value maps then each path keeps its dates and its value', () => {
    const provisions = provisionsFromReformParams({
      'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 2500 },
      'gov.usda.snap.max_allotment': 300,
    });

    expect(provisions).toEqual([
      {
        path: 'gov.irs.credits.ctc.amount.base[0].amount',
        value: 2500,
        intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
      },
      { path: 'gov.usda.snap.max_allotment', value: 300 },
    ]);
  });

  test('given a bare year or a lone start date then it runs from that day on', () => {
    const provisions = provisionsFromReformParams({
      'gov.states.ut.tax.income.rate': { '2026': 0.0445 },
      'gov.states.ks.tax.income.credits.eitc_fraction': { '2026-01-01': 0.18 },
    });

    expect(provisions.map((provision) => provision.intervals)).toEqual([
      [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0.0445 }],
      [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0.18 }],
    ]);
  });

  test('given a phased change then every year is kept and the value is the run year’s', () => {
    const [provision] = provisionsFromReformParams({
      'gov.states.ca.tax.income.credits.young_child.ineligible_age': {
        '2027-01-01.2027-12-31': 8,
        '2026-01-01.2026-12-31': 7,
        '2028-01-01.2100-12-31': 9,
      },
    });

    expect(provision.value).toBe(7);
    expect(provision.intervals?.map((interval) => interval.value)).toEqual([7, 8, 9]);
  });

  test('given a bill from a later year then its value is the one from its first year', () => {
    const [provision] = provisionsFromReformParams({
      'gov.states.va.tax.income.deductions.standard.JOINT': {
        '2027-01-01.2027-12-31': 20000,
        '2028-01-01.2100-12-31': 21000,
      },
    });

    expect(provision.value).toBe(20000);
  });

  test('given a model change turned on by name then its switch is added', () => {
    const provisions = provisionsFromReformParams({
      _use_reform: 'ut_hb210',
      _skip_params: [],
      'gov.states.ut.tax.income.credits.ctc.reduction.start.SINGLE': {
        '2026-01-01.2100-12-31': 27000,
      },
    });

    expect(provisions[1]).toEqual({
      path: 'gov.contrib.states.ut.hb210.in_effect',
      value: true,
      intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: true }],
    });
  });

  test('given a model change whose switch is already set then none is added', () => {
    const provisions = provisionsFromReformParams({
      _use_reform: 'ny_a06774_enhanced_cdcc',
      'gov.contrib.states.ny.a06774.in_effect': { '2025-01-01.2100-12-31': true },
    });

    expect(provisions.map((provision) => provision.path)).toEqual([
      'gov.contrib.states.ny.a06774.in_effect',
    ]);
  });

  test('given the tracker’s run settings and scale paths then only model parameters remain', () => {
    const provisions = provisionsFromReformParams({
      _skip_params: [],
      'gov.states.ny.tax.income.main.single.brackets[7].rate': { '2026-01-01.2100-12-31': 0.108 },
    });

    expect(provisions.map((provision) => provision.path)).toEqual([
      'gov.states.ny.tax.income.main.single[7].rate',
    ]);
  });

  test('given baseline params then each provision keeps the law it was compared with', () => {
    const [rate] = provisionsFromReformParams(
      { 'gov.states.ga.tax.income.main.flat_rate': { '2026-01-01.2026-12-31': 0.0499 } },
      { 'gov.states.ga.tax.income.main.flat_rate': { '2026-01-01.2026-12-31': 0.0509 } }
    );

    expect(rate.baselineIntervals).toEqual([
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 0.0509 },
    ]);
  });

  test('given baseline params under the tracker’s scale paths then they still match', () => {
    const [rate] = provisionsFromReformParams(
      {
        'gov.states.ny.tax.income.main.single.brackets[7].rate': { '2026-01-01.2100-12-31': 0.108 },
      },
      { 'gov.states.ny.tax.income.main.single.brackets[7].rate': 0.103 }
    );

    expect(rate.baselineIntervals?.[0].value).toBe(0.103);
  });

  test('given null or malformed params then no provisions are invented', () => {
    expect(provisionsFromReformParams(null)).toEqual([]);
    expect(provisionsFromReformParams('not-an-object')).toEqual([]);
  });
});

describe('billRunYear', () => {
  const dated = (startDate: string) => ({
    intervals: [{ startDate, endDate: '2100-12-31', value: 1 }],
  });

  test('given a bill in effect now or earlier then it runs this year', () => {
    expect(billRunYear([dated('2025-01-01'), dated('2027-01-01')])).toBe(Number(CURRENT_YEAR));
    expect(billRunYear([{}])).toBe(Number(CURRENT_YEAR));
  });

  test('given a bill that starts later then it runs in its first year', () => {
    expect(billRunYear([dated('2028-01-01'), dated('2027-01-01')])).toBe(2027);
  });
});

describe('changesFromTrackerProvisions', () => {
  const ENTRY = {
    label: 'Georgia Income Tax Rate',
    baseline: '5.09%',
    reform: '4.19%',
    parameter: null,
    explanation: 'Reduces the flat rate for tax year 2026.',
    bill_section: 'Section 1',
  };

  test('given the tracker write-up then each change keeps its label, before, and after', () => {
    expect(changesFromTrackerProvisions([ENTRY])).toEqual([
      {
        label: 'Georgia Income Tax Rate',
        before: '5.09%',
        after: '4.19%',
        explanation: 'Reduces the flat rate for tax year 2026.',
        section: 'Section 1',
      },
    ]);
  });

  test('given the write-up stored as JSON then it reads the same', () => {
    expect(changesFromTrackerProvisions(JSON.stringify([ENTRY]))).toHaveLength(1);
  });

  test('given entries without a label or a value then they drop', () => {
    expect(
      changesFromTrackerProvisions([
        { ...ENTRY, label: '' },
        { ...ENTRY, baseline: null },
        { ...ENTRY, explanation: undefined, bill_section: null },
      ])
    ).toEqual([{ label: 'Georgia Income Tax Rate', before: '5.09%', after: '4.19%' }]);
  });

  test('given an empty or malformed write-up then no changes are invented', () => {
    expect(changesFromTrackerProvisions('[]')).toEqual([]);
    expect(changesFromTrackerProvisions('not json')).toEqual([]);
    expect(changesFromTrackerProvisions(null)).toEqual([]);
  });
});

describe('fetchTrackerBills', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('given no tracker env config then the feed reports unconfigured', async () => {
    expect(await fetchTrackerBills()).toBeNull();
  });

  test('given a configured feed then research, impacts, and status join into bills', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');

    const responses: Record<string, any[]> = {
      research: [
        {
          id: 'ut-sb60',
          state: 'UT',
          title: 'UT SB60: income tax rate cut',
          description: 'Reduces the income tax rate.',
          key_findings: ['Costs state $120.0M annually'],
        },
      ],
      reform_impacts: [
        {
          id: 'ut-sb60',
          computed: true,
          reform_params: {
            'gov.states.ut.tax.income.rate': { '2026-01-01.2100-12-31': 0.0445 },
          },
          provisions: [{ label: 'Utah income tax rate', baseline: '4.55%', reform: '4.45%' }],
          budgetary_impact: { stateRevenueImpact: -120000000, netCost: -120000000 },
          poverty_impact: { baselineRate: 0.11, reformRate: 0.108, percentChange: -1.8 },
        },
      ],
      processed_bills: [
        {
          state: 'UT',
          bill_number: 'SB 60',
          status: 'Enacted',
          legiscan_url: 'https://legiscan.com/UT/bill/SB0060',
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        return {
          ok: true,
          json: async () => responses[table] ?? [],
        };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills).toHaveLength(1);
    expect(bills![0]).toMatchObject({
      id: 'ut-sb60',
      countryId: 'us',
      jurisdiction: 'Utah',
      title: 'UT SB60: income tax rate cut',
      status: 'Enacted',
      summary: 'Reduces the income tax rate.',
      provisions: [{ path: 'gov.states.ut.tax.income.rate', value: 0.0445 }],
      changes: [{ label: 'Utah income tax rate', before: '4.55%', after: '4.45%' }],
      keyFindings: ['Costs state $120.0M annually'],
      legiscanUrl: 'https://legiscan.com/UT/bill/SB0060',
      impacts: { revenue: -120000000, povertyPercentChange: -1.8 },
    });
  });

  test('given federal and state bills then only state bills carry a state code', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');

    const responses: Record<string, any[]> = {
      research: [
        { id: 'us-hr1425', state: 'US', title: 'HR 1425' },
        { id: 'dc-b26', state: 'dc', title: 'DC B26' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        return { ok: true, json: async () => responses[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills!.map((bill) => [bill.id, bill.state])).toEqual([
      ['us-hr1425', undefined],
      ['dc-b26', 'DC'],
    ]);
  });

  test('given dashboards, tools, and blog posts then only reforms to score are listed', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const rows: Record<string, any[]> = {
      research: [
        { id: 'ut-hb290', type: 'bill', state: 'UT', title: 'UT HB 290' },
        { id: 'obbba-explorer', type: 'dashboard', state: 'US', title: 'OBBBA Household Explorer' },
        { id: 'nc-myfriendben', type: 'tool', state: 'NC', title: 'MyFriendBen' },
        { id: 'ut-sb60', type: 'blog', state: 'UT', title: 'Utah SB60' },
        { id: 'la-flat-tax', type: 'blog', state: 'LA', title: 'Louisiana flat tax' },
      ],
      reform_impacts: [
        { id: 'ut-hb290', reform_params: { 'gov.states.ut.tax.income.rate': 0.0445 } },
        { id: 'ut-sb60', reform_params: { 'gov.states.ut.tax.income.rate': 0.0445 } },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        return { ok: true, json: async () => rows[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    // A blog post with a reform to score stays; one without it is prose only.
    expect(bills!.map((bill) => bill.id)).toEqual(['ut-hb290', 'ut-sb60']);
  });

  test('given the tracker stores baseline params then the bills carry them', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const reform = {
      'gov.states.ga.tax.income.main.flat_rate': { '2026-01-01.2026-12-31': 0.0499 },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        const rows: Record<string, any[]> = {
          research: [{ id: 'ga-hb463-2026', state: 'GA', title: 'GA HB 463' }],
          reform_impacts: String(url).includes('baseline_params')
            ? [
                {
                  id: 'ga-hb463-2026',
                  baseline_params: {
                    'gov.states.ga.tax.income.main.flat_rate': { '2026-01-01.2026-12-31': 0.0509 },
                  },
                },
              ]
            : [{ id: 'ga-hb463-2026', reform_params: reform }],
        };
        return { ok: true, json: async () => rows[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills![0].provisions[0].baselineIntervals?.[0].value).toBe(0.0509);
  });

  test('given the tracker has no baseline params column yet then the feed still loads', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('baseline_params')) {
          // PostgREST refuses a missing column with a 400.
          return { ok: false, status: 400, json: async () => ({}) };
        }
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        const rows: Record<string, any[]> = {
          research: [{ id: 'ut-sb60', state: 'UT', title: 'UT SB60' }],
          reform_impacts: [
            { id: 'ut-sb60', reform_params: { 'gov.states.ut.tax.income.rate': 0.0445 } },
          ],
        };
        return { ok: true, json: async () => rows[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills![0].provisions).toEqual([
      { path: 'gov.states.ut.tax.income.rate', value: 0.0445 },
    ]);
  });

  test('given the model run moved past the validation snapshot then drift is flagged', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');

    const responses: Record<string, any[]> = {
      research: [{ id: 'ut-sb60', state: 'UT', title: 'UT SB60' }],
      reform_impacts: [
        {
          id: 'ut-sb60',
          computed: true,
          budgetary_impact: { stateRevenueImpact: -130000000 },
          policyengine_us_version: '1.600.0',
        },
      ],
      validation_metadata: [
        {
          id: 'ut-sb60',
          pe_estimate: -120000000,
          fiscal_note_estimate: -118000000,
          within_range: true,
          validated_against: { pe_estimate: -120000000, model_version: '1.584.0' },
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        return { ok: true, json: async () => responses[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills![0].validation?.drift).toEqual({
      stale: true,
      reasons: [
        'the model estimate has changed since validation',
        'the analysis was recomputed with policyengine-us 1.600.0 (validated against 1.584.0)',
      ],
    });
  });

  test('given the current run matches the validation snapshot then no drift is flagged', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');

    const responses: Record<string, any[]> = {
      research: [{ id: 'ut-sb60', state: 'UT', title: 'UT SB60' }],
      reform_impacts: [
        {
          id: 'ut-sb60',
          computed: true,
          budgetary_impact: { stateRevenueImpact: -120000000 },
          policyengine_us_version: '1.584.0',
        },
      ],
      validation_metadata: [
        {
          id: 'ut-sb60',
          pe_estimate: -120000000,
          fiscal_note_estimate: -118000000,
          within_range: true,
          validated_against: { pe_estimate: -120000000, model_version: '1.584.0' },
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
        return { ok: true, json: async () => responses[table] ?? [] };
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills![0].validation?.withinRange).toBe(true);
    expect(bills![0].validation?.drift).toBeUndefined();
  });
});
