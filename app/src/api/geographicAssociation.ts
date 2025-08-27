// src/api/geographicAssociation.ts

import { UserGeographicAdapter } from '@/adapters/UserGeographicAdapter';
import { UserGeographicAssociation } from '../types/userIngredientAssociations';

export interface UserGeographicStore {
  create: (
    association: Omit<UserGeographicAssociation, 'createdAt'>
  ) => Promise<UserGeographicAssociation>;
  findByUser: (userId: string) => Promise<UserGeographicAssociation[]>;
  findById: (userId: string, geographyId: string) => Promise<UserGeographicAssociation | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, geographyId: string, updates: Partial<UserGeographicAssociation>): Promise<UserGeographicAssociation>;
  // delete(userId: string, geographyId: string): Promise<void>;
}

export class ApiGeographicStore implements UserGeographicStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-geographic-associations';

  async create(
    association: Omit<UserGeographicAssociation, 'createdAt'>
  ): Promise<UserGeographicAssociation> {
    const payload = UserGeographicAdapter.toCreationPayload(association);

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

  async findByUser(userId: string): Promise<UserGeographicAssociation[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();
    return apiResponses.map((apiData: any) => UserGeographicAdapter.fromApiResponse(apiData));
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographicAssociation | null> {
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
  async update(userId: string, geographyId: string, updates: Partial<UserGeographicAssociation>): Promise<UserGeographicAssociation> {
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

  async create(
    association: Omit<UserGeographicAssociation, 'createdAt'>
  ): Promise<UserGeographicAssociation> {
    const newAssociation: UserGeographicAssociation = {
      ...association,
      createdAt: new Date().toISOString(),
    };

    const associations = this.getStoredAssociations();

    // Check for duplicates
    const exists = associations.some(
      (a) =>
        a.userId === association.userId && a.geographyIdentifier === association.geographyIdentifier
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedAssociations = [...associations, newAssociation];
    this.setStoredAssociations(updatedAssociations);

    return newAssociation;
  }

  async findByUser(userId: string): Promise<UserGeographicAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter((a) => a.userId === userId);
  }

  async findById(userId: string, geographyId: string): Promise<UserGeographicAssociation | null> {
    const associations = this.getStoredAssociations();
    return (
      associations.find((a) => a.userId === userId && a.geographyIdentifier === geographyId) || null
    );
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, geographyId: string, updates: Partial<UserGeographicAssociation>): Promise<UserGeographicAssociation> {
    const associations = this.getStoredAssociations();
    const index = associations.findIndex(a => a.userId === userId && a.geographyIdentifier === geographyId);
    
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
  async delete(userId: string, geographyId: string): Promise<void> {
    const associations = this.getStoredAssociations();
    const filtered = associations.filter(a => !(a.userId === userId && a.geographyIdentifier === geographyId));
    
    if (filtered.length === associations.length) {
      throw new Error('Association not found');
    }

    this.setStoredAssociations(filtered);
  }
  */

  private getStoredAssociations(): UserGeographicAssociation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredAssociations(associations: UserGeographicAssociation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(associations));
    } catch (error) {
      throw new Error('Failed to store associations in session storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserGeographicAssociation[] {
    return this.getStoredAssociations();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
