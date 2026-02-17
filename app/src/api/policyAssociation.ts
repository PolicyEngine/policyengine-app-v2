import { UserPolicy } from '../types/ingredients/UserPolicy';
import {
  createUserPolicyAssociationV2,
  deleteUserPolicyAssociationV2,
  fetchUserPolicyAssociationByIdV2,
  fetchUserPolicyAssociationsV2,
  updateUserPolicyAssociationV2,
} from './v2/userPolicyAssociations';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string, countryId?: string) => Promise<UserPolicy[]>;
  findById: (userPolicyId: string) => Promise<UserPolicy | null>;
  update: (userPolicyId: string, updates: Partial<UserPolicy>, userId: string) => Promise<UserPolicy>;
  delete: (userPolicyId: string, userId: string) => Promise<void>;
}

export class ApiPolicyStore implements UserPolicyStore {
  async create(policy: Omit<UserPolicy, 'id' | 'createdAt'>): Promise<UserPolicy> {
    return createUserPolicyAssociationV2(policy);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserPolicy[]> {
    return fetchUserPolicyAssociationsV2(userId, countryId);
  }

  async findById(userPolicyId: string): Promise<UserPolicy | null> {
    return fetchUserPolicyAssociationByIdV2(userPolicyId);
  }

  async update(
    userPolicyId: string,
    updates: Partial<UserPolicy>,
    userId: string
  ): Promise<UserPolicy> {
    return updateUserPolicyAssociationV2(userPolicyId, userId, {
      label: updates.label ?? null,
    });
  }

  async delete(userPolicyId: string, userId: string): Promise<void> {
    return deleteUserPolicyAssociationV2(userPolicyId, userId);
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

  async findByUser(userId: string, countryId?: string): Promise<UserPolicy[]> {
    const policies = this.getStoredPolicies();
    return policies.filter(
      (p) => p.userId === userId && (!countryId || p.countryId === countryId)
    );
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

  async update(
    userPolicyId: string,
    updates: Partial<UserPolicy>,
    _userId: string
  ): Promise<UserPolicy> {
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

  async delete(userPolicyId: string, _userId: string): Promise<void> {
    const policies = this.getStoredPolicies();
    const index = policies.findIndex((p) => p.id === userPolicyId);

    if (index === -1) {
      throw new Error(`UserPolicy with id ${userPolicyId} not found`);
    }

    const filtered = policies.filter((p) => p.id !== userPolicyId);
    this.setStoredPolicies(filtered);
  }
}
