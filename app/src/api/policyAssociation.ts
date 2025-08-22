import { UserPolicy } from '../types/ingredients/UserPolicy';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string) => Promise<UserPolicy[]>;
  findById: (userId: string, policyId: string) => Promise<UserPolicy | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, policyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy>;
  // delete(userId: string, policyId: string): Promise<void>;
}

export class ApiPolicyStore implements UserPolicyStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-policy-associations';

  async create(
    policy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): Promise<UserPolicy> {
    // Convert to API format (string IDs)
    const apiPayload = {
      userId: policy.userId.toString(),
      policyId: policy.policyId.toString(),
      label: policy.label,
      updatedAt: policy.updatedAt || new Date().toISOString(),
    };

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to create policy association');
    }

    const apiResponse = await response.json();
    
    // Convert API response back to UserPolicy
    return {
      id: parseInt(apiResponse.policyId),
      userId: parseInt(apiResponse.userId),
      policyId: parseInt(apiResponse.policyId),
      label: apiResponse.label,
      createdAt: apiResponse.createdAt,
      updatedAt: apiResponse.updatedAt,
      isCreated: true,
    };
  }

  async findByUser(userId: string): Promise<UserPolicy[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();
    
    // Convert each API response to UserPolicy
    return apiResponses.map((apiData: any) => ({
      id: parseInt(apiData.policyId),
      userId: parseInt(apiData.userId),
      policyId: parseInt(apiData.policyId),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    }));
  }

  async findById(userId: string, policyId: string): Promise<UserPolicy | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${policyId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    
    // Convert API response to UserPolicy
    return {
      id: parseInt(apiData.policyId),
      userId: parseInt(apiData.userId),
      policyId: parseInt(apiData.policyId),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
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

export class SessionStoragePolicyStore implements UserPolicyStore {
  private readonly STORAGE_KEY = 'user-policy-associations';

  async create(
    policy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): Promise<UserPolicy> {
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

  async findByUser(userId: string): Promise<UserPolicy[]> {
    const numericUserId = parseInt(userId);
    const policies = this.getStoredPolicies();
    return policies.filter((p) => p.userId === numericUserId);
  }

  async findById(userId: string, policyId: string): Promise<UserPolicy | null> {
    const numericUserId = parseInt(userId);
    const numericPolicyId = parseInt(policyId);
    const policies = this.getStoredPolicies();
    return (
      policies.find(
        (p) => p.userId === numericUserId && p.policyId === numericPolicyId
      ) || null
    );
  }

  private getStoredPolicies(): UserPolicy[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredPolicies(policies: UserPolicy[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(policies));
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