import { UserPolicyAssociation } from '../types/userIngredientAssociations';

export interface UserPolicyStore {
  create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation>;
  findByUser(userId: string): Promise<UserPolicyAssociation[]>;
  findByPolicy(policyId: string): Promise<UserPolicyAssociation[]>;
  findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null>;
  update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation>;
  delete(userId: string, policyId: string): Promise<void>;
}

export class ApiPolicyStore implements UserPolicyStore {
  async create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation> {
    const response = await fetch('/api/user-policy-associations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(association),
    });

    if (!response.ok) {
      throw new Error('Failed to create policy association');
    }

    return response.json();
  }

  // TODO: Check if this method is needed
  async findByUser(userId: string): Promise<UserPolicyAssociation[]> {
    const response = await fetch(`/api/user-policy-associations/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    return response.json();
  }

  async findByPolicy(policyId: string): Promise<UserPolicyAssociation[]> {
    const response = await fetch(`/api/user-policy-associations/policy/${policyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch policy associations');
    }

    return response.json();
  }

  async findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    return response.json();
  }

  async update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update association');
    }

    return response.json();
  }

  async delete(userId: string, policyId: string): Promise<void> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
}

export class SessionStoragePolicyStore implements UserPolicyStore {
  private readonly STORAGE_KEY = 'user-policy-associations';

  async create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation> {
    const newAssociation: UserPolicyAssociation = {
      ...association,
      createdAt: new Date().toISOString(),
    };

    const associations = this.getStoredAssociations();
    
    // Check for duplicates
    const exists = associations.some(
      a => a.userId === association.userId && a.policyId === association.policyId
    );
    
    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedAssociations = [...associations, newAssociation];
    this.setStoredAssociations(updatedAssociations);
    
    return newAssociation;
  }

  async findByUser(userId: string): Promise<UserPolicyAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter(a => a.userId === userId);
  }

  async findByPolicy(policyId: string): Promise<UserPolicyAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter(a => a.policyId === policyId);
  }

  async findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null> {
    const associations = this.getStoredAssociations();
    return associations.find(a => a.userId === userId && a.policyId === policyId) || null;
  }

  async update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation> {
    const associations = this.getStoredAssociations();
    const index = associations.findIndex(a => a.userId === userId && a.policyId === policyId);
    
    if (index === -1) {
      throw new Error('Association not found');
    }

    const updatedAssociation = { ...associations[index], ...updates };
    associations[index] = updatedAssociation;
    
    this.setStoredAssociations(associations);
    return updatedAssociation;
  }

  async delete(userId: string, policyId: string): Promise<void> {
    const associations = this.getStoredAssociations();
    const filtered = associations.filter(a => !(a.userId === userId && a.policyId === policyId));
    
    if (filtered.length === associations.length) {
      throw new Error('Association not found');
    }

    this.setStoredAssociations(filtered);
  }

  private getStoredAssociations(): UserPolicyAssociation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredAssociations(associations: UserPolicyAssociation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(associations));
    } catch (error) {
      throw new Error('Failed to store associations in session storage');
    }
  }

  // Utility for syncing when user logs in
  getAllAssociations(): UserPolicyAssociation[] {
    return this.getStoredAssociations();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}