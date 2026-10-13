import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import { AccountAssociationRoutes, isLegacyId, type ApiStoreContext } from '@/api/v2Associations';
import { isAssociationCountry, type UserPolicyItem } from '@/types/v2User';
import { UserPolicy } from '../types/ingredients/UserPolicy';

export interface UserPolicyStore {
  create: (policy: Omit<UserPolicy, 'id' | 'createdAt'>) => Promise<UserPolicy>;
  findByUser: (userId: string, countryId?: string) => Promise<UserPolicy[]>;
  findById: (userId: string, policyId: string) => Promise<UserPolicy | null>;
  update: (userPolicyId: string, updates: Partial<UserPolicy>) => Promise<UserPolicy>;
  delete: (userPolicyId: string) => Promise<void>;
}

/**
 * Account storage: `/v2/user-policies` on the PolicyEngine API. The server
 * stamps the signed-in user onto each row; the `userId` arguments exist
 * for the localStorage interface and are never sent. Local IDs follow the
 * shared policy in v2Associations.
 */
export class ApiPolicyStore implements UserPolicyStore {
  private readonly routes: AccountAssociationRoutes<UserPolicyItem>;

  constructor(
    context: ApiStoreContext,
    private readonly local = new LocalStoragePolicyStore()
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-policies', 'UserPolicy');
  }

  private countryOf(policy: Pick<UserPolicy, 'countryId'>) {
    return isAssociationCountry(policy.countryId) ? policy.countryId : this.routes.countryId;
  }

  async create(policy: Omit<UserPolicy, 'id' | 'createdAt'>): Promise<UserPolicy> {
    const item = await this.routes.create(
      UserPolicyAdapter.toCreationPayload(policy, this.countryOf(policy))
    );
    return UserPolicyAdapter.fromApiItem(item);
  }

  async findByUser(_userId: string, countryId?: string): Promise<UserPolicy[]> {
    if (countryId && countryId !== this.routes.countryId) {
      return [];
    }
    const items = await this.routes.list();
    return items.filter(UserPolicyAdapter.hasLegacyPolicy).map(UserPolicyAdapter.fromApiItem);
  }

  /** The association for a v1 policy ID (the oldest, as localStorage returns the first). */
  async findById(_userId: string, policyId: string): Promise<UserPolicy | null> {
    if (!isLegacyId(policyId)) {
      return null;
    }
    const item = await this.routes.findFirst({ legacy_policy_id: policyId });
    return item && UserPolicyAdapter.hasLegacyPolicy(item)
      ? UserPolicyAdapter.fromApiItem(item)
      : null;
  }

  async update(userPolicyId: string, updates: Partial<UserPolicy>): Promise<UserPolicy> {
    const changes = UserPolicyAdapter.toUpdatePayload(updates);
    if (this.routes.isLocalOnly(userPolicyId)) {
      const local = this.local.findByUserPolicyId(userPolicyId);
      const merged = { ...(await this.routes.requireLocal(userPolicyId, local)), ...updates };
      const body = UserPolicyAdapter.toCreationPayload(merged, this.countryOf(merged));
      return UserPolicyAdapter.fromApiItem(await this.routes.promote(userPolicyId, body, changes));
    }
    return UserPolicyAdapter.fromApiItem(await this.routes.patch(userPolicyId, changes));
  }

  delete(userPolicyId: string): Promise<void> {
    return this.routes.isLocalOnly(userPolicyId)
      ? this.local.delete(userPolicyId)
      : this.routes.delete(userPolicyId);
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
    return policies.filter((p) => p.userId === userId && (!countryId || p.countryId === countryId));
  }

  async findById(userId: string, policyId: string): Promise<UserPolicy | null> {
    const policies = this.getStoredPolicies();
    return policies.find((p) => p.userId === userId && p.policyId === policyId) || null;
  }

  /** The association by its own ID (`sup-…`). */
  async findByUserPolicyId(userPolicyId: string): Promise<UserPolicy | null> {
    return this.getStoredPolicies().find((policy) => policy.id === userPolicyId) ?? null;
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
    this.setStoredPolicies(this.getStoredPolicies().filter((p) => p.id !== userPolicyId));
  }
}
