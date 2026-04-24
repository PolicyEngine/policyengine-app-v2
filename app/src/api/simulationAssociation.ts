import {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationByIdV2,
  fetchUserSimulationAssociationsV2,
  updateUserSimulationAssociationV2,
} from '@/api/v2/userSimulationAssociations';
import { getMappedV2UserId, getOrCreateV2UserId, isUuid } from '@/libs/migration/idMapping';
import { UserSimulation } from '../types/ingredients/UserSimulation';

export interface UserSimulationStore {
  create: (simulation: Omit<UserSimulation, 'id' | 'createdAt'>) => Promise<UserSimulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserSimulation[]>;
  findById: (userId: string, simulationId: string) => Promise<UserSimulation | null>;
  update: (userSimulationId: string, updates: Partial<UserSimulation>) => Promise<UserSimulation>;
  // The below are not yet implemented, but keeping for future use
  // delete(userSimulationId: string): Promise<void>;
}

export class ApiSimulationStore implements UserSimulationStore {
  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    const v2UserId = getOrCreateV2UserId(simulation.userId);

    return createUserSimulationAssociationV2({
      userId: v2UserId,
      simulationId: simulation.simulationId,
      countryId: simulation.countryId,
      label: simulation.label,
    });
  }

  async findByUser(userId: string, countryId?: string): Promise<UserSimulation[]> {
    const v2UserId = getMappedV2UserId(userId);

    if (!v2UserId) {
      return [];
    }

    return fetchUserSimulationAssociationsV2(v2UserId, countryId);
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const v2UserId = getMappedV2UserId(userId);

    if (!v2UserId) {
      return null;
    }

    const associations = await fetchUserSimulationAssociationsV2(v2UserId);
    return associations.find((association) => association.simulationId === simulationId) ?? null;
  }

  async update(
    userSimulationId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    const existingAssociation = await fetchUserSimulationAssociationByIdV2(userSimulationId);

    if (!existingAssociation) {
      throw new Error(`UserSimulation with id ${userSimulationId} not found`);
    }

    return updateUserSimulationAssociationV2(userSimulationId, existingAssociation.userId, {
      label: updates.label ?? existingAssociation.label ?? null,
    });
  }

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, simulationId: string): Promise<void> {
    const response = await fetch(`/api/user-simulation-associations/${userId}/${simulationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class MixedSimulationStore implements UserSimulationStore {
  constructor(
    private readonly localStore: LocalStorageSimulationStore,
    private readonly apiStore: ApiSimulationStore
  ) {}

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    if (isUuid(simulation.simulationId)) {
      return this.apiStore.create(simulation);
    }

    return this.localStore.create(simulation);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserSimulation[]> {
    const [localAssociations, v2Associations] = await Promise.all([
      this.localStore.findByUser(userId, countryId),
      this.apiStore.findByUser(userId, countryId),
    ]);

    return [...localAssociations, ...v2Associations];
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const localAssociation = await this.localStore.findById(userId, simulationId);
    if (localAssociation) {
      return localAssociation;
    }

    return this.apiStore.findById(userId, simulationId);
  }

  async update(
    userSimulationId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    if (isUuid(userSimulationId)) {
      return this.apiStore.update(userSimulationId, updates);
    }

    return this.localStore.update(userSimulationId, updates);
  }
}

export class LocalStorageSimulationStore implements UserSimulationStore {
  private readonly STORAGE_KEY = 'user-simulation-associations';

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    // Generate a unique ID for local storage
    // Format: "sus-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `sus-${timestamp}${random}`;

    const newSimulation: UserSimulation = {
      ...simulation,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const simulations = this.getStoredSimulations();

    const updatedSimulations = [...simulations, newSimulation];
    this.setStoredSimulations(updatedSimulations);

    return newSimulation;
  }

  async findByUser(userId: string, countryId?: string): Promise<UserSimulation[]> {
    const simulations = this.getStoredSimulations();
    return simulations.filter(
      (s) => s.userId === userId && (!countryId || s.countryId === countryId)
    );
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const simulations = this.getStoredSimulations();
    return simulations.find((s) => s.userId === userId && s.simulationId === simulationId) || null;
  }

  private getStoredSimulations(): UserSimulation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredSimulations(simulations: UserSimulation[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(simulations));
  }

  async update(
    userSimulationId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    const simulations = this.getStoredSimulations();

    // Find by userSimulation.id (the "sus-" prefixed ID), NOT simulationId
    const index = simulations.findIndex((s) => s.id === userSimulationId);

    if (index === -1) {
      throw new Error(`UserSimulation with id ${userSimulationId} not found`);
    }

    // Merge updates and set timestamp
    const updated: UserSimulation = {
      ...simulations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    simulations[index] = updated;
    this.setStoredSimulations(simulations);

    return updated;
  }

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, simulationId: string): Promise<void> {
    const simulations = this.getStoredSimulations();
    const filtered = simulations.filter(
      a => !(a.userId === userId && a.simulationId === simulationId)
    );
    this.setStoredSimulations(filtered);
  }
  */
}
