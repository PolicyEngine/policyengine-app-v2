import {
  createUserHouseholdAssociationV2,
  deleteUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationByIdV2,
  fetchUserHouseholdAssociationsV2,
  updateUserHouseholdAssociationV2,
} from '@/api/v2/userHouseholdAssociations';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export interface UserHouseholdStore {
  create: (association: UserHouseholdPopulation) => Promise<UserHouseholdPopulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserHouseholdPopulation[]>;
  findById: (userId: string, householdId: string) => Promise<UserHouseholdPopulation | null>;
  update: (
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ) => Promise<UserHouseholdPopulation>;
  delete: (associationId: string) => Promise<void>;
}

export class ApiHouseholdStore implements UserHouseholdStore {
  async create(association: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    return createUserHouseholdAssociationV2(association);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserHouseholdPopulation[]> {
    return fetchUserHouseholdAssociationsV2(userId, countryId);
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    return fetchUserHouseholdAssociationByIdV2(userId, householdId);
  }

  async update(
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ): Promise<UserHouseholdPopulation> {
    return updateUserHouseholdAssociationV2(userHouseholdId, {
      label: updates.label ?? null,
    });
  }

  async delete(associationId: string): Promise<void> {
    return deleteUserHouseholdAssociationV2(associationId);
  }
}

export class LocalStorageHouseholdStore implements UserHouseholdStore {
  private readonly STORAGE_KEY = 'user-population-households';

  async create(household: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    // Generate a unique ID for local storage
    // Format: "suh-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `suh-${timestamp}${random}`;

    const newHousehold: UserHouseholdPopulation = {
      ...household,
      type: 'household' as const,
      id: uniqueId,
      createdAt: household.createdAt || new Date().toISOString(),
      isCreated: true,
    };

    const households = this.getStoredHouseholds();

    const updatedHouseholds = [...households, newHousehold];
    this.setStoredHouseholds(updatedHouseholds);

    return newHousehold;
  }

  async findByUser(userId: string, countryId?: string): Promise<UserHouseholdPopulation[]> {
    const households = this.getStoredHouseholds();
    return households.filter(
      (h) => h.userId === userId && (!countryId || h.countryId === countryId)
    );
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    const households = this.getStoredHouseholds();
    return households.find((h) => h.userId === userId && h.householdId === householdId) || null;
  }

  async update(
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ): Promise<UserHouseholdPopulation> {
    const households = this.getStoredHouseholds();

    // Find by userHousehold.id (the "suh-" prefixed ID), NOT householdId
    const index = households.findIndex((h) => h.id === userHouseholdId);

    if (index === -1) {
      throw new Error(`UserHousehold with id ${userHouseholdId} not found`);
    }

    // Merge updates and set timestamp
    const updated: UserHouseholdPopulation = {
      ...households[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    households[index] = updated;
    this.setStoredHouseholds(households);

    return updated;
  }

  async delete(associationId: string): Promise<void> {
    const households = this.getStoredHouseholds();
    const filtered = households.filter((h) => h.id !== associationId);

    if (filtered.length === households.length) {
      throw new Error(`Association with id ${associationId} not found`);
    }

    this.setStoredHouseholds(filtered);
  }

  private getStoredHouseholds(): UserHouseholdPopulation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      // Data is already in application format (UserHouseholdPopulation), just ensure type coercion
      return parsed.map((data: any) => ({
        ...data,
        id: String(data.id),
        userId: String(data.userId),
        householdId: String(data.householdId),
      }));
    } catch {
      return [];
    }
  }

  private setStoredHouseholds(households: UserHouseholdPopulation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(households));
    } catch (error) {
      throw new Error('Failed to store households in local storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserHouseholdPopulation[] {
    return this.getStoredHouseholds();
  }

  clearAllAssociations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
