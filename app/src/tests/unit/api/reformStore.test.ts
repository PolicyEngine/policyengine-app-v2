import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiReformStore,
  getReformStore,
  LocalStorageReformStore,
  parametersFromPolicyJson,
  ReformNotFoundError,
} from '@/api/reformStore';
import {
  ASSOCIATION_IDS,
  createTestApiContext,
  fetchCall,
  itemResponse,
  noContentResponse,
  pageResponse,
  PE_USER_ID,
  policyItem,
} from '@/tests/fixtures/api/v2UserMocks';
import type { Reform } from '@/types/ingredients/Reform';

const mockReformInput: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'> = {
  userId: 'user-123',
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
};

const MATERIALIZED_POLICY_ID = 95762;
const REPLACEMENT_POLICY_ID = 95800;

const POLICY_JSON = {
  'gov.irs.credits.ctc.amount.base[0]': { '2026-01-01.2026-12-31': 3600 },
};

function apiReformStore(countryId: 'us' | 'uk' = 'us') {
  const { fetchMock, context } = createTestApiContext(countryId);
  const materializePolicy = vi.fn().mockResolvedValue(MATERIALIZED_POLICY_ID);
  const fetchPolicyJson = vi.fn().mockResolvedValue(POLICY_JSON);
  const store = new ApiReformStore(context, { materializePolicy, fetchPolicyJson });
  return { store, fetchMock, materializePolicy, fetchPolicyJson };
}

const reformRow = policyItem({
  id: ASSOCIATION_IDS.REFORM,
  legacy_policy_id: MATERIALIZED_POLICY_ID,
  name: 'CTC to $3,600 for children under 6',
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
});

describe('ApiReformStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('given a reform, when created, then its parameters become a v1 policy and the row links to it', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = apiReformStore();
    fetchMock.mockResolvedValue(itemResponse(reformRow, 201));

    // When
    const created = await store.create(mockReformInput);

    // Then
    expect(materializePolicy).toHaveBeenCalledWith('us', mockReformInput.parameters);
    const call = fetchCall(fetchMock);
    expect(call.path).toBe('/v2/user-policies');
    expect(call.body).toEqual({
      country_id: 'us',
      legacy_policy_id: MATERIALIZED_POLICY_ID,
      name: 'CTC to $3,600 for children under 6',
      baseline: 'current-law',
      provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
    });
    expect(created).toMatchObject({
      id: ASSOCIATION_IDS.REFORM,
      userId: PE_USER_ID,
      policyId: String(MATERIALIZED_POLICY_ID),
      parameters: mockReformInput.parameters,
    });
  });

  it('given a reform already materialized, when created, then no new policy is made', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = apiReformStore();
    fetchMock.mockResolvedValue(itemResponse(reformRow, 201));

    // When
    await store.create({ ...mockReformInput, policyId: '42' });

    // Then
    expect(materializePolicy).not.toHaveBeenCalled();
    expect(fetchCall(fetchMock).body.legacy_policy_id).toBe(42);
  });

  it('given saved rows, when listed, then parameters are rebuilt from each v1 policy', async () => {
    // Given
    const { store, fetchMock, fetchPolicyJson } = apiReformStore();
    fetchMock.mockResolvedValue(
      pageResponse([
        reformRow,
        policyItem({ id: 'v2-only', legacy_policy_id: null }),
        policyItem({ id: 'legacy-builder-policy', provenance: null }),
      ])
    );

    // When
    const reforms = await store.findByUser(PE_USER_ID, 'us');

    // Then
    expect(fetchPolicyJson).toHaveBeenCalledWith('us', String(MATERIALIZED_POLICY_ID));
    expect(reforms).toHaveLength(1);
    expect(reforms[0].parameters).toEqual(mockReformInput.parameters);
    expect(reforms[0].provenance).toEqual({
      source: 'chat',
      ref: 'session-1',
      confidence: 'exact',
    });
  });

  it('given a policy saved from the legacy builder (no provenance), when read, then it is not a reform', async () => {
    // Given
    const { store, fetchMock } = apiReformStore();
    fetchMock.mockResolvedValue(
      itemResponse(policyItem({ id: ASSOCIATION_IDS.REFORM, provenance: null }))
    );

    // When
    const reform = await store.findById(ASSOCIATION_IDS.REFORM);

    // Then
    expect(reform).toBeNull();
  });

  it('given a reform row without a baseline, when read, then it reads as a current-law reform', async () => {
    // Given
    const { store, fetchMock } = apiReformStore();
    fetchMock.mockResolvedValue(
      itemResponse(
        policyItem({
          id: ASSOCIATION_IDS.REFORM,
          baseline: null,
          provenance: { source: 'manual', ref: null, confidence: null },
        })
      )
    );

    // When
    const reform = await store.findById(ASSOCIATION_IDS.REFORM);

    // Then
    expect(reform?.baseline).toBe('current-law');
    expect(reform?.provenance).toEqual({ source: 'manual' });
  });

  it('given parameter edits, when updated, then a new v1 policy is made and the row repointed', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = apiReformStore();
    materializePolicy.mockResolvedValue(REPLACEMENT_POLICY_ID);
    fetchMock.mockResolvedValue(
      itemResponse({ ...reformRow, name: 'Renamed', legacy_policy_id: REPLACEMENT_POLICY_ID })
    );
    const parameters = [
      {
        name: 'gov.irs.credits.ctc.amount.base[0]',
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 4000 }],
      },
    ];

    // When
    const updated = await store.update(ASSOCIATION_IDS.REFORM, { label: 'Renamed', parameters });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe(`/v2/user-policies/${ASSOCIATION_IDS.REFORM}`);
    expect(call.body).toEqual({ name: 'Renamed', legacy_policy_id: REPLACEMENT_POLICY_ID });
    expect(updated.parameters).toEqual(parameters);
    expect(updated.policyId).toBe(String(REPLACEMENT_POLICY_ID));
  });

  it('given only a rename, when updated, then no policy is made and only the name is patched', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = apiReformStore();
    fetchMock.mockResolvedValue(itemResponse({ ...reformRow, name: 'Renamed' }));

    // When
    await store.update(ASSOCIATION_IDS.REFORM, { label: 'Renamed' });

    // Then
    expect(materializePolicy).not.toHaveBeenCalled();
    expect(fetchCall(fetchMock).body).toEqual({ name: 'Renamed' });
  });

  it.each([
    ['read', (store: ApiReformStore, id: string) => store.findById(id)],
    ['renamed', (store: ApiReformStore, id: string) => store.update(id, { label: 'Renamed' })],
    [
      'edited',
      (store: ApiReformStore, id: string) =>
        store.update(id, { parameters: mockReformInput.parameters }),
    ],
    ['deleted', (store: ApiReformStore, id: string) => store.delete(id)],
  ])(
    'given a reform saved only in this browser, when %s through the API, then it is refused',
    async (_, operate) => {
      // Given
      const local = await new LocalStorageReformStore({
        materializePolicy: async () => MATERIALIZED_POLICY_ID,
      }).create(mockReformInput);
      const { store, fetchMock, materializePolicy } = apiReformStore();

      // When / Then: refused before any v1 policy is made for it
      await expect(operate(store, local.id!)).rejects.toThrow(
        'This was saved only in this browser, so it cannot be opened here.'
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(materializePolicy).not.toHaveBeenCalled();
      expect(await new LocalStorageReformStore().findById(local.id!)).not.toBeNull();
    }
  );

  it('given one reform whose v1 policy fails to load, when listed, then the others still list', async () => {
    // Given
    const { store, fetchMock, fetchPolicyJson } = apiReformStore();
    const unloadable = policyItem({
      ...reformRow,
      id: '66666666-6666-4666-8666-666666666666',
      legacy_policy_id: REPLACEMENT_POLICY_ID,
      name: 'Unloadable',
    });
    fetchMock.mockResolvedValue(pageResponse([reformRow, unloadable]));
    fetchPolicyJson.mockImplementation(async (_countryId: string, policyId: string) => {
      if (policyId === String(REPLACEMENT_POLICY_ID)) {
        throw new Error('Failed to fetch policy 95800');
      }
      return POLICY_JSON;
    });

    // When
    const reforms = await store.findByUser(PE_USER_ID, 'us');

    // Then
    expect(reforms).toHaveLength(2);
    expect(reforms[0].parameters).toHaveLength(1);
    expect(reforms[0].parametersUnavailable).toBeUndefined();
    expect(reforms[1]).toMatchObject({
      label: 'Unloadable',
      policyId: String(REPLACEMENT_POLICY_ID),
      parameters: [],
      parametersUnavailable: true,
    });
  });

  it('given a UK reform while the page is in the US, when created, then it is written in the UK', async () => {
    // Given
    const { store, fetchMock, materializePolicy } = apiReformStore('us');
    fetchMock.mockResolvedValue(itemResponse({ ...reformRow, country_id: 'uk' }, 201));

    // When
    await store.create({ ...mockReformInput, countryId: 'uk' });

    // Then
    expect(materializePolicy).toHaveBeenCalledWith('uk', mockReformInput.parameters);
    const call = fetchCall(fetchMock);
    expect(call.query).toEqual({ country_id: 'uk' });
    expect(call.body.country_id).toBe('uk');
  });

  it('given a reform from a country without accounts, when created, then it is written in the page country', async () => {
    // Given
    const { store, fetchMock } = apiReformStore('uk');
    fetchMock.mockResolvedValue(itemResponse({ ...reformRow, country_id: 'uk' }, 201));

    // When
    await store.create({ ...mockReformInput, countryId: 'ca' });

    // Then
    expect(fetchCall(fetchMock).body.country_id).toBe('uk');
  });

  it('given a reform, when deleted, then its row is deleted', async () => {
    // Given
    const { store, fetchMock } = apiReformStore();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    await store.delete(ASSOCIATION_IDS.REFORM);

    // Then
    expect(fetchCall(fetchMock).method).toBe('DELETE');
  });
});

describe('parametersFromPolicyJson', () => {
  it('given no metadata, then the stored values are used as-is', () => {
    expect(parametersFromPolicyJson({ 'gov.example': { '2026-01-01.2100-12-31': true } })).toEqual([
      {
        name: 'gov.example',
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: true }],
      },
    ]);
  });
});

describe('getReformStore', () => {
  it('given no account, then reforms stay in localStorage', () => {
    expect(getReformStore(null)).toBeInstanceOf(LocalStorageReformStore);
  });

  it('given an account, then reforms go to the account', () => {
    expect(getReformStore(createTestApiContext().context)).toBeInstanceOf(ApiReformStore);
  });
});

describe('LocalStorageReformStore', () => {
  let store: LocalStorageReformStore;
  let materializePolicy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    materializePolicy = vi.fn().mockResolvedValue(MATERIALIZED_POLICY_ID);
    store = new LocalStorageReformStore({ materializePolicy });
    localStorage.clear();
  });

  it('given a reform, when created, then it is retrievable by user and by id', async () => {
    const created = await store.create(mockReformInput);

    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();

    const byUser = await store.findByUser('user-123', 'us');
    expect(byUser).toHaveLength(1);

    const byId = await store.findById(created.id!);
    expect(byId?.label).toBe('CTC to $3,600 for children under 6');
  });

  it('given a reform, when created, then its v1 policy is created and its ID kept in this browser', async () => {
    const created = await store.create(mockReformInput);

    expect(materializePolicy).toHaveBeenCalledWith('us', mockReformInput.parameters);
    expect(created.policyId).toBe(String(MATERIALIZED_POLICY_ID));
    expect((await store.findById(created.id!))?.policyId).toBe(String(MATERIALIZED_POLICY_ID));
  });

  it('given a reform that already has a v1 policy, when created, then no new policy is made', async () => {
    const created = await store.create({ ...mockReformInput, policyId: '501' });

    expect(materializePolicy).not.toHaveBeenCalled();
    expect(created.policyId).toBe('501');
  });

  it('given the v1 policy cannot be created, when created, then the save fails and nothing is stored', async () => {
    materializePolicy.mockRejectedValue(new Error('Failed to create policy'));

    await expect(store.create(mockReformInput)).rejects.toThrow('Failed to create policy');
    expect(await store.findByUser('user-123')).toEqual([]);
  });

  it('given reforms from two countries, when filtering by country, then only matches are returned', async () => {
    await store.create(mockReformInput);
    await store.create({ ...mockReformInput, countryId: 'uk' });

    const usOnly = await store.findByUser('user-123', 'us');
    expect(usOnly).toHaveLength(1);
    expect(usOnly[0].countryId).toBe('us');
  });

  it('given an existing reform, when renamed, then the label changes and the v1 policy stays', async () => {
    const created = await store.create(mockReformInput);
    materializePolicy.mockClear();

    const updated = await store.update(created.id!, { label: 'Renamed' });

    expect(updated.label).toBe('Renamed');
    expect(updated.userId).toBe('user-123');
    expect(updated.policyId).toBe(String(MATERIALIZED_POLICY_ID));
    expect(materializePolicy).not.toHaveBeenCalled();
  });

  it('given an existing reform, when its parameters change, then it points at a new v1 policy', async () => {
    const created = await store.create(mockReformInput);
    materializePolicy.mockResolvedValue(REPLACEMENT_POLICY_ID);
    const parameters = [
      {
        name: 'gov.irs.credits.ctc.amount.base[0]',
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 4000 }],
      },
    ];

    const updated = await store.update(created.id!, { parameters });

    expect(materializePolicy).toHaveBeenLastCalledWith('us', parameters);
    expect(updated.policyId).toBe(String(REPLACEMENT_POLICY_ID));
    expect((await store.findById(created.id!))?.parameters).toEqual(parameters);
  });

  it('given the new v1 policy cannot be created, when updated, then the stored reform is unchanged', async () => {
    const created = await store.create(mockReformInput);
    materializePolicy.mockRejectedValue(new Error('Failed to create policy'));

    await expect(store.update(created.id!, { parameters: [] })).rejects.toThrow(
      'Failed to create policy'
    );
    expect(await store.findById(created.id!)).toEqual(created);
  });

  it('given a missing reform, when updated, then it says the reform is not here', async () => {
    await expect(store.update('rf-missing', { label: 'x' })).rejects.toBeInstanceOf(
      ReformNotFoundError
    );
    expect(materializePolicy).not.toHaveBeenCalled();
  });

  it('given an existing reform, when deleted, then it is no longer retrievable', async () => {
    const created = await store.create(mockReformInput);

    await store.delete(created.id!);

    expect(await store.findById(created.id!)).toBeNull();
  });
});
