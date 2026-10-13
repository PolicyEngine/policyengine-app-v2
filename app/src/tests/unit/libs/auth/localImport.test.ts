import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readImportedIdMap, readImportSkipped, resolveImportedId } from '@/libs/auth/importedIds';
import {
  chunkImportItems,
  countImportableItems,
  declineImport,
  forgetImportState,
  isImportDeclined,
  LOCAL_STORAGE_KEYS,
  planLocalImport,
  runLocalImport,
  type PlannedImportItem,
} from '@/libs/auth/localImport';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  okResponse,
  OTHER_PE_USER_ID,
  PE_USER_ID,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  LOCAL_IDS,
  localReformUS,
  PROVISION,
  seedLocalData,
  seedManySimulations,
  V1_IDS,
} from '@/tests/fixtures/libs/auth/localImportMocks';

const ACCOUNT_IDS: Record<string, string> = {
  [LOCAL_IDS.POLICY_US]: 'a0000000-0000-4000-8000-000000000001',
  [LOCAL_IDS.REFORM_US]: 'a0000000-0000-4000-8000-000000000002',
  [LOCAL_IDS.SIMULATION_US]: 'a0000000-0000-4000-8000-000000000003',
  [LOCAL_IDS.REPORT_US]: 'a0000000-0000-4000-8000-000000000004',
  [LOCAL_IDS.FLAGSHIP_ALONE]: 'a0000000-0000-4000-8000-000000000005',
  [LOCAL_IDS.HOUSEHOLD_UK]: 'a0000000-0000-4000-8000-000000000006',
  [LOCAL_IDS.REPORT_UK]: 'a0000000-0000-4000-8000-000000000007',
};

/** Answers each import with an id_map for every client_ref it was sent. */
function importResponder(skip: Record<string, string> = {}) {
  return async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const refs = Object.values(body)
      .flat()
      .map((item: any) => item.client_ref as string);
    return okResponse({
      id_map: Object.fromEntries(
        refs.filter((ref) => !skip[ref]).map((ref) => [ref, ACCOUNT_IDS[ref] ?? `uuid-${ref}`])
      ),
      skipped: refs
        .filter((ref) => skip[ref])
        .map((ref) => ({ client_ref: ref, reason: skip[ref] })),
    });
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('planLocalImport', () => {
  test('given items from several countries then only US and UK are planned and the rest reported', () => {
    // Given
    seedLocalData();

    // When
    const plan = planLocalImport(PE_USER_ID);

    // Then
    expect(plan.items.map((item) => [item.countryId, item.clientRef])).toEqual([
      ['us', LOCAL_IDS.POLICY_US],
      ['us', LOCAL_IDS.REFORM_US],
      ['uk', LOCAL_IDS.HOUSEHOLD_UK],
      ['us', LOCAL_IDS.SIMULATION_US],
      ['us', LOCAL_IDS.REPORT_US],
      ['uk', LOCAL_IDS.REPORT_UK],
      ['us', LOCAL_IDS.FLAGSHIP_ALONE],
    ]);
    expect(plan.unsupported.map((note) => [note.countryId, note.clientRef])).toEqual([
      ['ca', LOCAL_IDS.POLICY_CA],
      ['ng', LOCAL_IDS.REFORM_NG],
    ]);
    expect(plan.invalid.map((note) => note.clientRef)).toEqual([LOCAL_IDS.POLICY_INVALID]);
  });

  test('given a flagship run then its association, record and provenance become one report', () => {
    // Given
    seedLocalData();

    // When
    const report = planLocalImport(PE_USER_ID).items.find(
      (item) => item.clientRef === LOCAL_IDS.REPORT_US
    );

    // Then
    expect(report?.aliases).toEqual([LOCAL_IDS.FLAGSHIP_MERGED]);
    expect(report?.body).toEqual({
      client_ref: LOCAL_IDS.REPORT_US,
      legacy_report_id: Number(V1_IDS.REPORT_US),
      name: 'CTC to $2,500',
      description: null,
      user_policy_client_ref: LOCAL_IDS.REFORM_US,
      source_note: 'Hand-built draft',
      provisions: [
        {
          path: PROVISION.path,
          breadcrumb: PROVISION.breadcrumb,
          unit: PROVISION.unit,
          baseline_value: PROVISION.baselineValue,
          value: PROVISION.value,
          intervals: null,
        },
      ],
      validation: null,
      last_run_at: null,
    });
  });

  test('given a flagship record alone then its provenance stash fills the provisions', () => {
    // Given
    seedLocalData();

    // When
    const report = planLocalImport(PE_USER_ID).items.find(
      (item) => item.clientRef === LOCAL_IDS.FLAGSHIP_ALONE
    );

    // Then
    expect(report?.body).toMatchObject({
      legacy_report_id: Number(V1_IDS.REPORT_FLAGSHIP_ALONE),
      name: 'Bill report',
      source_note: 'Utah · Introduced',
      provisions: [expect.objectContaining({ path: PROVISION.path })],
    });
  });

  test('given a reform without a v1 policy then it is planned for materialization', () => {
    // Given
    seedLocalData();

    // When
    const reform = planLocalImport(PE_USER_ID).items.find(
      (item) => item.clientRef === LOCAL_IDS.REFORM_US
    );

    // Then
    expect(reform?.reform).toEqual(localReformUS);
    expect(reform?.body).toMatchObject({
      baseline: 'current-law',
      provenance: { source: 'manual', ref: null, confidence: null },
    });
  });
});

describe('chunkImportItems', () => {
  const item = (index: number): PlannedImportItem => ({
    kind: 'simulations',
    countryId: 'us',
    clientRef: `sus-${index}`,
    aliases: [],
    body: {
      client_ref: `sus-${index}`,
      legacy_simulation_id: index + 1,
      name: null,
      description: null,
    },
  });

  test('given 1201 items then requests hold at most 500 each, in order', () => {
    const items = Array.from({ length: 1201 }, (_, index) => item(index));

    const chunks = chunkImportItems(items);

    expect(chunks.map((chunk) => chunk.length)).toEqual([500, 500, 201]);
    expect(chunks.flat()).toEqual(items);
  });

  test('given large items then requests also stay under the byte limit', () => {
    const items = Array.from({ length: 10 }, (_, index) => item(index));
    const size = new TextEncoder().encode(JSON.stringify(items[0].body)).length + 1;

    const chunks = chunkImportItems(items, { maxBytes: size * 3 });

    expect(chunks.map((chunk) => chunk.length)).toEqual([3, 3, 3, 1]);
  });
});

describe('runLocalImport', () => {
  test('given saved work then it is imported per country, with reforms materialized first', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());
    const materialize = vi.fn().mockResolvedValue(V1_IDS.MATERIALIZED_REFORM);

    // When
    const summary = await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize,
    });

    // Then
    expect(materialize).toHaveBeenCalledWith(localReformUS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const us = fetchCall(fetchMock, 0);
    expect(us.path).toBe('/v2/me/imports');
    expect(us.query).toEqual({ country_id: 'us' });
    expect(Object.keys(us.body)).toEqual(['policies', 'simulations', 'reports']);
    expect(us.body.policies[1]).toMatchObject({
      client_ref: LOCAL_IDS.REFORM_US,
      legacy_policy_id: V1_IDS.MATERIALIZED_REFORM,
    });
    expect(JSON.stringify(us.body)).not.toContain('user_id');
    const uk = fetchCall(fetchMock, 1);
    expect(uk.query).toEqual({ country_id: 'uk' });
    expect(uk.body).toEqual({
      households: [expect.objectContaining({ client_ref: LOCAL_IDS.HOUSEHOLD_UK })],
      reports: [expect.objectContaining({ client_ref: LOCAL_IDS.REPORT_UK })],
    });
    expect(summary).toMatchObject({ imported: 7, failed: [], skipped: [] });
    expect(summary.unsupported).toHaveLength(2);
    expect(summary.invalid).toHaveLength(1);
  });

  test('given an import then the id_map is kept so old local links resolve, aliases included', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());

    // When
    await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // Then
    expect(resolveImportedId(PE_USER_ID, LOCAL_IDS.REPORT_US)).toBe(
      ACCOUNT_IDS[LOCAL_IDS.REPORT_US]
    );
    expect(resolveImportedId(PE_USER_ID, LOCAL_IDS.FLAGSHIP_MERGED)).toBe(
      ACCOUNT_IDS[LOCAL_IDS.REPORT_US]
    );
    expect(resolveImportedId('someone-else', LOCAL_IDS.REPORT_US)).toBeNull();
    expect(countImportableItems(PE_USER_ID)).toBe(0);
  });

  test('given an import then nothing is removed from this device', async () => {
    // Given
    seedLocalData();
    const before = Object.values(LOCAL_STORAGE_KEYS).map((key) => localStorage.getItem(key));
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());

    // When
    await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // Then
    expect(Object.values(LOCAL_STORAGE_KEYS).map((key) => localStorage.getItem(key))).toEqual(
      before
    );
  });

  test('given skipped items then they are recorded and not offered again', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(
      importResponder({ [LOCAL_IDS.SIMULATION_US]: 'unknown_legacy_reference' })
    );

    // When
    const summary = await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // Then
    expect(summary.skipped).toEqual([
      {
        kind: 'simulations',
        clientRef: LOCAL_IDS.SIMULATION_US,
        countryId: 'us',
        reason: 'unknown_legacy_reference',
      },
    ]);
    expect(readImportSkipped(PE_USER_ID)).toEqual({
      [LOCAL_IDS.SIMULATION_US]: 'unknown_legacy_reference',
    });
    expect(countImportableItems(PE_USER_ID)).toBe(0);
  });

  test('given an item the server skipped without naming it then it is recorded as invalid', async () => {
    // Given: the server could not parse the simulation, so its skip has no client_ref
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    const respond = importResponder();
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      const response = await respond(url, init);
      const payload = await response.json();
      delete payload.result.id_map[LOCAL_IDS.SIMULATION_US];
      payload.result.skipped.push({ client_ref: null, reason: 'invalid' });
      return okResponse(payload.result);
    });

    // When
    const summary = await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // Then: it counts once, is not pending any more, and no "null" ref is kept
    expect(summary.skipped).toEqual([
      {
        kind: 'simulations',
        clientRef: LOCAL_IDS.SIMULATION_US,
        countryId: 'us',
        reason: 'invalid',
      },
    ]);
    expect(readImportSkipped(PE_USER_ID)).toEqual({ [LOCAL_IDS.SIMULATION_US]: 'invalid' });
    expect(countImportableItems(PE_USER_ID)).toBe(0);
  });

  test('given an item missing from both id_map and skipped then it is not offered again', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    const respond = importResponder();
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      const response = await respond(url, init);
      const payload = await response.json();
      delete payload.result.id_map[LOCAL_IDS.POLICY_US];
      return okResponse(payload.result);
    });

    // When
    const summary = await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // Then
    expect(summary.skipped.map((note) => note.clientRef)).toEqual([LOCAL_IDS.POLICY_US]);
    expect(countImportableItems(PE_USER_ID)).toBe(0);
  });

  test('given more than 500 items then they go in several requests', async () => {
    // Given
    seedManySimulations(600);
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());

    // When
    const summary = await runLocalImport({ client: context.client, userId: PE_USER_ID });

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchCall(fetchMock, 0).body.simulations).toHaveLength(500);
    expect(fetchCall(fetchMock, 1).body.simulations).toHaveLength(100);
    expect(summary.imported).toBe(600);
  });

  test('given a failed request then its items are reported and left for a retry', async () => {
    // Given
    seedManySimulations(600);
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockImplementationOnce(importResponder())
      .mockImplementationOnce(async () => errorResponse(503, 'Database unavailable'));

    // When
    const summary = await runLocalImport({ client: context.client, userId: PE_USER_ID });

    // Then
    expect(summary.imported).toBe(500);
    expect(summary.failed).toHaveLength(100);
    expect(Object.keys(readImportedIdMap(PE_USER_ID))).toHaveLength(500);
    expect(countImportableItems(PE_USER_ID)).toBe(100);
  });

  test('given a reform that cannot be materialized then reports drop their link to it', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());

    // When
    const summary = await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => {
        throw new Error('Failed to create policy');
      },
    });

    // Then
    expect(summary.failed).toEqual([
      expect.objectContaining({
        clientRef: LOCAL_IDS.REFORM_US,
        reason: 'Failed to create policy',
      }),
    ]);
    const report = fetchCall(fetchMock, 0).body.reports.find(
      (item: any) => item.client_ref === LOCAL_IDS.REPORT_US
    );
    expect(report.user_policy_client_ref).toBeNull();
    expect(countImportableItems(PE_USER_ID)).toBe(1);
  });
});

describe('import bookkeeping', () => {
  test('given "not now" then the prompt is declined for that user only', () => {
    declineImport(PE_USER_ID);

    expect(isImportDeclined(PE_USER_ID)).toBe(true);
    expect(isImportDeclined('someone-else')).toBe(false);
  });

  test('given a deleted account then its bookkeeping is forgotten', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());
    await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });
    declineImport(PE_USER_ID);

    // When
    forgetImportState(PE_USER_ID);

    // Then
    expect(readImportedIdMap(PE_USER_ID)).toEqual({});
    expect(isImportDeclined(PE_USER_ID)).toBe(false);
  });

  test('given one account imported this browser then a second person signing in is not offered those items', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());
    await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // When
    const plan = planLocalImport(OTHER_PE_USER_ID);

    // Then: nothing of the first account's is offered, and its links do not resolve
    expect(plan.items).toEqual([]);
    expect(readImportedIdMap(OTHER_PE_USER_ID)).toEqual({});
    expect(resolveImportedId(OTHER_PE_USER_ID, LOCAL_IDS.REPORT_US)).toBeNull();
  });

  test('given the importing account was deleted then its items can be offered again', async () => {
    // Given
    seedLocalData();
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockImplementation(importResponder());
    await runLocalImport({
      client: context.client,
      userId: PE_USER_ID,
      materialize: async () => V1_IDS.MATERIALIZED_REFORM,
    });

    // When
    forgetImportState(PE_USER_ID);

    // Then
    expect(countImportableItems(OTHER_PE_USER_ID)).toBe(7);
  });
});
