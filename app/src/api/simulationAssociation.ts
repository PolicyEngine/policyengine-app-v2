import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import { AccountAssociationRoutes, isLegacyId, type ApiStoreContext } from '@/api/v2Associations';
import { isAssociationCountry, type UserSimulationItem } from '@/types/v2User';
import { UserSimulation } from '../types/ingredients/UserSimulation';

export interface UserSimulationStore {
  create: (simulation: Omit<UserSimulation, 'id' | 'createdAt'>) => Promise<UserSimulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserSimulation[]>;
  findById: (userId: string, simulationId: string) => Promise<UserSimulation | null>;
  update: (userSimulationId: string, updates: Partial<UserSimulation>) => Promise<UserSimulation>;
  delete: (userSimulationId: string) => Promise<void>;
}

/**
 * Account storage: `/v2/user-simulations` on the PolicyEngine API. The
 * server stamps the signed-in user onto each row; `userId` arguments are
 * never sent.
 */
export class ApiSimulationStore implements UserSimulationStore {
  private readonly routes: AccountAssociationRoutes<UserSimulationItem>;

  constructor(context: ApiStoreContext) {
    this.routes = new AccountAssociationRoutes(context, 'user-simulations', 'UserSimulation');
  }

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    const countryId = isAssociationCountry(simulation.countryId)
      ? simulation.countryId
      : this.routes.countryId;
    const item = await this.routes.create(
      UserSimulationAdapter.toCreationPayload(simulation, countryId)
    );
    return UserSimulationAdapter.fromApiItem(item);
  }

  async findByUser(_userId: string, countryId?: string): Promise<UserSimulation[]> {
    if (countryId && countryId !== this.routes.countryId) {
      return [];
    }
    const items = await this.routes.list();
    return items
      .filter(UserSimulationAdapter.hasLegacySimulation)
      .map(UserSimulationAdapter.fromApiItem);
  }

  async findById(_userId: string, simulationId: string): Promise<UserSimulation | null> {
    if (!isLegacyId(simulationId)) {
      return null;
    }
    const item = await this.routes.findFirst({ legacy_simulation_id: simulationId });
    return item && UserSimulationAdapter.hasLegacySimulation(item)
      ? UserSimulationAdapter.fromApiItem(item)
      : null;
  }

  async update(
    userSimulationId: string,
    updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    const item = await this.routes.patch(
      userSimulationId,
      UserSimulationAdapter.toUpdatePayload(updates)
    );
    return UserSimulationAdapter.fromApiItem(item);
  }

  delete(userSimulationId: string): Promise<void> {
    return this.routes.delete(userSimulationId);
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

  async delete(userSimulationId: string): Promise<void> {
    this.setStoredSimulations(this.getStoredSimulations().filter((s) => s.id !== userSimulationId));
  }
}
