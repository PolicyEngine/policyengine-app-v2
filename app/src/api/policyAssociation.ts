import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import { UserPolicyCreationPayload } from '@/types/payloads';
import { UserPolicy } from '../types/ingredients/UserPolicy';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string, countryId?: string) => Promise<UserPolicy[]>;
  findById: (userId: string, policyId: string) => Promise<UserPolicy | null>;
  update: (userPolicyId: string, updates: Partial<UserPolicy>) => Promise<UserPolicy>;
  // The below are not yet implemented, but keeping for future use
  // delete(userPolicyId: string): Promise<void>;
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

  async update(_userPolicyId: string, _updates: Partial<UserPolicy>): Promise<UserPolicy> {
    // TODO: Implement when backend API endpoint is available
    // Expected endpoint: PUT /api/user-policy-associations/:userPolicyId
    // Expected payload: UserPolicyUpdatePayload (to be created)

    console.warn(
      '[ApiPolicyStore.update] API endpoint not yet implemented. ' +
        'This method will be activated when user authentication is added.'
    );

    throw new Error(
      'Policy updates via API are not yet supported. ' +
        'Please ensure you are using localStorage mode.'
    );
  }

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
    // Generate a unique ID for local storage
    // Format: "sup-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `sup-${timestamp}${random}`;

    const newPolicy: UserPolicy = {
      ...policy,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const policies = this.getStoredPolicies();

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

  async update(userPolicyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy> {
    const policies = this.getStoredPolicies();

    // Find by userPolicy.id (the "sup-" prefixed ID), NOT policyId
    const index = policies.findIndex((p) => p.id === userPolicyId);

    if (index === -1) {
      throw new Error(`UserPolicy with id ${userPolicyId} not found`);
    }

    // Merge updates and set timestamp
    const updated: UserPolicy = {
      ...policies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    policies[index] = updated;
    this.setStoredPolicies(policies);

    return updated;
  }

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
