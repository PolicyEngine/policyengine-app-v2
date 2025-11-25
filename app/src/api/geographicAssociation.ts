import { UserGeographicAdapter } from '@/adapters/UserGeographicAdapter';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

export interface UserGeographicStore {
  create: (population: UserGeographyPopulation) => Promise<UserGeographyPopulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserGeographyPopulation[]>;
  findById: (userId: string, geographyId: string) => Promise<UserGeographyPopulation | null>;
  update: (
    userId: string,
    geographyId: string,
    updates: Partial<UserGeographyPopulation>
  ) => Promise<UserGeographyPopulation>;
  // The below are not yet implemented, but keeping for future use
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

  async findByUser(userId: string, countryId?: string): Promise<UserGeographyPopulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserGeographyPopulation and filter by country if specified
    const geographies = apiResponses.map((apiData: any) =>
      UserGeographicAdapter.fromApiResponse(apiData)
    );
    return countryId
      ? geographies.filter((g: UserGeographyPopulation) => g.countryId === countryId)
      : geographies;
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographyPopulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${geographyId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserGeographicAdapter.fromApiResponse(apiData);
  }

  async update(
    _userId: string,
    _geographyId: string,
    _updates: Partial<UserGeographyPopulation>
  ): Promise<UserGeographyPopulation> {
    // TODO: Implement when backend API endpoint is available
    // Expected endpoint: PUT /api/user-geographic-associations/:userId/:geographyId
    // Expected payload: UserGeographicUpdatePayload (to be created)

    console.warn(
      '[ApiGeographicStore.update] API endpoint not yet implemented. ' +
        'This method will be activated when user authentication is added.'
    );

    throw new Error(
      'Geographic population updates via API are not yet supported. ' +
        'Please ensure you are using localStorage mode.'
    );
  }

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

export class LocalStorageGeographicStore implements UserGeographicStore {
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

  async findByUser(userId: string, countryId?: string): Promise<UserGeographyPopulation[]> {
    const populations = this.getStoredPopulations();
    return populations.filter(
      (p) => p.userId === userId && (!countryId || p.countryId === countryId)
    );
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographyPopulation | null> {
    const populations = this.getStoredPopulations();
    return populations.find((p) => p.userId === userId && p.geographyId === geographyId) || null;
  }

  async update(
    userId: string,
    geographyId: string,
    updates: Partial<UserGeographyPopulation>
  ): Promise<UserGeographyPopulation> {
    const populations = this.getStoredPopulations();

    // Find by userId and geographyId composite key
    const index = populations.findIndex(
      (g) => g.userId === userId && g.geographyId === geographyId
    );

    if (index === -1) {
      throw new Error(
        `UserGeography with userId ${userId} and geographyId ${geographyId} not found`
      );
    }

    // Merge updates and set timestamp
    const updated: UserGeographyPopulation = {
      ...populations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    populations[index] = updated;
    this.setStoredPopulations(populations);

    return updated;
  }

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
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      // Data is already in application format (UserGeographyPopulation), just ensure type coercion
      return parsed.map((data: any) => ({
        ...data,
        id: String(data.id),
        userId: String(data.userId),
        geographyId: String(data.geographyId),
      }));
    } catch {
      return [];
    }
  }

  private setStoredPopulations(populations: UserGeographyPopulation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(populations));
    } catch (error) {
      throw new Error('Failed to store geographic populations in local storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllPopulations(): UserGeographyPopulation[] {
    return this.getStoredPopulations();
  }

  clearAllPopulations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
