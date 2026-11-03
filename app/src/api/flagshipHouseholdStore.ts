import { AccountAssociationRoutes, isLegacyId, type ApiStoreContext } from '@/api/v2Associations';
import { clampStoreText } from '@/libs/flagship/storeText';
import type { UserHouseholdCreateBody, UserHouseholdItem } from '@/types/v2User';

/**
 * The households v3 calculates, saved to the user as `/v2/user-households`
 * rows that point at the v1 household (`legacy_household_id`), as v3 saves
 * its reforms and reports. Nothing in v3 reads these rows yet: they keep
 * each user's households for the PolicyEngine API's v2 household routes.
 */
export class ApiFlagshipHouseholdStore {
  private readonly routes: AccountAssociationRoutes<UserHouseholdItem>;

  constructor(context: ApiStoreContext) {
    this.routes = new AccountAssociationRoutes(context, 'user-households', 'Household');
  }

  /**
   * The user's row for a calculated v1 household: the one already saved,
   * or a new one named with the household's summary.
   */
  async saveCalculated({
    householdId,
    name,
  }: {
    /** The v1 household ID the calculation created. */
    householdId: string;
    name: string;
  }): Promise<UserHouseholdItem> {
    if (!isLegacyId(householdId)) {
      throw new Error(`Household ${householdId} is not a v1 household, so it cannot be saved`);
    }
    const legacyHouseholdId = Number(householdId);
    const saved = await this.routes.findFirst({ legacy_household_id: legacyHouseholdId });
    if (saved) {
      return saved;
    }
    const body: UserHouseholdCreateBody = {
      country_id: this.routes.countryId,
      legacy_household_id: legacyHouseholdId,
      name: clampStoreText(name) || null,
    };
    return this.routes.create(body);
  }
}
