import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import { UserSimulationCreationPayload } from '@/types/payloads';
import { UserSimulation } from '../types/ingredients/UserSimulation';

export interface UserSimulationStore {
  create: (simulation: Omit<UserSimulation, 'id' | 'createdAt'>) => Promise<UserSimulation>;
  findByUser: (userId: string) => Promise<UserSimulation[]>;
  findById: (userId: string, simulationId: string) => Promise<UserSimulation | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, simulationId: string, updates: Partial<UserSimulation>): Promise<UserSimulation>;
  // delete(userId: string, simulationId: string): Promise<void>;
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

  async findByUser(userId: string): Promise<UserSimulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserSimulation
    return apiResponses.map((apiData: any) => UserSimulationAdapter.fromApiResponse(apiData));
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

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, simulationId: string, updates: Partial<UserSimulation>): Promise<UserSimulation> {
    const response = await fetch(`/api/user-simulation-associations/${userId}/${simulationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update association');
    }

    return response.json();
  }
  */

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

    // Check for duplicates
    const exists = simulations.some(
      (s) => s.userId === simulation.userId && s.simulationId === simulation.simulationId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedSimulations = [...simulations, newSimulation];
    this.setStoredSimulations(updatedSimulations);

    return newSimulation;
  }

  async findByUser(userId: string): Promise<UserSimulation[]> {
    const simulations = this.getStoredSimulations();
    return simulations.filter((s) => s.userId === userId);
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

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, simulationId: string, updates: Partial<UserSimulation>): Promise<UserSimulation> {
    const simulations = this.getStoredSimulations();
    const index = simulations.findIndex(
      a => a.userId === userId && a.simulationId === simulationId
    );

    if (index === -1) {
      throw new Error('Association not found');
    }

    const updated = { ...simulations[index], ...updates };
    simulations[index] = updated;
    this.setStoredSimulations(simulations);

    return updated;
  }
  */

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
