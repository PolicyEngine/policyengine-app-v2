import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Saved geographies live in this browser's localStorage for everyone,
 * signed in or not; there is no account table for them.
 */
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

export class LocalStorageGeographicStore implements UserGeographicStore {
  private readonly STORAGE_KEY = 'user-geographic-associations';

  async create(population: UserGeographyPopulation): Promise<UserGeographyPopulation> {
    const newPopulation: UserGeographyPopulation = {
      ...population,
      createdAt: population.createdAt || new Date().toISOString(),
    };

    const populations = this.getStoredPopulations();

    // Allow duplicates - users can create multiple entries for the same geography
    // Each entry has a unique ID from the caller
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
