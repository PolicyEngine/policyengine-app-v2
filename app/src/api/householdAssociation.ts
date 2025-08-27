import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export interface UserHouseholdStore {
  create: (association: UserHouseholdPopulation) => Promise<UserHouseholdPopulation>;
  findByUser: (userId: string) => Promise<UserHouseholdPopulation[]>;
  findById: (userId: string, householdId: string) => Promise<UserHouseholdPopulation | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, householdId: string, updates: Partial<UserHouseholdPopulation>): Promise<UserHouseholdPopulation>;
  // delete(userId: string, householdId: string): Promise<void>;
}

export class ApiHouseholdStore implements UserHouseholdStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-household-associations';

  async create(association: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    const payload = UserHouseholdAdapter.toCreationPayload(association);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create household association');
    }

    const apiResponse = await response.json();
    return UserHouseholdAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string): Promise<UserHouseholdPopulation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user households');
    }

    const apiResponses = await response.json();
    return apiResponses.map((apiData: any) => UserHouseholdAdapter.fromApiResponse(apiData));
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${householdId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserHouseholdAdapter.fromApiResponse(apiData);
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, householdId: string, updates: Partial<UserHousehold>): Promise<UserHousehold> {
    const response = await fetch(`/api/user-population-households/${userId}/${householdId}`, {
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
  async delete(userId: string, householdId: string): Promise<void> {
    const response = await fetch(`/api/user-population-households/${userId}/${householdId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class SessionStorageHouseholdStore implements UserHouseholdStore {
  private readonly STORAGE_KEY = 'user-population-households';

  async create(household: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    const newHousehold: UserHouseholdPopulation = {
      ...household,
      type: 'household' as const,
      id: household.householdId, // Use householdId as the ID
      createdAt: household.createdAt || new Date().toISOString(),
      isCreated: true,
    };

    const households = this.getStoredHouseholds();

    // Check for duplicates
    const exists = households.some(
      (h) => h.userId === household.userId && h.householdId === household.householdId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedHouseholds = [...households, newHousehold];
    this.setStoredHouseholds(updatedHouseholds);

    return newHousehold;
  }

  async findByUser(userId: string): Promise<UserHouseholdPopulation[]> {
    const households = this.getStoredHouseholds();
    return households.filter((h) => h.userId === userId);
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    const households = this.getStoredHouseholds();
    return households.find((h) => h.userId === userId && h.householdId === householdId) || null;
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, householdId: string, updates: Partial<UserHousehold>): Promise<UserHousehold> {
    const households = this.getStoredHouseholds();
    const index = households.findIndex(a => a.userId === userId && a.householdId === householdId);
    
    if (index === -1) {
      throw new Error('Association not found');
    }

    const updatedAssociation = { ...households[index], ...updates };
    households[index] = updatedAssociation;
    
    this.setStoredHouseholds(households);
    return updatedAssociation;
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, householdId: string): Promise<void> {
    const households = this.getStoredHouseholds();
    const filtered = households.filter(a => !(a.userId === userId && a.householdId === householdId));
    
    if (filtered.length === households.length) {
      throw new Error('Association not found');
    }

    this.setStoredHouseholds(filtered);
  }
  */

  private getStoredHouseholds(): UserHouseholdPopulation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredHouseholds(households: UserHouseholdPopulation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(households));
    } catch (error) {
      throw new Error('Failed to store households in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserHouseholdPopulation[] {
    return this.getStoredHouseholds();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
