import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiReformStore, type NewReform } from '@/api/reformStore';
import {
  isAccountUnavailableError,
  resetReformSyncState,
  ResilientReformStore,
  SYNC_INTERVAL_MS,
} from '@/api/resilientReformStore';
import { V2ApiError } from '@/api/v2UserClient';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  errorResponse,
  fetchCall,
  itemResponse,
  pageResponse,
  policyItem,
} from '@/tests/fixtures/api/v2UserMocks';

const ACCOUNT_KEY = 'account:auth0|pavel-test';
const OTHER_ACCOUNT_KEY = 'account:auth0|someone-else';
const MATERIALIZED_POLICY_ID = 95762;
const QUEUE_KEY = `reforms-pending-sync:${ACCOUNT_KEY}`;

const CTC_PARAMETERS = [
  {
    name: 'gov.irs.credits.ctc.amount.base[0]',
    values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
  },
];
const POLICY_JSON = {
  'gov.irs.credits.ctc.amount.base[0]': { '2026-01-01.2100-12-31': 3600 },
};

const NEW_REFORM: NewReform = {
  countryId: 'us',
  label: 'CTC to $3,600',
  parameters: CTC_PARAMETERS,
  baseline: 'current-law',
  provenance: { source: 'manual' },
};

const ACCOUNT_ROW = policyItem({
  id: ASSOCIATION_IDS.REFORM,
  legacy_policy_id: MATERIALIZED_POLICY_ID,
  name: 'CTC to $3,600',
  baseline: 'current-law',
  provenance: { source: 'manual', ref: null, confidence: null },
});

const OTHER_ROW = policyItem({
  id: '11111111-2222-4333-8444-555555555555',
  legacy_policy_id: 777,
  name: 'Something else',
  baseline: 'current-law',
  provenance: { source: 'manual', ref: null, confidence: null },
});

const UNAVAILABLE = () => errorResponse(503, 'V2 user persistence is unavailable');

function resilientStore({
  accountKey = ACCOUNT_KEY,
  now = () => Date.now(),
}: { accountKey?: string; now?: () => number } = {}) {
  const { fetchMock, context } = createTestApiContext('us');
  const materializePolicy = vi.fn().mockResolvedValue(MATERIALIZED_POLICY_ID);
  const fetchPolicyJson = vi.fn().mockResolvedValue(POLICY_JSON);
  const onSynced = vi.fn();
  const account = new ApiReformStore(context, { materializePolicy, fetchPolicyJson });
  const store = new ResilientReformStore(account, {
    accountKey,
    countryId: 'us',
    materializePolicy,
    onSynced,
    now,
  });
  return { store, fetchMock, materializePolicy, onSynced };
}

/** The account's answers by method: each route answers what the test sets. */
function routeFetch(
  fetchMock: ReturnType<typeof vi.fn>,
  answers: { list?: () => Response; create?: () => Response; patch?: () => Response }
) {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    if (init.method === 'POST') {
      return (answers.create ?? UNAVAILABLE)();
    }
    if (init.method === 'PATCH') {
      return (answers.patch ?? UNAVAILABLE)();
    }
    return (answers.list ?? UNAVAILABLE)();
  });
}

const posts = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.filter(([, init]) => (init as RequestInit).method === 'POST').length;

describe('isAccountUnavailableError', () => {
  it.each([0, 502, 503, 504])('given HTTP %s then the account is unavailable', (status) => {
    expect(isAccountUnavailableError(new V2ApiError(status, 'x'))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422, 500])('given HTTP %s then it is not', (status) => {
    expect(isAccountUnavailableError(new V2ApiError(status, 'x'))).toBe(false);
  });

  it('given an error from elsewhere (the v1 policy) then it is not', () => {
    expect(isAccountUnavailableError(new Error('Failed to create policy'))).toBe(false);
  });
});

describe('ResilientReformStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetReformSyncState();
  });

  it('given the account answers 503 when a reform is created then it is kept on this device and returned', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});

    // When
    const saved = await store.create(NEW_REFORM);

    // Then: usable as any saved reform, with the v1 policy a run needs
    expect(saved).toMatchObject({
      countryId: 'us',
      label: 'CTC to $3,600',
      parameters: CTC_PARAMETERS,
      policyId: String(MATERIALIZED_POLICY_ID),
      pendingSync: true,
    });
    expect(saved.id).toMatch(/^rf-/);
    expect(saved).not.toHaveProperty('syncAs');
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY)!);
    expect(queue.pending).toHaveLength(1);
    expect(store.hasPendingSync()).toBe(true);
    expect(store.isAccountUnavailable()).toBe(true);
  });

  it('given no answer at all (a network failure) when a reform is created then it is kept on this device', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    // When
    const saved = await store.create(NEW_REFORM);

    // Then
    expect(saved.pendingSync).toBe(true);
  });

  it.each([
    [400, 'The request was not valid.'],
    [401, 'Your session has ended.'],
    [403, 'This account cannot use saved work.'],
    [422, 'Not valid.'],
  ])(
    'given the account refuses with %s when a reform is created then the save still fails',
    async (status, message) => {
      // Given
      const { store, fetchMock } = resilientStore();
      routeFetch(fetchMock, { create: () => errorResponse(status, message) });

      // When / Then
      await expect(store.create(NEW_REFORM)).rejects.toMatchObject({ status });
      expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
    }
  );

  it('given the v1 policy cannot be made then the save fails rather than keeping a reform without one', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = resilientStore();
    routeFetch(fetchMock, {});
    materializePolicy.mockRejectedValue(new Error('Failed to create policy'));

    // When / Then
    await expect(store.create(NEW_REFORM)).rejects.toThrow('Failed to create policy');
  });

  it('given reforms kept on this device then the account list includes them', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    const kept = await store.create({ ...NEW_REFORM, label: 'Kept here' });
    // The account is back, but refuses new rows for now: nothing syncs.
    routeFetch(fetchMock, {
      list: () => pageResponse([OTHER_ROW]),
      create: () => errorResponse(422, 'Not valid.'),
    });

    // When
    const listed = await store.findMine('us');

    // Then
    expect(listed.map((reform) => reform.id).sort()).toEqual([kept.id, OTHER_ROW.id].sort());
    expect(listed.find((reform) => reform.id === kept.id)?.pendingSync).toBe(true);
    expect(store.isAccountUnavailable()).toBe(false);
  });

  it('given the list answers 503 then it holds only this device’s reforms and says it may be incomplete', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    const kept = await store.create(NEW_REFORM);

    // When
    const listed = await store.findMine('us');

    // Then
    expect(listed.map((reform) => reform.id)).toEqual([kept.id]);
    expect(store.isAccountUnavailable()).toBe(true);
  });

  it('given the list is refused (401) then it is still an error', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, { list: () => errorResponse(401, 'Your session has ended.') });

    // When / Then
    await expect(store.findMine('us')).rejects.toMatchObject({ status: 401 });
  });

  it('given the account is back then a sync pushes the reform once, links the device ID and clears the queue', async () => {
    // Given
    const { store, fetchMock, onSynced } = resilientStore();
    routeFetch(fetchMock, {});
    const kept = await store.create(NEW_REFORM);
    routeFetch(fetchMock, {
      list: () => pageResponse([]),
      create: () => itemResponse(ACCOUNT_ROW, 201),
    });
    fetchMock.mockClear();

    // When
    const synced = await store.sync();
    const again = await store.sync();

    // Then
    expect(synced).toBe(1);
    expect(again).toBe(0);
    expect(posts(fetchMock)).toBe(1);
    const created = fetchMock.mock.calls.findIndex(
      ([, init]) => (init as RequestInit).method === 'POST'
    );
    expect(fetchCall(fetchMock, created).body).toMatchObject({
      legacy_policy_id: MATERIALIZED_POLICY_ID,
      name: 'CTC to $3,600',
    });
    expect(onSynced).toHaveBeenCalledWith([{ deviceId: kept.id, accountId: ACCOUNT_ROW.id }]);
    expect(store.hasPendingSync()).toBe(false);
    // The device ID still opens the reform, now the account's.
    routeFetch(fetchMock, { list: () => itemResponse(ACCOUNT_ROW) });
    expect((await store.findById(kept.id!))?.id).toBe(ACCOUNT_ROW.id);
  });

  it('given the account already holds a matching reform then the sync links it without creating another', async () => {
    // Given: the first save reached the account, but its answer was lost
    const { store, fetchMock, onSynced } = resilientStore();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const kept = await store.create(NEW_REFORM);
    routeFetch(fetchMock, {
      list: () => pageResponse([ACCOUNT_ROW]),
      create: () => itemResponse(ACCOUNT_ROW, 201),
    });
    fetchMock.mockClear();

    // When
    const listed = await store.findMine('us');
    await store.sync();

    // Then: listed once, and no second row
    expect(listed.map((reform) => reform.id)).toEqual([ACCOUNT_ROW.id]);
    expect(posts(fetchMock)).toBe(0);
    expect(onSynced).toHaveBeenCalledWith([{ deviceId: kept.id, accountId: ACCOUNT_ROW.id }]);
    expect(store.hasPendingSync()).toBe(false);
  });

  it('given a list that reaches the account then it starts the sync with that list', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    await store.create(NEW_REFORM);
    routeFetch(fetchMock, {
      list: () => pageResponse([]),
      create: () => itemResponse(ACCOUNT_ROW, 201),
    });
    fetchMock.mockClear();

    // When
    await store.findMine('us');

    // Then
    await vi.waitFor(() => expect(store.hasPendingSync()).toBe(false));
    expect(posts(fetchMock)).toBe(1);
  });

  it('given two syncs at once then the reform is pushed once', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    await store.create(NEW_REFORM);
    routeFetch(fetchMock, {
      list: () => pageResponse([]),
      create: () => itemResponse(ACCOUNT_ROW, 201),
    });
    fetchMock.mockClear();

    // When
    await Promise.all([store.sync(), store.sync(), resilientStore().store.sync()]);

    // Then
    expect(posts(fetchMock)).toBe(1);
  });

  it('given the account is still unavailable then the sync keeps the queue', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    await store.create(NEW_REFORM);

    // When
    const synced = await store.sync();

    // Then
    expect(synced).toBe(0);
    expect(store.hasPendingSync()).toBe(true);
  });

  it('given the account refuses a pushed reform then it stays on this device and is not sent again', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    await store.create(NEW_REFORM);
    routeFetch(fetchMock, {
      list: () => pageResponse([]),
      create: () => errorResponse(422, 'Not valid.'),
    });
    fetchMock.mockClear();

    // When
    await store.sync();
    await store.sync();

    // Then
    expect(posts(fetchMock)).toBe(1);
    expect(store.hasPendingSync()).toBe(false);
    routeFetch(fetchMock, { list: UNAVAILABLE });
    expect((await store.findMine('us'))[0].pendingSync).toBe(true);
  });

  it('given a recent attempt then a background retry waits a minute', async () => {
    // Given
    let clock = 1_000_000;
    const { store, fetchMock } = resilientStore({ now: () => clock });
    routeFetch(fetchMock, {});
    await store.create(NEW_REFORM);
    await store.sync();
    fetchMock.mockClear();

    // When
    await store.syncIfDue();
    clock += SYNC_INTERVAL_MS;
    await store.syncIfDue();

    // Then: the first waits, the second tries
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('given a reform kept on this device then changes to it stay here until the sync', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    const kept = await store.create(NEW_REFORM);

    // When
    const renamed = await store.update(kept.id!, { label: 'Renamed' });

    // Then: the account was not asked to change a device ID
    expect(renamed).toMatchObject({ id: kept.id, label: 'Renamed', pendingSync: true });
    expect(fetchMock.mock.calls.some(([, init]) => init.method === 'PATCH')).toBe(false);
    expect((await store.findById(kept.id!))?.label).toBe('Renamed');
  });

  it('given an account reform changed while the account is unavailable then the change is sent when it is back', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    const changed = await store.update(ACCOUNT_ROW.id, { label: 'Renamed' });
    expect(changed).toMatchObject({ id: ACCOUNT_ROW.id, label: 'Renamed', pendingSync: true });
    routeFetch(fetchMock, {
      list: () => pageResponse([ACCOUNT_ROW]),
      patch: () => itemResponse({ ...ACCOUNT_ROW, name: 'Renamed' }),
    });

    // When
    const listed = await store.findMine('us');

    // Then: listed with the change, then patched
    expect(listed[0]).toMatchObject({ id: ACCOUNT_ROW.id, label: 'Renamed', pendingSync: true });
    await vi.waitFor(() => expect(store.hasPendingSync()).toBe(false));
    const patch = fetchMock.mock.calls.findIndex(([, init]) => init.method === 'PATCH');
    expect(fetchCall(fetchMock, patch).body).toEqual({ name: 'Renamed' });
  });

  it('given a reform kept on this device when deleted then it leaves the queue without asking the account', async () => {
    // Given
    const { store, fetchMock } = resilientStore();
    routeFetch(fetchMock, {});
    const kept = await store.create(NEW_REFORM);
    fetchMock.mockClear();

    // When
    await store.delete(kept.id!);

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.hasPendingSync()).toBe(false);
  });

  it('given another account on this browser then it does not see this account’s queue', async () => {
    // Given
    const mine = resilientStore();
    routeFetch(mine.fetchMock, {});
    await mine.store.create(NEW_REFORM);

    // When
    const theirs = resilientStore({ accountKey: OTHER_ACCOUNT_KEY });
    routeFetch(theirs.fetchMock, {});
    const listed = await theirs.store.findMine('us');

    // Then
    expect(listed).toEqual([]);
    expect(theirs.store.hasPendingSync()).toBe(false);
  });
});
