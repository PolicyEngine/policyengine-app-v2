import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export interface UserHouseholdStore {
  create: (association: UserHouseholdPopulation) => Promise<UserHouseholdPopulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserHouseholdPopulation[]>;
  findById: (userId: string, householdId: string) => Promise<UserHouseholdPopulation | null>;
  update: (userHouseholdId: string, updates: Partial<UserHouseholdPopulation>) => Promise<UserHouseholdPopulation>;
  // The below are not yet implemented, but keeping for future use
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

  async findByUser(userId: string, countryId?: string): Promise<UserHouseholdPopulation[]> {
    const url = countryId
      ? `${this.BASE_URL}/user/${userId}?country_id=${countryId}`
      : `${this.BASE_URL}/user/${userId}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user households');
    }

    const apiResponses = await response.json();
    return apiResponses.map((apiData: any) => UserHouseholdAdapter.fromApiResponse(apiData));
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${householdId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserHouseholdAdapter.fromApiResponse(apiData);
  }

  async update(userHouseholdId: string, updates: Partial<UserHouseholdPopulation>): Promise<UserHouseholdPopulation> {
    // TODO: Implement when backend API endpoint is available
    // Expected endpoint: PUT /api/user-household-associations/:userHouseholdId
    // Expected payload: UserHouseholdUpdatePayload (to be created)

    console.warn(
      '[ApiHouseholdStore.update] API endpoint not yet implemented. ' +
        'This method will be activated when user authentication is added.'
    );

    throw new Error(
      'Household updates via API are not yet supported. ' + 'Please ensure you are using localStorage mode.'
    );
  }

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

  async update(userHouseholdId: string, updates: Partial<UserHouseholdPopulation>): Promise<UserHouseholdPopulation> {
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
