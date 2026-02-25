import {
  createUserSimulationAssociationV2,
  deleteUserSimulationAssociationV2,
  fetchUserSimulationAssociationsV2,
  updateUserSimulationAssociationV2,
} from '@/api/v2/userSimulationAssociations';
import { UserSimulation } from '../types/ingredients/UserSimulation';

export interface UserSimulationStore {
  create: (simulation: Omit<UserSimulation, 'id' | 'createdAt'>) => Promise<UserSimulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserSimulation[]>;
  findById: (userId: string, simulationId: string) => Promise<UserSimulation | null>;
  update: (
    userSimulationId: string,
    userId: string,
    updates: Partial<UserSimulation>
  ) => Promise<UserSimulation>;
  delete: (userSimulationId: string, userId: string) => Promise<void>;
}

export class ApiSimulationStore implements UserSimulationStore {
  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    return createUserSimulationAssociationV2(simulation);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserSimulation[]> {
    return fetchUserSimulationAssociationsV2(userId, countryId);
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    // v2 API has no composite-key endpoint; list by user and filter
    const associations = await fetchUserSimulationAssociationsV2(userId);
    return associations.find((a) => a.simulationId === simulationId) ?? null;
  }

  async update(
    userSimulationId: string,
    userId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    return updateUserSimulationAssociationV2(userSimulationId, userId, {
      label: updates.label ?? null,
    });
  }

  async delete(userSimulationId: string, userId: string): Promise<void> {
    return deleteUserSimulationAssociationV2(userSimulationId, userId);
  }
}

export class LocalStorageSimulationStore implements UserSimulationStore {
  private readonly STORAGE_KEY = 'user-simulation-associations';

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
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
    this.setStoredSimulations([...simulations, newSimulation]);

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

  async update(
    userSimulationId: string,
    _userId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    const simulations = this.getStoredSimulations();
    const index = simulations.findIndex((s) => s.id === userSimulationId);

    if (index === -1) {
      throw new Error(`UserSimulation with id ${userSimulationId} not found`);
    }

    const updated: UserSimulation = {
      ...simulations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    simulations[index] = updated;
    this.setStoredSimulations(simulations);

    return updated;
  }

  async delete(userSimulationId: string, _userId: string): Promise<void> {
    const simulations = this.getStoredSimulations();
    const filtered = simulations.filter((s) => s.id !== userSimulationId);

    if (filtered.length === simulations.length) {
      throw new Error(`Association with id ${userSimulationId} not found`);
    }

    this.setStoredSimulations(filtered);
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
}
