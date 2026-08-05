import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchTrackerBills, provisionsFromReformParams } from '@/api/billFeed';

describe('provisionsFromReformParams', () => {
  test('given dated value maps then the first value is taken per path', () => {
    const provisions = provisionsFromReformParams({
      'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 2500 },
      'gov.usda.snap.max_allotment': 300,
    });

    expect(provisions).toEqual([
      { path: 'gov.irs.credits.ctc.amount.base[0].amount', value: 2500 },
      { path: 'gov.usda.snap.max_allotment', value: 300 },
    ]);
  });

  test('given null or malformed params then no provisions are invented', () => {
    expect(provisionsFromReformParams(null)).toEqual([]);
    expect(provisionsFromReformParams('not-an-object')).toEqual([]);
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
      keyFindings: ['Costs state $120.0M annually'],
      legiscanUrl: 'https://legiscan.com/UT/bill/SB0060',
    });
  });
});
