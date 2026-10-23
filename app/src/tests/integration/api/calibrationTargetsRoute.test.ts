// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  rawGbCarersAllowanceTarget,
  rawScotlandHigherRateTarget,
  rawUkItlTarget,
  rawWalesIncomeTaxTarget,
  UK_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/ukCalibrationMocks';

const US_RELEASE_ID = 'populace-us-2024-spm-20260915';

/** A US target as the dashboard serves it: DC's income tax collections. */
const rawDcTarget = {
  name: 'census_stc.dc_income_tax@2024',
  source: 'census_stc',
  variable: 'state income tax',
  policyengine_variables: ['state_income_tax'],
  measure: 'total',
  level: 'state',
  state: 'DC',
  geography: 'DC',
  period: 2024,
  target: 3_000_000_000,
  final_estimate: 3_300_000_000,
  relative_error: 0.1,
};

const usPage = { release_id: US_RELEASE_ID, has_next: false, targets: [rawDcTarget] };
const ukPage = {
  release_id: UK_RELEASE_ID,
  has_next: false,
  targets: [
    rawWalesIncomeTaxTarget,
    rawUkItlTarget,
    rawScotlandHigherRateTarget,
    rawGbCarersAllowanceTarget,
  ],
};

/** The dashboard: the UK set when asked with country=uk, else the US set. */
function dashboard() {
  return vi.fn(async (url: string) =>
    Response.json(String(url).includes('country=uk') ? ukPage : usPage)
  );
}

const post = (body: unknown) =>
  new Request('http://localhost/api/calibration-targets', {
    method: 'POST',
    body: JSON.stringify(body),
  });

async function loadRoute() {
  return import('../../../../../calculator-app/src/app/api/calibration-targets/route');
}

beforeEach(() => {
  // Each test gets a fresh module, so a fresh per-country cache.
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL', 'true');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('calibration-targets route', () => {
  test('given a US request then the dashboard is asked without a country, as before', async () => {
    const fetchMock = dashboard();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();

    const response = await POST(post({ variables: ['state_income_tax'], geography: 'dc' }));
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/target-diagnostics\?limit=500&offset=0$/);
    expect(data.releaseId).toBe(US_RELEASE_ID);
    expect(data.geography).toBe('DC');
    expect(data.geographies).toBeUndefined();
    expect(data.rows.map((row: { name: string }) => row.name)).toEqual([rawDcTarget.name]);
  });

  test('given a UK request then the dashboard is asked for the UK and the asked areas answer', async () => {
    const fetchMock = dashboard();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();

    const response = await POST(
      post({
        country: 'uk',
        variables: ['income_tax'],
        geography: 'Wales',
        geographies: ['Wales', 'Great Britain', 'United Kingdom'],
      })
    );
    const data = await response.json();

    expect(fetchMock.mock.calls[0][0]).toMatch(/offset=0&country=uk$/);
    expect(data.releaseId).toBe(UK_RELEASE_ID);
    expect(data.geography).toBe('Wales');
    expect(data.geographies).toEqual(['Wales', 'Great Britain', 'United Kingdom']);
    // Scotland's Income Tax target is another nation's; Carer's Allowance was not asked.
    expect(data.rows.map((row: { name: string }) => row.name)).toEqual([
      rawWalesIncomeTaxTarget.name,
      rawUkItlTarget.name,
    ]);
    expect(data.rows[0]).toMatchObject({
      geography: 'Wales',
      level: 'country',
      policyengineVariables: ['income_tax'],
      currency: 'GBP',
    });
  });

  test('given a UK GET then a comma-separated list of areas is read', async () => {
    vi.stubGlobal('fetch', dashboard());
    const { GET } = await loadRoute();

    const response = await GET(
      new Request(
        'http://localhost/api/calibration-targets?country=uk&variables=carers_allowance&geography=United%20Kingdom,Great%20Britain'
      )
    );
    const data = await response.json();

    expect(data.rows.map((row: { name: string }) => row.name)).toEqual([
      rawGbCarersAllowanceTarget.name,
    ]);
  });

  test('given repeat requests then each country is fetched once and cached on its own', async () => {
    const fetchMock = dashboard();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();

    await POST(post({ variables: ['state_income_tax'], geography: 'DC' }));
    await POST(post({ variables: ['state_income_tax'], geography: 'DC' }));
    const uk = await (
      await POST(post({ country: 'uk', variables: ['income_tax'], geography: 'Wales' }))
    ).json();
    await POST(post({ country: 'uk', variables: ['income_tax'], geography: 'Wales' }));
    const us = await (
      await POST(post({ variables: ['state_income_tax'], geography: 'DC' }))
    ).json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(uk.releaseId).toBe(UK_RELEASE_ID);
    expect(us.releaseId).toBe(US_RELEASE_ID);
  });

  test('given a UK nation’s overall fit then all its targets answer', async () => {
    vi.stubGlobal('fetch', dashboard());
    const { POST } = await loadRoute();

    const data = await (
      await POST(post({ country: 'uk', variables: [], geography: 'Scotland', all: true }))
    ).json();

    expect(data.rows.map((row: { name: string }) => row.name)).toEqual([
      rawScotlandHigherRateTarget.name,
    ]);
  });

  test('given a US request with a list of areas then only its one geography is read', async () => {
    vi.stubGlobal('fetch', dashboard());
    const { POST } = await loadRoute();

    const data = await (
      await POST(post({ variables: ['state_income_tax'], geography: 'DC', geographies: ['US'] }))
    ).json();

    expect(data.geography).toBe('DC');
    expect(data.rows).toHaveLength(1);
  });

  test('given an unknown country then the request is refused without a fetch', async () => {
    const fetchMock = dashboard();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();

    const response = await POST(post({ country: 'ca', variables: ['income_tax'] }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given an unavailable dashboard then the UK request errors and is not cached', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValue(Response.json(ukPage));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();

    const failed = await POST(post({ country: 'uk', variables: ['income_tax'] }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const retried = await POST(post({ country: 'uk', variables: ['income_tax'] }));

    expect(failed.status).toBe(502);
    expect(retried.status).toBe(200);
    expect((await retried.json()).geography).toBe('United Kingdom');
  });
});
