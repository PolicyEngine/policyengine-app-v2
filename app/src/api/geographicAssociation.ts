import { UserGeographicAdapter } from '@/adapters/UserGeographicAdapter';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

export interface UserGeographicStore {
  create: (population: UserGeographyPopulation) => Promise<UserGeographyPopulation>;
  findByUser: (userId: string) => Promise<UserGeographyPopulation[]>;
  findById: (userId: string, geographyId: string) => Promise<UserGeographyPopulation | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, geographyId: string, updates: Partial<UserGeographyPopulation>): Promise<UserGeographyPopulation>;
  // delete(userId: string, geographyId: string): Promise<void>;
}

export class ApiGeographicStore implements UserGeographicStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-geographic-associations';

  async create(population: UserGeographyPopulation): Promise<UserGeographyPopulation> {
    const payload = UserGeographicAdapter.toCreationPayload(population);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create geographic association');
    }

    const apiResponse = await response.json();
    return UserGeographicAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string): Promise<UserGeographyPopulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();
    return apiResponses.map((apiData: any) => UserGeographicAdapter.fromApiResponse(apiData));
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographyPopulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${geographyId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserGeographicAdapter.fromApiResponse(apiData);
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, geographyId: string, updates: Partial<UserGeographyPopulation>): Promise<UserGeographyPopulation> {
    const response = await fetch(`/api/user-geographic-associations/${userId}/${geographyId}`, {
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
  async delete(userId: string, geographyId: string): Promise<void> {
    const response = await fetch(`/api/user-geographic-associations/${userId}/${geographyId}`, {
      method: 'DELETE',
    });

    if !response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class SessionStorageGeographicStore implements UserGeographicStore {
  private readonly STORAGE_KEY = 'user-geographic-associations';

  async create(population: UserGeographyPopulation): Promise<UserGeographyPopulation> {
    const newPopulation: UserGeographyPopulation = {
      ...population,
      createdAt: population.createdAt || new Date().toISOString(),
    };

    const populations = this.getStoredPopulations();

    // Check for duplicates
    const exists = populations.some(
      (p) => p.userId === population.userId && p.geographyId === population.geographyId
    );

    if (exists) {
      throw new Error('Geographic population already exists');
    }

    const updatedPopulations = [...populations, newPopulation];
    this.setStoredPopulations(updatedPopulations);

    return newPopulation;
  }

  async findByUser(userId: string): Promise<UserGeographyPopulation[]> {
    const populations = this.getStoredPopulations();
    return populations.filter((p) => p.userId === userId);
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographyPopulation | null> {
    const populations = this.getStoredPopulations();
    return populations.find((p) => p.userId === userId && p.geographyId === geographyId) || null;
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, geographyId: string, updates: Partial<UserGeographyPopulation>): Promise<UserGeographyPopulation> {
    const populations = this.getStoredPopulations();
    const index = populations.findIndex(p => p.userId === userId && p.geographyId === geographyId);
    
    if (index === -1) {
      throw new Error('Geographic population not found');
    }

    const updatedPopulation = { ...populations[index], ...updates };
    populations[index] = updatedPopulation;
    
    this.setStoredPopulations(populations);
    return updatedPopulation;
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, geographyId: string): Promise<void> {
    const populations = this.getStoredPopulations();
    const filtered = populations.filter(p => !(p.userId === userId && p.geographyId === geographyId));
    
    if (filtered.length === populations.length) {
      throw new Error('Geographic population not found');
    }

    this.setStoredPopulations(filtered);
  }
  */

  private getStoredPopulations(): UserGeographyPopulation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredPopulations(populations: UserGeographyPopulation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(populations));
    } catch (error) {
      throw new Error('Failed to store geographic populations in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllPopulations(): UserGeographyPopulation[] {
    return this.getStoredPopulations();
  }

  clearAllPopulations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
