import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { LocalStorageReformStore } from '@/api/reformStore';
import { MOCK_USER_ID } from '@/constants';
import {
  dismissAccountImportNotice,
  IMPORT_FAILURE_MESSAGE,
  importBrowserWork,
  importSuccessMessage,
  runAccountCreationImport,
  useAccountImportNotice,
} from '@/libs/auth/accountImport';
import { saveReportMeta } from '@/libs/flagship/runReport';
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

/** A US reform run as a report, a saved UK reform, and a Canada reform (not imported). */
async function seedBrowserWork() {
  const reforms = new LocalStorageReformStore();
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

/** Answers each import with an id_map entry for every client_ref it was sent. */
async function acceptEverything(_url: string, init: RequestInit) {
  const body = JSON.parse(String(init.body));
  const refs = [...(body.policies ?? []), ...(body.reports ?? [])].map(
    (item: { client_ref: string }) => item.client_ref
  );
  return okResponse({
    id_map: Object.fromEntries(refs.map((ref, index) => [ref, `uuid-${index}-${ref}`])),
    skipped: [],
  });
}

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
    const materialize = vi.fn().mockResolvedValue(MATERIALIZED_POLICY_ID);

    // When
    const outcome = await importBrowserWork({ client: context.client, materialize });

    // Then
    expect(outcome).toEqual({ reformsAdded: 2, reportsAdded: 1, notAdded: 0 });
    expect(materialize).toHaveBeenCalledTimes(1);
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
    await importBrowserWork({ client: context.client, materialize: async () => 1 });

    // Then
    expect([...readKeys].sort()).toEqual(
      ['pe-flagship-report-meta', 'pe-flagship-reports', 'reforms'].sort()
    );
    expect(LEGACY_KEYS.filter((key) => readKeys.has(key))).toEqual([]);
  });

  test('given a reform that cannot get a v1 policy then its report goes without the link', async () => {
    // Given
    const { record } = await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);

    // When
    const outcome = await importBrowserWork({
      client: context.client,
      materialize: async () => {
        throw new Error('Failed to create policy');
      },
    });

    // Then
    expect(outcome.notAdded).toBe(1);
    const report = fetchCall(fetchMock, 0).body.reports[0];
    expect(report).toMatchObject({ client_ref: record.id, user_policy_client_ref: null });
  });
});

describe('runAccountCreationImport', () => {
  test('given it succeeds then the notice says what was added', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(acceptEverything);
    const notice = renderHook(() => useAccountImportNotice());

    // When
    await act(() =>
      runAccountCreationImport({ client: context.client, materialize: async () => 1 })
    );

    // Then
    expect(notice.result.current).toEqual({
      kind: 'success',
      message: 'Added 2 reforms and 1 report saved on this browser to your account.',
      retry: null,
    });
  });

  test('given it fails then the notice says the work is still here, and Try again runs it again', async () => {
    // Given
    await seedBrowserWork();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(errorResponse(503, 'Saved work is temporarily unavailable.'));
    const notice = renderHook(() => useAccountImportNotice());
    await act(() =>
      runAccountCreationImport({ client: context.client, materialize: async () => 1 })
    );
    expect(notice.result.current).toMatchObject({
      kind: 'failure',
      message: IMPORT_FAILURE_MESSAGE,
    });

    // When
    fetchMock.mockImplementation(acceptEverything);
    await act(async () => {
      notice.result.current!.retry!();
      await vi.waitFor(() => expect(notice.result.current?.kind).toBe('success'));
    });

    // Then
    expect(notice.result.current?.message).toMatch(/^Added 2 reforms and 1 report/);
  });

  test('given nothing saved on this browser then nothing is sent and no notice shows', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const notice = renderHook(() => useAccountImportNotice());

    // When
    await act(() => runAccountCreationImport({ client: context.client }));

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
    expect(notice.result.current).toBeNull();
  });
});

describe('importSuccessMessage', () => {
  test('given one of each and items left behind then the wording agrees with the counts', () => {
    expect(importSuccessMessage({ reformsAdded: 1, reportsAdded: 1, notAdded: 1 })).toBe(
      'Added 1 reform and 1 report saved on this browser to your account. 1 item could not be added and is still on this browser.'
    );
  });
});
