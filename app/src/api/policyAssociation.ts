import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import { UserPolicyCreationMetadata } from '@/types/metadata/userPolicyMetadata';
import { UserPolicy } from '../types/ingredients/UserPolicy';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string, taxBenefitModelId?: string) => Promise<UserPolicy[]>;
  findById: (userPolicyId: string) => Promise<UserPolicy | null>;
  update: (userPolicyId: string, updates: Partial<UserPolicy>) => Promise<UserPolicy>;
  delete: (userPolicyId: string) => Promise<void>;
}

export class ApiPolicyStore implements UserPolicyStore {
  private readonly BASE_URL = '/user-policies';

  async create(policy: Omit<UserPolicy, 'id' | 'createdAt'>): Promise<UserPolicy> {
    const payload: UserPolicyCreationMetadata = UserPolicyAdapter.toCreationPayload(policy);

    const response = await fetch(`${this.BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create policy association');
    }

    const apiResponse = await response.json();
    return UserPolicyAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string, taxBenefitModelId?: string): Promise<UserPolicy[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (taxBenefitModelId) {
      params.append('tax_benefit_model_id', taxBenefitModelId);
    }

    const response = await fetch(`${this.BASE_URL}/?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();
    return apiResponses.map((apiData: any) => UserPolicyAdapter.fromApiResponse(apiData));
  }

  async findById(userPolicyId: string): Promise<UserPolicy | null> {
    const response = await fetch(`${this.BASE_URL}/${userPolicyId}`, {
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

  async update(userPolicyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy> {
    const payload = UserPolicyAdapter.toUpdatePayload(updates);

    const response = await fetch(`${this.BASE_URL}/${userPolicyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      throw new Error('User-policy association not found');
    }

    if (!response.ok) {
      throw new Error('Failed to update policy association');
    }

    const apiData = await response.json();
    return UserPolicyAdapter.fromApiResponse(apiData);
  }

  async delete(userPolicyId: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${userPolicyId}`, {
      method: 'DELETE',
    });

    if (response.status === 404) {
      throw new Error('User-policy association not found');
    }

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
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

  async findByUser(userId: string, _taxBenefitModelId?: string): Promise<UserPolicy[]> {
    const policies = this.getStoredPolicies();
    // LocalStorage doesn't have tax_benefit_model context - return all user's policies
    // The underlying Policy contains tax_benefit_model_id, which would require fetching policy data
    return policies.filter((p) => p.userId === userId);
  }

  async findById(userPolicyId: string): Promise<UserPolicy | null> {
    const policies = this.getStoredPolicies();
    return policies.find((p) => p.id === userPolicyId) || null;
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
    } catch (error) {
      console.error(
        '[LocalStoragePolicyStore.getStoredPolicies] Failed to parse stored policies. ' +
          'Data may be corrupted. Returning empty array.',
        error
      );
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

  async delete(userPolicyId: string): Promise<void> {
    const policies = this.getStoredPolicies();
    const index = policies.findIndex((p) => p.id === userPolicyId);

    if (index === -1) {
      throw new Error(`UserPolicy with id ${userPolicyId} not found`);
    }

    const filtered = policies.filter((p) => p.id !== userPolicyId);
    this.setStoredPolicies(filtered);
  }
}
