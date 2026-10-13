import { UserHouseholdAdapter } from '@/adapters/UserHouseholdAdapter';
import { AccountAssociationRoutes, isLegacyId, type ApiStoreContext } from '@/api/v2Associations';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { isAssociationCountry, type UserHouseholdItem } from '@/types/v2User';

export interface UserHouseholdStore {
  create: (association: UserHouseholdPopulation) => Promise<UserHouseholdPopulation>;
  findByUser: (userId: string, countryId?: string) => Promise<UserHouseholdPopulation[]>;
  findById: (userId: string, householdId: string) => Promise<UserHouseholdPopulation | null>;
  update: (
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ) => Promise<UserHouseholdPopulation>;
  delete: (userHouseholdId: string) => Promise<void>;
}

/**
 * Account storage: `/v2/user-households` on the PolicyEngine API. The
 * server stamps the signed-in user onto each row; `userId` arguments are
 * never sent. Local IDs follow the shared policy in v2Associations.
 */
export class ApiHouseholdStore implements UserHouseholdStore {
  private readonly routes: AccountAssociationRoutes<UserHouseholdItem>;

  constructor(
    context: ApiStoreContext,
    private readonly local = new LocalStorageHouseholdStore()
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-households', 'UserHousehold');
  }

  private countryOf(household: Pick<UserHouseholdPopulation, 'countryId'>) {
    return isAssociationCountry(household.countryId) ? household.countryId : this.routes.countryId;
  }

  async create(association: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    const item = await this.routes.create(
      UserHouseholdAdapter.toCreationPayload(association, this.countryOf(association))
    );
    return UserHouseholdAdapter.fromApiItem(item);
  }

  async findByUser(_userId: string, countryId?: string): Promise<UserHouseholdPopulation[]> {
    if (countryId && countryId !== this.routes.countryId) {
      return [];
    }
    const items = await this.routes.list();
    return items
      .filter(UserHouseholdAdapter.hasLegacyHousehold)
      .map(UserHouseholdAdapter.fromApiItem);
  }

  async findById(_userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    if (!isLegacyId(householdId)) {
      return null;
    }
    const item = await this.routes.findFirst({ legacy_household_id: householdId });
    return item && UserHouseholdAdapter.hasLegacyHousehold(item)
      ? UserHouseholdAdapter.fromApiItem(item)
      : null;
  }

  async update(
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ): Promise<UserHouseholdPopulation> {
    const changes = UserHouseholdAdapter.toUpdatePayload(updates);
    if (this.routes.isLocalOnly(userHouseholdId)) {
      const local = this.local.findByUserHouseholdId(userHouseholdId);
      const merged = { ...(await this.routes.requireLocal(userHouseholdId, local)), ...updates };
      const body = UserHouseholdAdapter.toCreationPayload(merged, this.countryOf(merged));
      return UserHouseholdAdapter.fromApiItem(
        await this.routes.promote(userHouseholdId, body, changes)
      );
    }
    return UserHouseholdAdapter.fromApiItem(await this.routes.patch(userHouseholdId, changes));
  }

  delete(userHouseholdId: string): Promise<void> {
    return this.routes.isLocalOnly(userHouseholdId)
      ? this.local.delete(userHouseholdId)
      : this.routes.delete(userHouseholdId);
  }
}

export class LocalStorageHouseholdStore implements UserHouseholdStore {
  private readonly STORAGE_KEY = 'user-population-households';

  async create(household: UserHouseholdPopulation): Promise<UserHouseholdPopulation> {
    // Generate a unique ID for local storage
    // Format: "suh-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `suh-${timestamp}${random}`;

    const newHousehold: UserHouseholdPopulation = {
      ...household,
      type: 'household' as const,
      id: uniqueId,
      createdAt: household.createdAt || new Date().toISOString(),
      isCreated: true,
    };

    const households = this.getStoredHouseholds();

    const updatedHouseholds = [...households, newHousehold];
    this.setStoredHouseholds(updatedHouseholds);

    return newHousehold;
  }

  async findByUser(userId: string, countryId?: string): Promise<UserHouseholdPopulation[]> {
    const households = this.getStoredHouseholds();
    return households.filter(
      (h) => h.userId === userId && (!countryId || h.countryId === countryId)
    );
  }

  async findById(userId: string, householdId: string): Promise<UserHouseholdPopulation | null> {
    const households = this.getStoredHouseholds();
    return households.find((h) => h.userId === userId && h.householdId === householdId) || null;
  }

  /** The association by its own ID (`suh-…`). */
  async findByUserHouseholdId(userHouseholdId: string): Promise<UserHouseholdPopulation | null> {
    return this.getStoredHouseholds().find((household) => household.id === userHouseholdId) ?? null;
  }

  async update(
    userHouseholdId: string,
    updates: Partial<UserHouseholdPopulation>
  ): Promise<UserHouseholdPopulation> {
    const households = this.getStoredHouseholds();

    // Find by userHousehold.id (the "suh-" prefixed ID), NOT householdId
    const index = households.findIndex((h) => h.id === userHouseholdId);

    if (index === -1) {
      throw new Error(`UserHousehold with id ${userHouseholdId} not found`);
    }

    // Merge updates and set timestamp
    const updated: UserHouseholdPopulation = {
      ...households[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    households[index] = updated;
    this.setStoredHouseholds(households);

    return updated;
  }

  async delete(userHouseholdId: string): Promise<void> {
    this.setStoredHouseholds(this.getStoredHouseholds().filter((h) => h.id !== userHouseholdId));
  }

  private getStoredHouseholds(): UserHouseholdPopulation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      // Data is already in application format (UserHouseholdPopulation), just ensure type coercion
      return parsed.map((data: any) => ({
        ...data,
        id: String(data.id),
        userId: String(data.userId),
        householdId: String(data.householdId),
      }));
    } catch {
      return [];
    }
  }

  private setStoredHouseholds(households: UserHouseholdPopulation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(households));
    } catch (error) {
      throw new Error('Failed to store households in local storage');
    }
  }

  // Currently unused utility for syncing when user logs in
  getAllAssociations(): UserHouseholdPopulation[] {
    return this.getStoredHouseholds();
  }

  clearAllAssociations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
