import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReformAdapter } from '@/adapters/ReformAdapter';
import {
  ApiReformStore,
  LocalStorageReformStore,
  ReformStoreBusyError,
  resetReformStoreAvailabilityForTesting,
  ResilientReformStore,
} from '@/api/reformStore';
import {
  EDIT_TOKEN_HEADER,
  findOwnedItem,
  ItemNotOwnedError,
  readOwnedItems,
} from '@/libs/flagship/ownedItems';
import {
  HTTP_STATUS,
  LEGACY_REFORMS_KEY,
  legacyLocalReform,
  mockErrorResponse,
  mockJsonResponse,
  mockNewReform,
  mockReformCreatedMetadata,
  mockReformMetadata,
} from '@/tests/fixtures/api/flagshipStoreMocks';
import {
  CENTRAL_REFORM_ID,
  EDIT_TOKEN,
  OTHER_CENTRAL_REFORM_ID,
  OWNED_REFORMS_KEY,
  ownedUkReform,
  ownedUsReform,
  seedOwnedItems,
} from '@/tests/fixtures/libs/flagship/ownedItemsMocks';

const fetchMock = vi.fn();

function requestHeaders(callIndex = 0): Record<string, string> {
  return fetchMock.mock.calls[callIndex][1].headers;
}

describe('ReformAdapter', () => {
  it('given a reform, when converted to a creation payload, then keys are snake_case and no user id is sent', () => {
    const payload = ReformAdapter.toCreationPayload(mockNewReform);

    expect(payload).not.toHaveProperty('user_id');
    expect(payload.country_id).toBe('us');
    expect(payload.parameters[0].values[0]).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      value: 3600,
    });
    expect(payload.provenance).toEqual({ source: 'chat', ref: 'session-1', confidence: 'exact' });
  });

  it('given an API response, when converted to a Reform, then keys are camelCase and ids are strings', () => {
    const reform = ReformAdapter.fromApiResponse(mockReformMetadata);

    expect(reform.id).toBe(CENTRAL_REFORM_ID);
    expect(reform.policyId).toBeUndefined();
    expect(reform.parameters[0].values[0]).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      value: 3600,
    });
    expect(reform.provenance.source).toBe('chat');
  });

  it('given partial updates, when converted to an update payload, then only provided fields are included', () => {
    const payload = ReformAdapter.toUpdatePayload({ label: 'Renamed' });

    expect(payload).toEqual({ label: 'Renamed' });
  });
});

describe('ApiReformStore', () => {
  let store: ApiReformStore;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    store = new ApiReformStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('given a reform, when created, then it POSTs without a user id and indexes the id with its edit token', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(mockReformCreatedMetadata, HTTP_STATUS.CREATED)
    );

    const result = await store.create(mockNewReform);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reforms',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('user_id');
    expect(result.id).toBe(CENTRAL_REFORM_ID);
    expect(result).not.toHaveProperty('editToken');
    expect(findOwnedItem('reforms', CENTRAL_REFORM_ID)).toMatchObject({
      countryId: 'us',
      editToken: EDIT_TOKEN,
    });
  });

  it('given indexed reforms, when finding mine, then only this country’s ids are requested in one batch', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform, ownedUkReform]);
    fetchMock.mockResolvedValueOnce(mockJsonResponse([mockReformMetadata]));

    const result = await store.findMine('us');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `/api/reforms?ids=${encodeURIComponent(CENTRAL_REFORM_ID)}`
    );
    expect(result.map((reform) => reform.id)).toEqual([CENTRAL_REFORM_ID]);
  });

  it('given an empty index, when finding mine, then no request is made', async () => {
    const result = await store.findMine('us');

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given more indexed reforms than one batch holds, when finding mine, then the ids are split across requests', async () => {
    const ids = Array.from(
      { length: 51 },
      (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
    );
    seedOwnedItems(
      OWNED_REFORMS_KEY,
      ids.map((id) => ({ ...ownedUsReform, id }))
    );
    fetchMock.mockResolvedValue(mockJsonResponse([]));

    await store.findMine('us');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBatch = new URL(fetchMock.mock.calls[1][0], 'http://test').searchParams.get('ids');
    expect(secondBatch).toBe(ids[50]);
  });

  it('given a missing reform, when finding by id, then returns null on 404', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.NOT_FOUND));

    const result = await store.findById(OTHER_CENTRAL_REFORM_ID);

    expect(result).toBeNull();
  });

  it('given the new-reform budget is used up (429), when creating, then throws ReformStoreBusyError', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.TOO_MANY_REQUESTS));

    await expect(store.create(mockNewReform)).rejects.toThrow(ReformStoreBusyError);
    expect(readOwnedItems('reforms')).toEqual([]);
  });

  it('given a failing API, when creating, then throws and indexes nothing', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR));

    await expect(store.create(mockNewReform)).rejects.toThrow('Failed to create reform');
    expect(readOwnedItems('reforms')).toEqual([]);
  });

  it('given an owned reform, when updating, then PATCHes with its edit token', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ ...mockReformMetadata, label: 'Renamed' }));

    const result = await store.update(CENTRAL_REFORM_ID, { label: 'Renamed' });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/reforms/${CENTRAL_REFORM_ID}`,
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(requestHeaders()[EDIT_TOKEN_HEADER]).toBe(EDIT_TOKEN);
    expect(result.label).toBe('Renamed');
  });

  it('given a reform this browser did not create, when updating, then it throws without a request', async () => {
    await expect(store.update(OTHER_CENTRAL_REFORM_ID, { label: 'Hijacked' })).rejects.toThrow(
      ItemNotOwnedError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given the server rejects the token, when updating, then it throws ItemNotOwnedError', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.FORBIDDEN));

    await expect(store.update(CENTRAL_REFORM_ID, { label: 'Renamed' })).rejects.toThrow(
      ItemNotOwnedError
    );
  });

  it('given an owned reform, when deleting, then DELETEs with its token and drops it from the index', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ deleted: true }));

    await store.delete(CENTRAL_REFORM_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/reforms/${CENTRAL_REFORM_ID}`,
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(requestHeaders()[EDIT_TOKEN_HEADER]).toBe(EDIT_TOKEN);
    expect(findOwnedItem('reforms', CENTRAL_REFORM_ID)).toBeNull();
  });

  it('given a failed delete, when deleting, then the reform stays in the index', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR));

    await expect(store.delete(CENTRAL_REFORM_ID)).rejects.toThrow('Failed to delete reform');
    expect(findOwnedItem('reforms', CENTRAL_REFORM_ID)).not.toBeNull();
  });
});

describe('LocalStorageReformStore', () => {
  let store: LocalStorageReformStore;

  beforeEach(() => {
    store = new LocalStorageReformStore();
    localStorage.clear();
  });

  it('given a reform, when created, then it is listed as mine and retrievable by id', async () => {
    const created = await store.create(mockNewReform);

    expect(created.id).toMatch(/^rf-/);
    expect(await store.findMine('us')).toHaveLength(1);
    expect((await store.findById(created.id!))?.label).toBe(mockNewReform.label);
  });

  it('given reforms from two countries, when filtering by country, then only matches are returned', async () => {
    await store.create(mockNewReform);
    await store.create({ ...mockNewReform, countryId: 'uk' });

    const usOnly = await store.findMine('us');

    expect(usOnly).toHaveLength(1);
    expect(usOnly[0].countryId).toBe('us');
  });

  it('given a reform saved under the old shared user id, when finding mine, then it is listed', async () => {
    localStorage.setItem(LEGACY_REFORMS_KEY, JSON.stringify([legacyLocalReform]));

    const mine = await store.findMine('us');

    expect(mine.map((reform) => reform.id)).toEqual([legacyLocalReform.id]);
  });

  it('given an existing reform, when updated, then fields change', async () => {
    const created = await store.create(mockNewReform);

    const updated = await store.update(created.id!, { label: 'Renamed' });

    expect(updated.label).toBe('Renamed');
  });

  it('given a missing reform, when updated, then throws', async () => {
    await expect(store.update('rf-missing', { label: 'x' })).rejects.toThrow(
      'Failed to update reform'
    );
  });

  it('given an existing reform, when deleted, then it is no longer retrievable', async () => {
    const created = await store.create(mockNewReform);

    await store.delete(created.id!);

    expect(await store.findById(created.id!)).toBeNull();
  });
});

describe('ResilientReformStore', () => {
  let store: ResilientReformStore;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    resetReformStoreAvailabilityForTesting();
    store = new ResilientReformStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('given the API is healthy, when creating, then the central store is used', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(mockReformCreatedMetadata, HTTP_STATUS.CREATED)
    );

    const result = await store.create(mockNewReform);

    expect(result.id).toBe(CENTRAL_REFORM_ID);
    expect(await new LocalStorageReformStore().findMine()).toHaveLength(0);
  });

  it('given the API returns 503, when creating, then it falls back to localStorage', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.SERVICE_UNAVAILABLE));

    const result = await store.create(mockNewReform);

    expect(result.id).toMatch(/^rf-/);
    expect(await new LocalStorageReformStore().findMine()).toHaveLength(1);
    expect(readOwnedItems('reforms')).toEqual([]);
  });

  it('given a prior 503, when listing later, then localStorage is used without retrying the API', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.SERVICE_UNAVAILABLE));
    await store.create(mockNewReform);
    fetchMock.mockClear();

    const reforms = await store.findMine('us');

    expect(reforms).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given the collection endpoint is absent (404), when listing, then the local reforms are still listed', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    localStorage.setItem(LEGACY_REFORMS_KEY, JSON.stringify([legacyLocalReform]));
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.NOT_FOUND));

    const reforms = await store.findMine('us');

    expect(reforms.map((reform) => reform.id)).toEqual([legacyLocalReform.id]);
  });

  it('given central and pre-existing local reforms, when listing, then both appear, most recently updated first', async () => {
    seedOwnedItems(OWNED_REFORMS_KEY, [ownedUsReform]);
    localStorage.setItem(LEGACY_REFORMS_KEY, JSON.stringify([legacyLocalReform]));
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse([{ ...mockReformMetadata, updated_at: '2026-10-01T00:00:00.000Z' }])
    );

    const reforms = await store.findMine('us');

    expect(reforms.map((reform) => reform.id)).toEqual([CENTRAL_REFORM_ID, legacyLocalReform.id]);
  });

  it('given a pre-existing local reform, when updating while the API is healthy, then the edit stays local', async () => {
    localStorage.setItem(LEGACY_REFORMS_KEY, JSON.stringify([legacyLocalReform]));

    const updated = await store.update(legacyLocalReform.id, { label: 'Renamed' });

    expect(updated.label).toBe('Renamed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given a pre-existing local reform, when deleting, then it is removed locally without a request', async () => {
    localStorage.setItem(LEGACY_REFORMS_KEY, JSON.stringify([legacyLocalReform]));

    await store.delete(legacyLocalReform.id);

    expect(await new LocalStorageReformStore().findById(legacyLocalReform.id)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('given the API is busy (429), when creating, then that reform is saved locally and the next create tries the API again', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.TOO_MANY_REQUESTS));

    const busySave = await store.create(mockNewReform);

    expect(busySave.id).toMatch(/^rf-/);
    expect(await new LocalStorageReformStore().findMine()).toHaveLength(1);

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(mockReformCreatedMetadata, HTTP_STATUS.CREATED)
    );
    const nextSave = await store.create(mockNewReform);

    expect(nextSave.id).toBe(CENTRAL_REFORM_ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('given a real server error (500), when creating, then it surfaces instead of falling back', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR));

    await expect(store.create(mockNewReform)).rejects.toThrow('Failed to create reform');
    expect(await new LocalStorageReformStore().findMine()).toHaveLength(0);
  });

  it('given a fallback save then update and delete keep working against localStorage', async () => {
    fetchMock.mockResolvedValueOnce(mockErrorResponse(HTTP_STATUS.SERVICE_UNAVAILABLE));
    const created = await store.create(mockNewReform);

    const updated = await store.update(created.id!, { label: 'Renamed' });
    expect(updated.label).toBe('Renamed');

    await store.delete(created.id!);
    expect(await store.findById(created.id!)).toBeNull();
  });
});
