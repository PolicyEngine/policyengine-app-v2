import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiSimulationStore,
  LocalStorageSimulationStore,
  MixedSimulationStore,
} from '@/api/simulationAssociation';
import {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationByIdV2,
  fetchUserSimulationAssociationsV2,
  updateUserSimulationAssociationV2,
} from '@/api/v2/userSimulationAssociations';
import {
  getMappedUserSimulationAssociationId,
  getMappedV2UserId,
  getOrCreateV2UserId,
} from '@/libs/migration/idMapping';
import {
  logSkippedUserSimulationAssociationOperation,
  logUserSimulationAssociationComparison,
} from '@/libs/migration/simulationMigration';
import {
  mockSimulation,
  mockSimulationInput,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_SIM_IDS,
  TEST_USER_IDS,
} from '@/tests/fixtures/api/simulationAssociationMocks';

vi.mock('@/api/v2/userSimulationAssociations', () => ({
  createUserSimulationAssociationV2: vi.fn(),
  fetchUserSimulationAssociationsV2: vi.fn(),
  fetchUserSimulationAssociationByIdV2: vi.fn(),
  updateUserSimulationAssociationV2: vi.fn(),
}));

vi.mock('@/libs/migration/idMapping', () => ({
  getMappedUserSimulationAssociationId: vi.fn(),
  getMappedV2UserId: vi.fn(),
  getOrCreateV2UserId: vi.fn(),
  isUuid: (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
}));

vi.mock('@/libs/migration/simulationMigration', () => ({
  logSkippedUserSimulationAssociationOperation: vi.fn(),
  logUserSimulationAssociationComparison: vi.fn(),
}));

describe('ApiSimulationStore', () => {
  let store: ApiSimulationStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new ApiSimulationStore();
    vi.mocked(getMappedUserSimulationAssociationId).mockReturnValue(null);
  });

  describe('create', () => {
    it('given association input then it creates through the v2 client using the mapped v2 user id', async () => {
      const v2Association = mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      });
      vi.mocked(getOrCreateV2UserId).mockReturnValue(v2Association.userId);
      vi.mocked(createUserSimulationAssociationV2).mockResolvedValue(v2Association);

      const result = await store.create(
        mockSimulationInput({
          simulationId: v2Association.simulationId,
        })
      );

      expect(getOrCreateV2UserId).toHaveBeenCalledWith(TEST_USER_IDS.USER_123);
      expect(createUserSimulationAssociationV2).toHaveBeenCalledWith({
        userId: v2Association.userId,
        simulationId: v2Association.simulationId,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.TEST_SIMULATION_1,
      });
      expect(logUserSimulationAssociationComparison).toHaveBeenCalledWith(
        'CREATE',
        expect.objectContaining({
          userId: TEST_USER_IDS.USER_123,
          simulationId: v2Association.simulationId,
          countryId: TEST_COUNTRIES.US,
          label: TEST_LABELS.TEST_SIMULATION_1,
        }),
        v2Association,
        { v2UserId: v2Association.userId }
      );
      expect(result).toEqual(v2Association);
    });
  });

  describe('findByUser', () => {
    it('given no mapped v2 user id then it returns an empty list', async () => {
      vi.mocked(getMappedV2UserId).mockReturnValue(null);

      await expect(store.findByUser(TEST_USER_IDS.USER_123)).resolves.toEqual([]);
      expect(fetchUserSimulationAssociationsV2).not.toHaveBeenCalled();
      expect(logSkippedUserSimulationAssociationOperation).toHaveBeenCalledWith(
        'LIST',
        'Association list fetch skipped: missing mapped v2 user id',
        {
          userId: TEST_USER_IDS.USER_123,
          countryId: null,
        }
      );
    });

    it('given a mapped v2 user id then it fetches via the v2 client', async () => {
      const v2Association = mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      });
      vi.mocked(getMappedV2UserId).mockReturnValue(v2Association.userId);
      vi.mocked(fetchUserSimulationAssociationsV2).mockResolvedValue([v2Association]);

      const result = await store.findByUser(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

      expect(fetchUserSimulationAssociationsV2).toHaveBeenCalledWith(
        v2Association.userId,
        TEST_COUNTRIES.US
      );
      expect(result).toEqual([v2Association]);
    });
  });

  describe('findById', () => {
    it('given no mapped v2 user id then it returns null', async () => {
      vi.mocked(getMappedV2UserId).mockReturnValue(null);

      await expect(
        store.findById(TEST_USER_IDS.USER_123, TEST_SIM_IDS.SIM_456)
      ).resolves.toBeNull();
      expect(fetchUserSimulationAssociationsV2).not.toHaveBeenCalled();
      expect(logSkippedUserSimulationAssociationOperation).toHaveBeenCalledWith(
        'READ',
        'Association fetch skipped: missing mapped v2 user id',
        {
          userId: TEST_USER_IDS.USER_123,
          simulationId: TEST_SIM_IDS.SIM_456,
        }
      );
    });

    it('given a mapped v2 user id then it filters the user association list by simulation id', async () => {
      const v2UserId = '550e8400-e29b-41d4-a716-446655440000';
      const v2Association = mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        userId: v2UserId,
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      });
      vi.mocked(getMappedV2UserId).mockReturnValue(v2UserId);
      vi.mocked(fetchUserSimulationAssociationsV2).mockResolvedValue([v2Association]);

      const result = await store.findById(TEST_USER_IDS.USER_123, v2Association.simulationId);

      expect(result).toEqual(v2Association);
    });
  });

  describe('update', () => {
    it('given a v2 association id then it fetches the association and updates it through the v2 client', async () => {
      const v2Association = mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      });
      vi.mocked(fetchUserSimulationAssociationByIdV2).mockResolvedValue(v2Association);
      vi.mocked(updateUserSimulationAssociationV2).mockResolvedValue({
        ...v2Association,
        label: 'Updated simulation',
      });

      const result = await store.update(v2Association.id!, { label: 'Updated simulation' });

      expect(fetchUserSimulationAssociationByIdV2).toHaveBeenCalledWith(v2Association.id);
      expect(updateUserSimulationAssociationV2).toHaveBeenCalledWith(
        v2Association.id!,
        v2Association.userId,
        { label: 'Updated simulation' }
      );
      expect(logUserSimulationAssociationComparison).toHaveBeenCalledWith(
        'UPDATE',
        expect.objectContaining({
          userId: v2Association.userId,
          simulationId: v2Association.simulationId,
          countryId: v2Association.countryId,
          label: 'Updated simulation',
        }),
        expect.objectContaining({
          label: 'Updated simulation',
        }),
        { v2UserId: v2Association.userId }
      );
      expect(result.label).toBe('Updated simulation');
    });

    it('given an unknown v2 association id then it throws a clear error', async () => {
      vi.mocked(fetchUserSimulationAssociationByIdV2).mockResolvedValue(null);

      await expect(
        store.update('dd0e8400-e29b-41d4-a716-446655440008', { label: 'Updated simulation' })
      ).rejects.toThrow('UserSimulation with id dd0e8400-e29b-41d4-a716-446655440008 not found');
      expect(logSkippedUserSimulationAssociationOperation).toHaveBeenCalledWith(
        'UPDATE',
        'Association update skipped: missing v2 association record',
        {
          userSimulationId: 'dd0e8400-e29b-41d4-a716-446655440008',
        }
      );
    });
  });
});

describe('MixedSimulationStore', () => {
  let localStore: LocalStorageSimulationStore;
  let apiStore: ApiSimulationStore;
  let store: MixedSimulationStore;

  beforeEach(() => {
    localStore = new LocalStorageSimulationStore();
    apiStore = new ApiSimulationStore();
    store = new MixedSimulationStore(localStore, apiStore);

    vi.spyOn(localStore, 'create').mockResolvedValue(mockSimulation({ id: 'sus-local-1' }));
    vi.spyOn(localStore, 'findByUser').mockResolvedValue([mockSimulation({ id: 'sus-local-1' })]);
    vi.spyOn(localStore, 'findById').mockResolvedValue(mockSimulation({ id: 'sus-local-1' }));
    vi.spyOn(localStore, 'update').mockResolvedValue(mockSimulation({ id: 'sus-local-1' }));

    vi.spyOn(apiStore, 'create').mockResolvedValue(
      mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      })
    );
    vi.spyOn(apiStore, 'findByUser').mockResolvedValue([
      mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      }),
    ]);
    vi.spyOn(apiStore, 'findById').mockResolvedValue(
      mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
      })
    );
    vi.spyOn(apiStore, 'update').mockResolvedValue(
      mockSimulation({
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        simulationId: '990e8400-e29b-41d4-a716-446655440004',
        label: 'Updated simulation',
      })
    );
  });

  it('routes local simulation creates to the local store', async () => {
    const localInput = mockSimulationInput({ simulationId: TEST_SIM_IDS.SIM_456 });

    await store.create(localInput);

    expect(localStore.create).toHaveBeenCalledWith(localInput);
    expect(apiStore.create).not.toHaveBeenCalled();
  });

  it('routes uuid simulation creates to the v2 store', async () => {
    const v2Input = mockSimulationInput({
      simulationId: '990e8400-e29b-41d4-a716-446655440004',
    });

    await store.create(v2Input);

    expect(apiStore.create).toHaveBeenCalledWith(v2Input);
    expect(localStore.create).not.toHaveBeenCalled();
  });

  it('merges local and v2 associations for findByUser', async () => {
    const result = await store.findByUser(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

    expect(result).toHaveLength(2);
    expect(localStore.findByUser).toHaveBeenCalledWith(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);
    expect(apiStore.findByUser).toHaveBeenCalledWith(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);
  });

  it('filters mapped v2 associations that already correspond to a local association id', async () => {
    const localAssociation = mockSimulation({ id: 'sus-local-1' });
    const v2Association = mockSimulation({
      id: 'dd0e8400-e29b-41d4-a716-446655440008',
      simulationId: '990e8400-e29b-41d4-a716-446655440004',
    });

    vi.spyOn(localStore, 'findByUser').mockResolvedValue([localAssociation]);
    vi.spyOn(apiStore, 'findByUser').mockResolvedValue([v2Association]);
    vi.mocked(getMappedUserSimulationAssociationId).mockReturnValue(v2Association.id!);

    const result = await store.findByUser(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

    expect(result).toEqual([localAssociation]);
  });

  it('routes uuid association updates to the v2 store', async () => {
    await store.update('dd0e8400-e29b-41d4-a716-446655440008', {
      label: 'Updated simulation',
    });

    expect(apiStore.update).toHaveBeenCalled();
    expect(localStore.update).not.toHaveBeenCalled();
  });
});

describe('LocalStorageSimulationStore', () => {
  let store: LocalStorageSimulationStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    store = new LocalStorageSimulationStore();
    vi.clearAllMocks();
  });

  it('stores a new local association with a generated sus- id', async () => {
    const result = await store.create(
      mockSimulationInput({ label: TEST_LABELS.TEST_SIMULATION_1 })
    );

    expect(result).toMatchObject({
      userId: TEST_USER_IDS.USER_123,
      simulationId: TEST_SIM_IDS.SIM_456,
      label: TEST_LABELS.TEST_SIMULATION_1,
    });
    expect(result.id).toMatch(/^sus-/);
    expect(result.createdAt).toBeDefined();
    expect(result.isCreated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('allows duplicate local associations by generating distinct ids', async () => {
    const first = await store.create(mockSimulationInput());
    const second = await store.create(mockSimulationInput());

    expect(second.id).toMatch(/^sus-/);
    expect(second.id).not.toBe(first.id);
    expect(second.simulationId).toBe(first.simulationId);
  });

  it('updates a local association by association id rather than simulation id', async () => {
    const created = await store.create(mockSimulationInput());

    const updated = await store.update(created.id!, { label: 'Renamed simulation' });

    expect(updated.label).toBe('Renamed simulation');
    expect(updated.updatedAt).toBeDefined();
  });
});
