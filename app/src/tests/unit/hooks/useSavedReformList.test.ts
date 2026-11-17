import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ApiReformStore,
  ApiV2ReformStore,
  LocalStorageReformStore,
  type ReformStore,
} from '@/api/reformStore';
import {
  removeMissingReform,
  savedReformListKey,
  writeSavedReform,
} from '@/hooks/useSavedReformList';
import { createTestApiContext } from '@/tests/fixtures/api/v2UserMocks';
import {
  APP_QUERY_STALE_TIME,
  BROWSER_SCOPE,
  EARLIER_REFORM,
  EDITED_EARLIER_REFORM,
  fakeUserPolicies,
  fakeV1PolicyApi,
  fakeV2PolicyApi,
  LATER_REFORM,
  LONGER_THAN_STALE_TIME,
  NEW_REFORM,
  OTHER_ACCOUNT_SCOPE,
  resolveTestParameterIds,
  SAVED_REFORMS,
  SAVED_TIMES,
  twoParameterReformInput,
  V2_TEST_CATALOG,
} from '@/tests/fixtures/hooks/useSavedReformListMocks';
import type { Reform } from '@/types/ingredients/Reform';

const mockCreatePolicy = vi.fn();

// v1 policies are saved through `POST /{country}/policy`.
vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  createPolicy: (...args: unknown[]) => mockCreatePolicy(...args),
}));

const LIST_KEY = savedReformListKey(BROWSER_SCOPE, 'us');

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** The list as something on screen shows it: an observer that reads it while mounted. */
function showList(queryClient: QueryClient, readList: () => Promise<Reform[]>) {
  const observer = new QueryObserver(queryClient, { queryKey: LIST_KEY, queryFn: readList });
  return observer.subscribe(() => {});
}

const listState = (queryClient: QueryClient) => queryClient.getQueryState<Reform[]>(LIST_KEY);

describe('savedReformListKey', () => {
  test('given a session scope and a country then it is the key Your reforms lists them under', () => {
    expect(savedReformListKey(BROWSER_SCOPE, 'us')).toEqual(['reforms', BROWSER_SCOPE, 'us']);
  });
});

describe('writeSavedReform', () => {
  test('given a shown list when a new reform is saved then it joins the list, most recently updated first, and the store is not read again', async () => {
    // Given
    const queryClient = testQueryClient();
    const readList = vi.fn().mockResolvedValue(SAVED_REFORMS);
    const hideList = showList(queryClient, readList);
    await vi.waitFor(() => expect(listState(queryClient)?.status).toBe('success'));

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, LATER_REFORM, EARLIER_REFORM]);
    expect(listState(queryClient)?.fetchStatus).toBe('idle');
    expect(readList).toHaveBeenCalledTimes(1);
    hideList();
  });

  test('given an edited reform then it takes the place of what it was', async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, EDITED_EARLIER_REFORM);

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([EDITED_EARLIER_REFORM, LATER_REFORM]);
  });

  test('given a list read longer ago than the app keeps data fresh then it stays due a read, so showing it next reads changes made elsewhere', async () => {
    // Given: the app's query defaults, and a list read six minutes before the save
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: APP_QUERY_STALE_TIME } },
    });
    const readAt = Date.now() - LONGER_THAN_STALE_TIME;
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS, { updatedAt: readAt });

    // When: the reform is saved, while a reform was deleted elsewhere; then the list shows
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);
    const savedSince = [NEW_REFORM, LATER_REFORM];
    const readList = vi.fn().mockResolvedValue(savedSince);
    expect(listState(queryClient)?.dataUpdatedAt).toBe(readAt);
    const hideList = showList(queryClient, readList);

    // Then
    await vi.waitFor(() => expect(queryClient.getQueryData(LIST_KEY)).toEqual(savedSince));
    expect(readList).toHaveBeenCalledTimes(1);
    hideList();
  });

  test('given a list read within the time the app keeps data fresh then showing it after the save does not read it', async () => {
    // Given
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: APP_QUERY_STALE_TIME } },
    });
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);
    const readList = vi.fn().mockResolvedValue(SAVED_REFORMS);
    const hideList = showList(queryClient, readList);

    // Then
    expect(readList).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    hideList();
  });

  test("given another session's list then it is left as it was", async () => {
    // Given
    const queryClient = testQueryClient();
    const otherSessionKey = savedReformListKey(OTHER_ACCOUNT_SCOPE, 'us');
    queryClient.setQueryData(otherSessionKey, SAVED_REFORMS);
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);

    // Then
    expect(queryClient.getQueryData(otherSessionKey)).toEqual(SAVED_REFORMS);
  });

  test("given another country's reform then this country's list is left as it was", async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, { ...NEW_REFORM, countryId: 'uk' });

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(SAVED_REFORMS);
  });

  test('given no list cached then none is made: whatever shows it next reads the store', async () => {
    // Given
    const queryClient = testQueryClient();

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);

    // Then
    expect(listState(queryClient)).toBeUndefined();
  });

  test('given the list is still loading when the save lands then it is read again, and the read that began first is dropped', async () => {
    // Given: the first read answers only once the save is in, without the new reform
    const queryClient = testQueryClient();
    let finishFirstRead!: (reforms: Reform[]) => void;
    const readList = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<Reform[]>((resolve) => {
          finishFirstRead = resolve;
        })
      )
      .mockResolvedValueOnce([NEW_REFORM, ...SAVED_REFORMS]);
    const hideList = showList(queryClient, readList);
    expect(listState(queryClient)?.fetchStatus).toBe('fetching');

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);
    finishFirstRead(SAVED_REFORMS);

    // Then
    await vi.waitFor(() => expect(listState(queryClient)?.fetchStatus).toBe('idle'));
    expect(readList).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    hideList();
  });

  test('given a shown list being read again when the save lands then the read starts over after the save', async () => {
    // Given: a list shown and being read again (the window regained focus, say)
    const queryClient = testQueryClient();
    let finishSecondRead!: (reforms: Reform[]) => void;
    const readList = vi
      .fn()
      .mockResolvedValueOnce(SAVED_REFORMS)
      .mockReturnValueOnce(
        new Promise<Reform[]>((resolve) => {
          finishSecondRead = resolve;
        })
      )
      .mockResolvedValueOnce([NEW_REFORM, ...SAVED_REFORMS]);
    const hideList = showList(queryClient, readList);
    await vi.waitFor(() => expect(listState(queryClient)?.status).toBe('success'));
    void queryClient.refetchQueries({ queryKey: LIST_KEY });
    expect(listState(queryClient)?.fetchStatus).toBe('fetching');

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);
    finishSecondRead(SAVED_REFORMS);

    // Then
    await vi.waitFor(() => expect(listState(queryClient)?.fetchStatus).toBe('idle'));
    expect(readList).toHaveBeenCalledTimes(3);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    hideList();
  });

  test('given the list failed to load then it is read again', async () => {
    // Given
    const queryClient = testQueryClient();
    const readList = vi
      .fn()
      .mockRejectedValueOnce(new Error('Saved work is temporarily unavailable.'))
      .mockResolvedValueOnce([NEW_REFORM, ...SAVED_REFORMS]);
    const hideList = showList(queryClient, readList);
    await vi.waitFor(() => expect(listState(queryClient)?.status).toBe('error'));

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);

    // Then
    await vi.waitFor(() => expect(listState(queryClient)?.status).toBe('success'));
    expect(readList).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    hideList();
  });

  test('given a list marked to be read again while nothing shows it then it stays marked', async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);
    await queryClient.invalidateQueries({ queryKey: LIST_KEY });

    // When
    await writeSavedReform(queryClient, BROWSER_SCOPE, NEW_REFORM);

    // Then
    expect(listState(queryClient)?.isInvalidated).toBe(true);
  });
});

describe('removeMissingReform', () => {
  test('given a reform the store no longer has then the list drops it', async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await removeMissingReform(queryClient, BROWSER_SCOPE, 'us', EARLIER_REFORM.id!);

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([LATER_REFORM]);
  });

  test('given a reform that was never in the list then the list stays as it was', async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, SAVED_REFORMS);

    // When
    await removeMissingReform(queryClient, BROWSER_SCOPE, 'us', 'rf-saved-elsewhere');

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(SAVED_REFORMS);
  });
});

/**
 * Each store, saving through the real request builders: a v1 policy's
 * parameter map comes from `materializeReformPolicy`, and a v2 policy's
 * values from `v2ReformPolicyBody`. The stores read them back with their
 * own parsers.
 */
const STORES: [string, () => ReformStore][] = [
  [
    'this browser',
    () => {
      const v1Api = fakeV1PolicyApi(95_000);
      mockCreatePolicy.mockImplementation(v1Api.createPolicy);
      return new LocalStorageReformStore({ fetchPolicy: v1Api.fetchPolicy });
    },
  ],
  [
    'the account, on v1 policies',
    () => {
      const v1Api = fakeV1PolicyApi(95_000);
      mockCreatePolicy.mockImplementation(v1Api.createPolicy);
      const { fetchMock, context } = createTestApiContext('us');
      fakeUserPolicies(fetchMock);
      return new ApiReformStore(context, { fetchPolicy: v1Api.fetchPolicy });
    },
  ],
  [
    'the account, on v2 policies',
    () => {
      const { fetchMock, context } = createTestApiContext('us');
      fakeUserPolicies(fetchMock);
      return new ApiV2ReformStore(context, {
        ...fakeV2PolicyApi([
          'a1b2c3d4-0000-4000-8000-000000000001',
          'a1b2c3d4-0000-4000-8000-000000000002',
          'a1b2c3d4-0000-4000-8000-000000000003',
        ]),
        getV2Catalog: () => V2_TEST_CATALOG,
        resolveParameterIds: resolveTestParameterIds,
      });
    },
  ],
];

describe.each(STORES)('given reforms saved in %s', (_storeName, makeStore) => {
  let store: ReformStore;
  let earlier: Reform;
  let queryClient: QueryClient;

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    store = makeStore();
    vi.setSystemTime(new Date(SAVED_TIMES.EARLIER));
    earlier = await store.create(twoParameterReformInput('Earlier plan', 700));
    vi.setSystemTime(new Date(SAVED_TIMES.LATER));
    await store.create(twoParameterReformInput('Later plan', 800));
    queryClient = testQueryClient();
    queryClient.setQueryData(LIST_KEY, await store.findMine('us'));
    vi.setSystemTime(new Date(SAVED_TIMES.JUST_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('when a reform is created then the list holds what the store lists next', async () => {
    // When
    const created = await store.create(twoParameterReformInput('New plan', 900));
    await writeSavedReform(queryClient, BROWSER_SCOPE, created);

    // Then
    const listed = await store.findMine('us');
    expect(listed).toHaveLength(3);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(listed);
  });

  test('when a saved reform is edited then the list holds what the store lists next', async () => {
    // When: the draft's save, as it changes the reform it edits
    const { label, parameters, provenance } = twoParameterReformInput('Earlier plan, edited', 950);
    const updated = await store.update(earlier.id!, { label, parameters, provenance });
    await writeSavedReform(queryClient, BROWSER_SCOPE, updated);

    // Then
    const listed = await store.findMine('us');
    expect(listed).toHaveLength(2);
    expect(listed[0].label).toBe('Earlier plan, edited');
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(listed);
  });
});
