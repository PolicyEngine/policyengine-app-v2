// TODO: Replace with UserHousehold from ingredients when implemented
// For now, using a temporary type definition
type UserHousehold = {
  id?: string;
  userId: string;
  householdId: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
};

export interface UserHouseholdStore {
  create: (association: Omit<UserHousehold, 'createdAt'>) => Promise<UserHousehold>;
  findByUser: (userId: string) => Promise<UserHousehold[]>;
  findById: (userId: string, householdId: string) => Promise<UserHousehold | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, householdId: string, updates: Partial<UserHousehold>): Promise<UserHousehold>;
  // delete(userId: string, householdId: string): Promise<void>;
}

export class ApiHouseholdStore implements UserHouseholdStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-household-households';

  async create(association: Omit<UserHousehold, 'createdAt'>): Promise<UserHousehold> {
    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(association),
    });

    if (!response.ok) {
      throw new Error('Failed to create household association');
    }

    return response.json();
  }

  async findByUser(userId: string): Promise<UserHousehold[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user households');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserHousehold
    return apiResponses.map((apiData: any) => ({
      id: apiData.householdId,
      userId: apiData.userId,
      householdId: apiData.householdId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    }));
  }

  async findById(userId: string, householdId: string): Promise<UserHousehold | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${householdId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();

    // Convert API response to UserHousehold
    return {
      id: apiData.householdId,
      userId: apiData.userId,
      householdId: apiData.householdId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, householdId: string, updates: Partial<UserHousehold>): Promise<UserHousehold> {
    const response = await fetch(`/api/user-household-households/${userId}/${householdId}`, {
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
    const response = await fetch(`/api/user-household-households/${userId}/${householdId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class SessionStorageHouseholdStore implements UserHouseholdStore {
  private readonly STORAGE_KEY = 'user-household-households';

  async create(household: Omit<UserHousehold, 'id' | 'createdAt'>): Promise<UserHousehold> {
    const newHousehold: UserHousehold = {
      ...household,
      id: household.householdId, // Use householdId as the ID
      createdAt: new Date().toISOString(),
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

  async findByUser(userId: string): Promise<UserHousehold[]> {
    const households = this.getStoredHouseholds();
    return households.filter((h) => h.userId === userId);
  }

  async findById(userId: string, householdId: string): Promise<UserHousehold | null> {
    const households = this.getStoredHouseholds();
    return (
      households.find((h) => h.userId === userId && h.householdId === householdId) ||
      null
    );
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

  private getStoredHouseholds(): UserHousehold[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredHouseholds(households: UserHousehold[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(households));
    } catch (error) {
      throw new Error('Failed to store households in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserHousehold[] {
    return this.getStoredHouseholds();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
