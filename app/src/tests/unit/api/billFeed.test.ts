import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  billRunYear,
  changesFromTrackerProvisions,
  fetchTrackerBillDistricts,
  fetchTrackerBills,
  provisionsFromReformParams,
  UNTRACKED_BILL_STATUS,
} from '@/api/billFeed';
import { CURRENT_YEAR } from '@/constants';
import {
  mockTrackerFetch,
  NET_COST_DRIFT_ROWS,
  NET_COST_ONLY_ROWS,
  TRACKER_NAMING_ROWS,
} from '@/tests/fixtures/api/billFeedMocks';
import { TRACKER_HOME } from '@/tests/fixtures/libs/flagship/billTrackerMocks';

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

  test('given a named parameter then it is kept in the model’s path form', () => {
    const [change] = changesFromTrackerProvisions([
      { ...ENTRY, parameter: 'gov.states.ny.tax.income.main.{filing_status}.brackets[7].rate' },
    ]);

    expect(change.parameter).toBe('gov.states.ny.tax.income.main.{filing_status}[7].rate');
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

describe('fetchTrackerBillDistricts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('given stored districts then they read in the API breakdown shape, for that bill only', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const fetchMock = vi.fn(async (_url: string) => ({
      ok: true,
      json: async () => [
        {
          district_impacts: {
            'KS-1': { avgBenefit: 5, winnersShare: 0.04, losersShare: 0, districtName: 'CD 1' },
            'KS-12': { avgBenefit: -2.5 },
            bogus: { avgBenefit: 1 },
          },
        },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const districts = await fetchTrackerBillDistricts('ks-hb2620');

    expect(String(fetchMock.mock.calls[0][0])).toContain('id=eq.ks-hb2620');
    expect(districts).toEqual([
      {
        district: 'KS-01',
        average_household_income_change: 5,
        winner_percentage: 0.04,
        loser_percentage: 0,
      },
      { district: 'KS-12', average_household_income_change: -2.5 },
    ]);
  });

  test('given no stored districts then there are none', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [{ district_impacts: null }] }))
    );

    expect(await fetchTrackerBillDistricts('us-hr1425')).toBeNull();
  });
});

describe('tracker reads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('given more rows than one request returns then the feed reads every page', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    // The bill-status table: 1,418 rows, served 1,000 at a time.
    const statuses = Array.from({ length: 1418 }, (_, index) => ({
      bill_id: index,
      state: 'UT',
      bill_number: `HB${index}`,
      status: 'Introduced',
    }));
    statuses[1417] = { bill_id: 1417, state: 'UT', bill_number: 'HB210', status: 'Signed' };
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const table = new URL(url).pathname.split('/').pop();
      const offset = Number(params.get('offset') ?? 0);
      const all: any[] =
        table === 'processed_bills'
          ? statuses
          : table === 'research'
            ? [{ id: 'ut-hb210', state: 'UT', type: 'bill', status: 'published', title: 'HB 210' }]
            : [];
      const page = all.slice(offset, offset + 1000);
      return {
        ok: true,
        headers: new Headers({
          'content-range': `${offset}-${offset + page.length - 1}/${all.length}`,
        }),
        json: async () => page,
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const bills = await fetchTrackerBills();

    // The bill's status row is past the first 1,000.
    expect(bills?.[0].status).toBe('Signed');
    const statusReads = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/processed_bills?')
    );
    expect(statusReads.map(([url]) => new URL(String(url)).searchParams.get('offset'))).toEqual([
      '0',
      '1000',
    ]);
  });

  test('given pages read without an order repeat rows then every row still reads once', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const statuses = Array.from({ length: 1418 }, (_, index) => ({
      bill_id: index,
      state: 'UT',
      bill_number: `HB${index}`,
      status: 'Introduced',
    }));
    statuses[1417] = {
      bill_id: 1417,
      state: 'WV',
      bill_number: 'SB392',
      status: 'Signed into Law',
    };
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const table = new URL(url).pathname.split('/').pop();
      const offset = Number(params.get('offset') ?? 0);
      const all: any[] =
        table === 'processed_bills'
          ? statuses
          : table === 'research'
            ? [{ id: 'wv-sb392', state: 'WV', type: 'bill', status: 'published', title: 'SB 392' }]
            : [];
      // Without an order the database picks any row order per request, as
      // seen live: page 2 repeats rows 582-999 of page 1 and skips the rest.
      const page =
        params.get('order') || offset === 0
          ? all.slice(offset, offset + 1000)
          : all.slice(offset - 418, offset);
      return {
        ok: true,
        headers: new Headers({
          'content-range': `${offset}-${offset + page.length - 1}/${all.length}`,
        }),
        json: async () => page,
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const bills = await fetchTrackerBills();

    expect(bills?.[0].status).toBe('Signed into Law');
    // Every paged read names a stable order.
    for (const [url] of fetchMock.mock.calls) {
      expect(new URL(String(url)).searchParams.get('order')).toBeTruthy();
    }
  });

  test('given two status rows for one bill number then the latest action wins', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal(
      'fetch',
      mockTrackerFetch({
        research: [{ id: 'mi-hb4170', state: 'MI', type: 'bill', title: 'MI HB 4170' }],
        processed_bills: [
          {
            bill_id: 9,
            state: 'MI',
            bill_number: 'HB 4170',
            status: 'Passed',
            last_action_date: '2026-06-10',
          },
          {
            bill_id: 3,
            state: 'MI',
            bill_number: 'HB4170',
            status: 'Passed One Chamber',
            last_action_date: '2026-03-02',
          },
        ],
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills?.[0].status).toBe('Passed');
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

  test('given dashboards, tools, and blog posts then only bills are listed', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const rows: Record<string, any[]> = {
      research: [
        { id: 'ut-hb290', type: 'bill', state: 'UT', title: 'UT HB 290' },
        { id: 'ga-hb111', type: ' Bill ', state: 'GA', title: 'GA HB 111' },
        { id: 'obbba-explorer', type: 'dashboard', state: 'US', title: 'OBBBA Household Explorer' },
        { id: 'nc-myfriendben', type: 'tool', state: 'NC', title: 'MyFriendBen' },
        { id: 'ut-sb60', type: 'blog', state: 'UT', title: 'Utah SB60' },
        { id: 'la-flat-tax', type: 'Blog', state: 'LA', title: 'Louisiana flat tax' },
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

    // A blog post is a write-up, even one that carries a reform to score;
    // the type reads without case or spacing.
    expect(bills!.map((bill) => bill.id)).toEqual(['ut-hb290', 'ga-hb111']);
  });

  test('given an analysis still in review then it is not listed', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const rows: Record<string, any[]> = {
      research: [
        { id: 'ut-hb290', type: 'bill', status: 'published', state: 'UT', title: 'UT HB 290' },
        { id: 'ga-hb111', type: 'bill', status: 'in_review', state: 'GA', title: 'GA HB 111' },
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

    expect(bills!.map((bill) => bill.id)).toEqual(['ut-hb290']);
  });

  test('given bill numbers written apart then each bill finds its tracked status', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    const rows: Record<string, any[]> = {
      research: [
        // Leading zeros, as LegiScan writes them.
        { id: 'ut-sb60', type: 'bill', state: 'UT', title: 'UT SB 60' },
        // A dash inside the bill number.
        { id: 'ny-s-4487', type: 'bill', state: 'NY', title: 'NY S 4487' },
        // A trailing session year.
        { id: 'ga-hb463-2026', type: 'bill', state: 'GA', title: 'GA HB 463' },
        // The LegiScan link wins over the id.
        { id: 'ks-hb2620', type: 'bill', state: 'KS', title: 'KS HB 2620', legiscan_bill_id: 77 },
        // No row in processed_bills.
        { id: 'ok-hb1', type: 'bill', state: 'OK', title: 'OK HB 1' },
      ],
      processed_bills: [
        { bill_id: 11, state: 'UT', bill_number: 'SB0060', status: 'Signed into Law' },
        { bill_id: 22, state: 'NY', bill_number: 'S 4487', status: 'In Committee' },
        { bill_id: 33, state: 'GA', bill_number: 'HB 463', status: 'Vetoed' },
        {
          bill_id: 77,
          state: 'KS',
          bill_number: 'HB 2620',
          status: 'Signed into Law',
          legiscan_url: 'https://legiscan.com/KS/bill/HB2620/2026',
        },
        // An earlier session's bill of the same number, last in the list.
        { bill_id: 44, state: 'KS', bill_number: 'HB 2620', status: 'Introduced' },
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

    expect(bills!.map((bill) => [bill.id, bill.status])).toEqual([
      ['ut-sb60', 'Signed into Law'],
      ['ny-s-4487', 'In Committee'],
      ['ga-hb463-2026', 'Vetoed'],
      ['ks-hb2620', 'Signed into Law'],
      ['ok-hb1', UNTRACKED_BILL_STATUS],
    ]);
    expect(bills![3].legiscanUrl).toBe('https://legiscan.com/KS/bill/HB2620/2026');
  });

  test('given an id with words after the bill number then the stage joins by the bill number', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal(
      'fetch',
      mockTrackerFetch({
        research: [
          // The title names the bill, as the tracker reads it.
          {
            id: 'hi-sb3125-hd1',
            type: 'bill',
            state: 'HI',
            title: 'Hawaii SB3125 HD1: tax relief',
          },
          {
            id: 'nj-a1185-marriage-penalty-elimination',
            type: 'bill',
            state: 'NJ',
            title: 'New Jersey A1185: Marriage penalty elimination',
          },
          // No bill number in the title: the id's first token names it.
          { id: 'ut-sb60-bill', type: 'bill', state: 'UT', title: 'Income tax rate reduction' },
          // A number in the title that names no bill of the state.
          { id: 'ok-tax-2026', type: 'bill', state: 'OK', title: 'Oklahoma FY 2026 tax plan' },
        ],
        processed_bills: [
          { bill_id: 1, state: 'HI', bill_number: 'SB3125', status: 'Passed Both Chambers' },
          { bill_id: 2, state: 'NJ', bill_number: 'A1185', status: 'In Committee' },
          { bill_id: 3, state: 'UT', bill_number: 'SB0060', status: 'Signed into Law' },
          // The same number in another state is not this bill.
          { bill_id: 4, state: 'UT', bill_number: 'A1185', status: 'Vetoed' },
        ],
      })
    );

    const bills = await fetchTrackerBills();

    expect(bills!.map((bill) => [bill.id, bill.status])).toEqual([
      ['hi-sb3125-hd1', 'Passed Both Chambers'],
      ['nj-a1185-marriage-penalty-elimination', 'In Committee'],
      ['ut-sb60-bill', 'Signed into Law'],
      ['ok-tax-2026', UNTRACKED_BILL_STATUS],
    ]);
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

  test('given tracker rows then each bill carries the tracker place, name and page', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', mockTrackerFetch(TRACKER_NAMING_ROWS));

    const bills = await fetchTrackerBills();

    expect(bills!.map((bill) => [bill.jurisdiction, bill.title, bill.trackerUrl])).toEqual([
      ['Federal', 'HR 1425', `${TRACKER_HOME}/us/us-hr1425`],
      ['Federal', 'HR 7024', `${TRACKER_HOME}/us/us-hr7024`],
      ['District of Columbia', 'DC B26', `${TRACKER_HOME}/dc/dc-b26`],
      ['Utah', 'HB-106', `${TRACKER_HOME}/ut/ut-hb-106`],
    ]);
  });

  test('given only a net cost then it reads as the revenue change, as in the tracker', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', mockTrackerFetch(NET_COST_ONLY_ROWS));

    const bills = await fetchTrackerBills();

    expect(bills![0].impacts?.revenue).toBe(-74_200_000);
  });

  test('given only a net cost that moved since validation then drift is flagged', async () => {
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL', 'https://tracker.example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', mockTrackerFetch(NET_COST_DRIFT_ROWS));

    const bills = await fetchTrackerBills();

    expect(bills![0].validation?.drift).toEqual({
      stale: true,
      reasons: ['the model estimate has changed since validation'],
    });
  });
});
