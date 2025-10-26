import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import { UserPolicyCreationPayload } from '@/types/payloads';
import { UserPolicy } from '../types/ingredients/UserPolicy';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string, countryId?: string) => Promise<UserPolicy[]>;
  findById: (userId: string, policyId: string) => Promise<UserPolicy | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, policyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy>;
  // delete(userId: string, policyId: string): Promise<void>;
}

export class ApiPolicyStore implements UserPolicyStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-policy-associations';

  async create(policy: Omit<UserPolicy, 'id' | 'createdAt'>): Promise<UserPolicy> {
    const payload: UserPolicyCreationPayload = UserPolicyAdapter.toCreationPayload(policy);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create policy association');
    }

    const apiResponse = await response.json();
    return UserPolicyAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserPolicy[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserPolicy and filter by country if specified
    const policies = apiResponses.map((apiData: any) => UserPolicyAdapter.fromApiResponse(apiData));
    return countryId ? policies.filter((p: UserPolicy) => p.countryId === countryId) : policies;
  }

  async findById(userId: string, policyId: string): Promise<UserPolicy | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${policyId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserPolicyAdapter.fromApiResponse(apiData);
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, policyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy> {
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
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, policyId: string): Promise<void> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class LocalStoragePolicyStore implements UserPolicyStore {
  private readonly STORAGE_KEY = 'user-policy-associations';

  async create(policy: Omit<UserPolicy, 'id' | 'createdAt'>): Promise<UserPolicy> {
    const newPolicy: UserPolicy = {
      ...policy,
      id: policy.policyId, // Use policyId as the ID
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const policies = this.getStoredPolicies();

    // Check for duplicates
    const exists = policies.some(
      (p) => p.userId === policy.userId && p.policyId === policy.policyId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedPolicies = [...policies, newPolicy];
    this.setStoredPolicies(updatedPolicies);

    return newPolicy;
  }

  async findByUser(userId: string, countryId?: string): Promise<UserPolicy[]> {
    const policies = this.getStoredPolicies();
    return policies.filter((p) => p.userId === userId && (!countryId || p.countryId === countryId));
  }

  async findById(userId: string, policyId: string): Promise<UserPolicy | null> {
    const policies = this.getStoredPolicies();
    return policies.find((p) => p.userId === userId && p.policyId === policyId) || null;
  }

  private getStoredPolicies(): UserPolicy[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      // Data is already in application format (UserPolicy), just ensure type coercion
      return parsed.map((data: any) => ({
        ...data,
        id: String(data.id),
        userId: String(data.userId),
        policyId: String(data.policyId),
      }));
    } catch {
      return [];
    }
  }

  private setStoredPolicies(policies: UserPolicy[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(policies));
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, policyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy> {
    const policies = this.getStoredPolicies();
    const index = policies.findIndex(
      a => a.userId === userId && a.policyId === policyId
    );

    if (index === -1) {
      throw new Error('Association not found');
    }

    const updated = { ...policies[index], ...updates };
    policies[index] = updated;
    this.setStoredPolicies(policies);

    return updated;
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, policyId: string): Promise<void> {
    const policies = this.getStoredPolicies();
    const filtered = policies.filter(
      a => !(a.userId === userId && a.policyId === policyId)
    );
    this.setStoredPolicies(filtered);
  }
  */
}
