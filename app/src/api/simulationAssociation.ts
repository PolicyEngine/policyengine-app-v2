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
    // Convert to API format (string IDs)
    const apiPayload = {
      userId: simulation.userId.toString(),
      simulationId: simulation.simulationId.toString(),
      label: simulation.label,
      updatedAt: simulation.updatedAt || new Date().toISOString(),
    };

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to create simulation association');
    }

    const apiResponse = await response.json();

    // Convert API response back to UserSimulation
    return {
      id: parseInt(apiResponse.simulationId, 10),
      userId: parseInt(apiResponse.userId, 10),
      simulationId: parseInt(apiResponse.simulationId, 10),
      label: apiResponse.label,
      createdAt: apiResponse.createdAt,
      updatedAt: apiResponse.updatedAt,
      isCreated: true,
    };
  }

  async findByUser(userId: string): Promise<UserSimulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserSimulation
    return apiResponses.map((apiData: any) => ({
      id: parseInt(apiData.simulationId, 10),
      userId: parseInt(apiData.userId, 10),
      simulationId: parseInt(apiData.simulationId, 10),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    }));
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${simulationId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();

    // Convert API response to UserSimulation
    return {
      id: parseInt(apiData.simulationId, 10),
      userId: parseInt(apiData.userId, 10),
      simulationId: parseInt(apiData.simulationId, 10),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
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

export class SessionStorageSimulationStore implements UserSimulationStore {
  private readonly STORAGE_KEY = 'user-simulation-associations';

  async create(simulation: Omit<UserSimulation, 'id' | 'createdAt'>): Promise<UserSimulation> {
    const newSimulation: UserSimulation = {
      ...simulation,
      id: simulation.simulationId, // Use simulationId as the ID
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
    const numericUserId = parseInt(userId, 10);
    const simulations = this.getStoredSimulations();
    return simulations.filter((s) => s.userId === numericUserId);
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulation | null> {
    const numericUserId = parseInt(userId, 10);
    const numericSimulationId = parseInt(simulationId, 10);
    const simulations = this.getStoredSimulations();
    return (
      simulations.find(
        (s) => s.userId === numericUserId && s.simulationId === numericSimulationId
      ) || null
    );
  }

  private getStoredSimulations(): UserSimulation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredSimulations(simulations: UserSimulation[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(simulations));
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
