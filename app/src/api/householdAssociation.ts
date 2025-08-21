import { UserHouseholdAssociation } from '../types/userIngredientAssociations';

export interface UserHouseholdStore {
  create: (
    association: Omit<UserHouseholdAssociation, 'createdAt'>
  ) => Promise<UserHouseholdAssociation>;
  findByUser: (userId: string) => Promise<UserHouseholdAssociation[]>;
  findById: (userId: string, householdId: string) => Promise<UserHouseholdAssociation | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, householdId: string, updates: Partial<UserHouseholdAssociation>): Promise<UserHouseholdAssociation>;
  // delete(userId: string, householdId: string): Promise<void>;
}

export class ApiHouseholdStore implements UserHouseholdStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-household-associations';

  async create(
    association: Omit<UserHouseholdAssociation, 'createdAt'>
  ): Promise<UserHouseholdAssociation> {
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

  async findByUser(userId: string): Promise<UserHouseholdAssociation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    return response.json();
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdAssociation | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${householdId}`);

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
  async update(userId: string, householdId: string, updates: Partial<UserHouseholdAssociation>): Promise<UserHouseholdAssociation> {
    const response = await fetch(`/api/user-household-associations/${userId}/${householdId}`, {
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
    const response = await fetch(`/api/user-household-associations/${userId}/${householdId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class SessionStorageHouseholdStore implements UserHouseholdStore {
  private readonly STORAGE_KEY = 'user-household-associations';

  async create(
    association: Omit<UserHouseholdAssociation, 'createdAt'>
  ): Promise<UserHouseholdAssociation> {
    const newAssociation: UserHouseholdAssociation = {
      ...association,
      createdAt: new Date().toISOString(),
    };

    const associations = this.getStoredAssociations();

    // Check for duplicates
    const exists = associations.some(
      (a) => a.userId === association.userId && a.householdId === association.householdId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedAssociations = [...associations, newAssociation];
    this.setStoredAssociations(updatedAssociations);

    return newAssociation;
  }

  async findByUser(userId: string): Promise<UserHouseholdAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter((a) => a.userId === userId);
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdAssociation | null> {
    const associations = this.getStoredAssociations();
    return associations.find((a) => a.userId === userId && a.householdId === householdId) || null;
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, householdId: string, updates: Partial<UserHouseholdAssociation>): Promise<UserHouseholdAssociation> {
    const associations = this.getStoredAssociations();
    const index = associations.findIndex(a => a.userId === userId && a.householdId === householdId);
    
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
  async delete(userId: string, householdId: string): Promise<void> {
    const associations = this.getStoredAssociations();
    const filtered = associations.filter(a => !(a.userId === userId && a.householdId === householdId));
    
    if (filtered.length === associations.length) {
      throw new Error('Association not found');
    }

    this.setStoredAssociations(filtered);
  }
  */

  private getStoredAssociations(): UserHouseholdAssociation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredAssociations(associations: UserHouseholdAssociation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(associations));
    } catch (error) {
      throw new Error('Failed to store associations in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserHouseholdAssociation[] {
    return this.getStoredAssociations();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
