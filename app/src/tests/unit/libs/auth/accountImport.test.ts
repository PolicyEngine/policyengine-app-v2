import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { LocalStorageReformStore } from '@/api/reformStore';
import { MOCK_USER_ID } from '@/constants';
import {
  dismissAccountImportNotice,
  importBrowserWork,
  importOutcomeMessage,
  runSignInImport,
  useAccountImportNotice,
} from '@/libs/auth/accountImport';
import { readReportMeta, saveReportMeta } from '@/libs/flagship/runReport';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  okResponse,
} from '@/tests/fixtures/api/v2UserMocks';
import type { Reform } from '@/types/ingredients/Reform';

const LEGACY_KEYS = [
  'user-policy-associations',
  'user-population-households',
  'user-simulation-associations',
  'user-report-associations',
];

const MATERIALIZED_POLICY_ID = 95801;

const REFORM_FIELDS: Omit<Reform, 'id' | 'createdAt' | 'updatedAt' | 'countryId'> = {
  userId: MOCK_USER_ID,
  label: 'CTC expansion',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
};

/** A US reform run as a report, a saved UK reform, and a Canada reform (not moved). */
async function seedBrowserWork() {
  // Saving a reform creates its v1 policy.
  const reforms = new LocalStorageReformStore({
    materializePolicy: async () => MATERIALIZED_POLICY_ID,
  });
  const usReform = await reforms.create({ ...REFORM_FIELDS, countryId: 'us' });
  const ukReform = await reforms.create({
    ...REFORM_FIELDS,
    countryId: 'uk',
    label: 'Personal allowance',
    policyId: '501',
  });
  await reforms.create({ ...REFORM_FIELDS, countryId: 'ca' });
  const record = await new LocalStorageFlagshipReportStore().create({
    userId: MOCK_USER_ID,
    countryId: 'us',
    apiReportId: '615',
    title: null,
    sourceNote: null,
    provisions: [],
    year: '2026',
    reformId: usReform.id,
  });
  saveReportMeta('615', {
    title: 'CTC expansion',
    sourceNote: 'Hand-built draft',
    provisions: [
      {
        path: 'gov.irs.credits.ctc.amount.base[0]',
        breadcrumb: 'CTC',
        unit: null,
        baselineValue: 2000,
        value: 3000,
      },
    ],
    createdAt: '2026-10-13T00:00:00Z',
  });
  return { usReform, ukReform, record };
}

/** Answers each import with an id_map entry for every client_ref it was sent, except `refusedRefs`. */
function acceptAllBut(...refusedRefs: Array<string | undefined>) {
  const refused = new Set(refusedRefs);
  return async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const refs: string[] = [...(body.policies ?? []), ...(body.reports ?? [])].map(
      (item: { client_ref: string }) => item.client_ref
    );
    return okResponse({
      id_map: Object.fromEntries(
        refs.filter((ref) => !refused.has(ref)).map((ref, index) => [ref, `uuid-${index}-${ref}`])
      ),
      skipped: refs
        .filter((ref) => refused.has(ref))
        .map((ref) => ({ client_ref: ref, reason: 'unknown_legacy_reference' })),
    });
  };
}

const acceptEverything = acceptAllBut();

const storedIds = (key: string) =>
  JSON.parse(localStorage.getItem(key) ?? '[]').map((item: { id: string }) => item.id);

beforeEach(() => {
  localStorage.clear();
  act(() => dismissAccountImportNotice());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('importBrowserWork', () => {
  test('given v3 work on this browser then reforms and reports go in per country, linked by client_ref', async () => {
    // Given
    const { usReform, ukReform, record } = await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);

    // When
    const outcome = await importBrowserWork({ client: context.client });

    // Then
    expect(outcome).toEqual({
      reformsMoved: 2,
      reportsMoved: 1,
      leftOnBrowser: 0,
      requestFailed: false,
    });
    const usImport = fetchCall(fetchMock, 0);
    expect(usImport.query).toEqual({ country_id: 'us' });
    expect(usImport.body.policies).toEqual([
      expect.objectContaining({
        client_ref: usReform.id,
        legacy_policy_id: MATERIALIZED_POLICY_ID,
      }),
    ]);
    expect(usImport.body.reports).toEqual([
      expect.objectContaining({
        client_ref: record.id,
        legacy_report_id: 615,
        name: 'CTC expansion',
        source_note: 'Hand-built draft',
        user_policy_client_ref: usReform.id,
      }),
    ]);
    const ukImport = fetchCall(fetchMock, 1);
    expect(ukImport.query).toEqual({ country_id: 'uk' });
    expect(ukImport.body.policies).toEqual([
      expect.objectContaining({ client_ref: ukReform.id, legacy_policy_id: 501 }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('given everything moves then this browser keeps only work outside the US and UK', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);

    // When
    await importBrowserWork({ client: context.client });

    // Then
    const remaining = JSON.parse(localStorage.getItem('reforms') ?? '[]');
    expect(remaining.map((reform: Reform) => reform.countryId)).toEqual(['ca']);
    expect(storedIds('pe-flagship-reports')).toEqual([]);
    expect(readReportMeta('615')).toBeNull();
  });

  test('given the account skips an item then only that item stays, and goes again next time', async () => {
    // Given
    const { usReform, ukReform, record } = await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptAllBut(ukReform.id));

    // When
    const outcome = await importBrowserWork({ client: context.client });

    // Then
    expect(outcome).toMatchObject({ reformsMoved: 1, reportsMoved: 1, leftOnBrowser: 1 });
    expect(storedIds('reforms')).not.toContain(usReform.id);
    expect(storedIds('reforms')).toContain(ukReform.id);
    expect(storedIds('pe-flagship-reports')).not.toContain(record.id);

    // When: the next sign-in
    fetchMock.mockClear();
    fetchMock.mockImplementation(acceptEverything);
    const next = await importBrowserWork({ client: context.client });

    // Then
    expect(next).toMatchObject({ reformsMoved: 1, reportsMoved: 0, leftOnBrowser: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchCall(fetchMock, 0).body.policies).toEqual([
      expect.objectContaining({ client_ref: ukReform.id }),
    ]);
  });

  test('given a request fails then the run stops and only the work already moved is removed', async () => {
    // Given
    const { usReform, ukReform } = await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockImplementationOnce(acceptEverything)
      .mockResolvedValueOnce(errorResponse(503, 'Saved work is temporarily unavailable.'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    const outcome = await importBrowserWork({ client: context.client });

    // Then
    expect(outcome).toEqual({
      reformsMoved: 1,
      reportsMoved: 1,
      leftOnBrowser: 1,
      requestFailed: true,
    });
    expect(storedIds('reforms')).not.toContain(usReform.id);
    expect(storedIds('reforms')).toContain(ukReform.id);
  });

  test('given the sign-in country then its work goes first', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);

    // When
    await importBrowserWork({ client: context.client, firstCountryId: 'uk' });

    // Then
    expect(fetchCall(fetchMock, 0).query).toEqual({ country_id: 'uk' });
    expect(fetchCall(fetchMock, 1).query).toEqual({ country_id: 'us' });
  });

  test('given the import runs then it reads only the v3 keys, never the legacy ones', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);
    const readKeys = new Set<string>();
    const originalGetItem = localStorage.getItem.bind(localStorage);
    vi.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      readKeys.add(key);
      return originalGetItem(key);
    });

    // When
    await importBrowserWork({ client: context.client });

    // Then
    expect([...readKeys].sort()).toEqual(
      ['pe-flagship-report-meta', 'pe-flagship-reports', 'reforms'].sort()
    );
    expect(LEGACY_KEYS.filter((key) => readKeys.has(key))).toEqual([]);
  });

  test('given a reform saved without a v1 policy by an earlier build then it is not sent and stays', async () => {
    // Given
    const { usReform } = await seedBrowserWork();
    const stored = JSON.parse(localStorage.getItem('reforms') ?? '[]');
    localStorage.setItem(
      'reforms',
      JSON.stringify(
        stored.map((reform: Reform) =>
          reform.id === usReform.id ? { ...reform, policyId: null } : reform
        )
      )
    );
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);

    // When
    const outcome = await importBrowserWork({ client: context.client });

    // Then
    expect(outcome).toMatchObject({ reformsMoved: 1, reportsMoved: 1, leftOnBrowser: 0 });
    const sentRefs = [0, 1].flatMap((call) =>
      fetchCall(fetchMock, call).body.policies.map(
        (item: { client_ref: string }) => item.client_ref
      )
    );
    expect(sentRefs).not.toContain(usReform.id);
    expect(storedIds('reforms')).toContain(usReform.id);
  });
});

describe('runSignInImport', () => {
  test('given it succeeds then the notice says what moved', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);
    const notice = renderHook(() => useAccountImportNotice());

    // When
    await act(() => runSignInImport({ client: context.client }));

    // Then
    expect(notice.result.current).toEqual({
      kind: 'success',
      message: 'Moved 2 reforms and 1 report from this browser to your account.',
      retry: null,
    });
  });

  test('given a request fails then the notice says the work is still here, and Try again moves it', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(errorResponse(503, 'Saved work is temporarily unavailable.'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const notice = renderHook(() => useAccountImportNotice());
    await act(() => runSignInImport({ client: context.client }));
    expect(notice.result.current).toMatchObject({
      kind: 'failure',
      message:
        'Your reforms and reports saved on this browser could not be moved to your account. They are still on this browser and will be tried again the next time you sign in.',
    });

    // When
    fetchMock.mockImplementation(acceptEverything);
    await act(async () => {
      notice.result.current!.retry!();
      await vi.waitFor(() => expect(notice.result.current?.kind).toBe('success'));
    });

    // Then
    expect(notice.result.current?.message).toMatch(/^Moved 2 reforms and 1 report/);
  });

  test('given the account skips items then the notice warns, without Try again', async () => {
    // Given
    const { ukReform } = await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptAllBut(ukReform.id));
    const notice = renderHook(() => useAccountImportNotice());

    // When
    await act(() => runSignInImport({ client: context.client }));

    // Then
    expect(notice.result.current).toEqual({
      kind: 'warning',
      message:
        'Moved 1 reform and 1 report from this browser to your account. 1 item is still on this browser and will be tried again the next time you sign in.',
      retry: null,
    });
  });

  test('given nothing saved on this browser then nothing is sent and no notice shows', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const notice = renderHook(() => useAccountImportNotice());

    // When
    await act(() => runSignInImport({ client: context.client }));

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
    expect(notice.result.current).toBeNull();
  });
});

describe('importOutcomeMessage', () => {
  test('given nothing moved and no request failed then the wording agrees with the count', () => {
    expect(
      importOutcomeMessage({
        reformsMoved: 0,
        reportsMoved: 0,
        leftOnBrowser: 2,
        requestFailed: false,
      })
    ).toBe(
      '2 items saved on this browser could not be moved to your account. They are still on this browser and will be tried again the next time you sign in.'
    );
  });
});
