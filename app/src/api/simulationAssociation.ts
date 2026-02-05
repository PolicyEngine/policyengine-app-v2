/**
 * User Simulation Associations Store
 *
 * MIGRATION NOTE: When API v2 alpha adds user-simulation-association endpoints,
 * this file should be migrated to use the v2 API. Follow the pattern established in:
 * - householdAssociation.ts (ApiHouseholdStore)
 * - v2/userHouseholdAssociations.ts (API functions)
 *
 * Key migration steps:
 * 1. Create a new v2/userSimulationAssociations.ts module with:
 *    - Type definitions for API request/response (snake_case)
 *    - Conversion functions (toV2CreateRequest, fromV2Response)
 *    - API functions (create, fetch, update, delete)
 * 2. Update ApiSimulationStore to delegate to the v2 API functions
 * 3. Add delete method to UserSimulationStore interface
 * 4. Update the interface's update signature to use associationId instead of composite keys
 */
import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import { UserSimulationCreationPayload } from '@/types/payloads';
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
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-simulation-associations';

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    const payload: UserSimulationCreationPayload =
      UserSimulationAdapter.toCreationPayload(simulation);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create simulation association');
    }

    const apiResponse = await response.json();
    return UserSimulationAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserSimulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserSimulation and filter by country if specified
    const simulations = apiResponses.map((apiData: any) =>
      UserSimulationAdapter.fromApiResponse(apiData)
    );
    return countryId
      ? simulations.filter((s: UserSimulation) => s.countryId === countryId)
      : simulations;
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${simulationId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserSimulationAdapter.fromApiResponse(apiData);
  }

  async update(
    _userSimulationId: string,
    _updates: Partial<UserSimulation>
  ): Promise<UserSimulation> {
    // TODO: Implement when backend API endpoint is available
    // Expected endpoint: PUT /api/user-simulation-associations/:userSimulationId
    // Expected payload: UserSimulationUpdatePayload (to be created)

    console.warn(
      '[ApiSimulationStore.update] API endpoint not yet implemented. ' +
        'This method will be activated when user authentication is added.'
    );

    throw new Error(
      'Simulation updates via API are not yet supported. ' +
        'Please ensure you are using localStorage mode.'
    );
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
