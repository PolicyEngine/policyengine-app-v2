import { UserSimulation } from '../types/ingredients/UserSimulation';
import { UserSimulationAdapter } from '../adapters/UserSimulationAdapter';

// API response type with string IDs
type UserSimulationApiResponse = {
  userId: string;
  simulationId: string;
  label?: string;
  createdAt: string;
  updatedAt?: string;
  isCreated?: boolean;
};

export interface UserSimulationStore {
  create: (
    association: Omit<UserSimulationApiResponse, 'createdAt'>
  ) => Promise<UserSimulationApiResponse>;
  findByUser: (userId: string) => Promise<UserSimulationApiResponse[]>;
  findById: (userId: string, simulationId: string) => Promise<UserSimulationApiResponse | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, simulationId: string, updates: Partial<UserSimulationApiResponse>): Promise<UserSimulationApiResponse>;
  // delete(userId: string, simulationId: string): Promise<void>;
}

export class ApiSimulationStore implements UserSimulationStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-simulation-associations';

  async create(
    association: Omit<UserSimulationApiResponse, 'createdAt'>
  ): Promise<UserSimulationApiResponse> {
    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(association),
    });

    if (!response.ok) {
      throw new Error('Failed to create simulation association');
    }

    return response.json();
  }

  async findByUser(userId: string): Promise<UserSimulationApiResponse[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    return response.json();
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulationApiResponse | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${simulationId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    return response.json();
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, simulationId: string, updates: Partial<UserSimulationApiResponse>): Promise<UserSimulationApiResponse> {
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

  async create(
    association: Omit<UserSimulationApiResponse, 'createdAt'>
  ): Promise<UserSimulationApiResponse> {
    const newAssociation: UserSimulationApiResponse = {
      ...association,
      createdAt: new Date().toISOString(),
    };

    const associations = this.getStoredAssociations();

    // Check for duplicates
    const exists = associations.some(
      (a) => a.userId === association.userId && a.simulationId === association.simulationId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedAssociations = [...associations, newAssociation];
    this.setStoredAssociations(updatedAssociations);

    return newAssociation;
  }

  async findByUser(userId: string): Promise<UserSimulationApiResponse[]> {
    const associations = this.getStoredAssociations();
    return associations.filter((a) => a.userId === userId);
  }

  async findById(userId: string, simulationId: string): Promise<UserSimulationApiResponse | null> {
    const associations = this.getStoredAssociations();
    return associations.find((a) => a.userId === userId && a.simulationId === simulationId) || null;
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, simulationId: string, updates: Partial<UserSimulationApiResponse>): Promise<UserSimulationApiResponse> {
    const associations = this.getStoredAssociations();
    const index = associations.findIndex(a => a.userId === userId && a.simulationId === simulationId);
    
    if (index === -1) {
      throw new Error('Association not found');
    }

    const updatedAssociation = { ...associations[index], ...updates };
    associations[index] = updatedAssociation;
    
    this.setStoredAssociations(associations);
    return updatedAssociation;
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, simulationId: string): Promise<void> {
    const associations = this.getStoredAssociations();
    const filtered = associations.filter(a => !(a.userId === userId && a.simulationId === simulationId));
    
    if (filtered.length === associations.length) {
      throw new Error('Association not found');
    }

    this.setStoredAssociations(filtered);
  }
  */

  private getStoredAssociations(): UserSimulationApiResponse[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredAssociations(associations: UserSimulationApiResponse[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(associations));
    } catch (error) {
      throw new Error('Failed to store associations in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserSimulationApiResponse[] {
    return this.getStoredAssociations();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
