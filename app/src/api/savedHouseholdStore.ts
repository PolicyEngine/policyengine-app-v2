import {
  AccountAssociationRoutes,
  BrowserOnlyIdError,
  isAccountId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { replaceHouseholdBaseForAssociation } from '@/hooks/household/replaceHouseholdBaseForAssociation';
import { clampStoreText } from '@/libs/flagship/storeText';
import type { Household } from '@/models/Household';
import { householdFromV2Item, householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import type {
  UserHouseholdCreateBody,
  UserHouseholdItem,
  V2HouseholdItem,
} from '@/types/v2Households';
import type { AssociationCountryId, V2ItemResult } from '@/types/v2User';

/**
 * v3's saved households, in the account (signed in, or signed out as this
 * browser's unauthenticated user). A household's content is stored once
 * on the Public API's `/v2/households`, which never changes a household
 * and returns the existing one for identical content; the user's saved
 * household is a `/v2/user-households` row holding their name for it and
 * the household's v2 id. Without accounts there are no saved households.
 */

/** A saved household that opens: the user's row and the household it points at. */
export interface SavedHousehold {
  /** The saved-household row (an account UUID). */
  id: string;
  countryId: AssociationCountryId;
  /** The user's name for it; null when saved without one. */
  label: string | null;
  /** The stored v2 household. */
  householdId: string;
  household: Household;
  createdAt: string;
  updatedAt: string;
  unavailable?: false;
}

/**
 * A saved household that is listed but cannot open: its row names no v2
 * household (only a v1 one), or its household failed to load.
 */
export interface UnavailableSavedHousehold {
  id: string;
  countryId: AssociationCountryId;
  label: string | null;
  householdId: string | null;
  createdAt: string;
  updatedAt: string;
  unavailable: true;
}

export type ListedSavedHousehold = SavedHousehold | UnavailableSavedHousehold;

/** A saved row after a rename: the row's own fields, without its household. */
export type SavedHouseholdRow = Omit<UnavailableSavedHousehold, 'unavailable'>;

export interface SavedHouseholdStore {
  /** This session's saved households, most recently updated first. */
  list: () => Promise<ListedSavedHousehold[]>;
  /** A saved household with its household; null when it does not exist (or is someone else's). */
  get: (savedHouseholdId: string) => Promise<SavedHousehold | null>;
  save: (args: { household: Household; label: string }) => Promise<SavedHousehold>;
  rename: (savedHouseholdId: string, label: string) => Promise<SavedHouseholdRow>;
  /** Deletes the saved row; the stored household stays, as households are shared. */
  remove: (savedHouseholdId: string) => Promise<void>;
  /** Saves an edit: a new household, with the saved household pointed at it. */
  replaceHousehold: (saved: SavedHousehold, nextHousehold: Household) => Promise<SavedHousehold>;
}

/** A saved row that names no v2 household cannot be opened in v3. */
export class SavedHouseholdUnavailableError extends Error {
  constructor() {
    super('This saved household cannot be opened here: it was saved before households moved.');
    this.name = 'SavedHouseholdUnavailableError';
  }
}

/**
 * An edit was saved as a new saved household, but the earlier one could
 * not be removed: both are now saved, and the list shows both.
 */
export class SavedHouseholdRepointError extends Error {
  constructor(
    readonly replacement: SavedHousehold,
    cause: unknown
  ) {
    super(
      'The edited household was saved, but the earlier version could not be removed, so both are saved now. ' +
        `Delete the earlier one from your households. Original error: ${
          cause instanceof Error ? cause.message : String(cause)
        }`
    );
    this.name = 'SavedHouseholdRepointError';
  }
}

/** Most recently updated first. */
function byRecentUpdate<T extends { updatedAt: string; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((first, second) =>
    (second.updatedAt || second.createdAt).localeCompare(first.updatedAt || first.createdAt)
  );
}

function rowOf(item: UserHouseholdItem): SavedHouseholdRow {
  return {
    id: item.id,
    countryId: item.country_id,
    label: item.name,
    householdId: item.household_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function savedHouseholdOf(item: UserHouseholdItem, household: Household): SavedHousehold {
  return { ...rowOf(item), householdId: item.household_id!, household };
}

/** The user's name for a household, as the Public API takes it: at most 255 characters, else none. */
function nameFor(label: string): string | null {
  return clampStoreText(label.trim()) || null;
}

export class ApiSavedHouseholdStore implements SavedHouseholdStore {
  private readonly routes: AccountAssociationRoutes<UserHouseholdItem>;

  constructor(private readonly context: ApiStoreContext) {
    this.routes = new AccountAssociationRoutes(context, 'user-households', 'Saved household');
  }

  async list(): Promise<ListedSavedHousehold[]> {
    const rows = await this.routes.list();
    // A household that fails to load is listed as unavailable, rather than failing the list.
    const loaded = await Promise.allSettled(
      rows.map((row) =>
        row.household_id
          ? this.fetchHousehold(row.country_id, row.household_id)
          : Promise.reject(new SavedHouseholdUnavailableError())
      )
    );
    return byRecentUpdate(
      rows.map((row, index): ListedSavedHousehold => {
        const outcome = loaded[index];
        return outcome.status === 'fulfilled'
          ? savedHouseholdOf(row, outcome.value)
          : { ...rowOf(row), unavailable: true };
      })
    );
  }

  async get(savedHouseholdId: string): Promise<SavedHousehold | null> {
    const row = await this.routes.get(savedHouseholdId);
    if (!row) {
      return null;
    }
    if (!row.household_id) {
      throw new SavedHouseholdUnavailableError();
    }
    return savedHouseholdOf(row, await this.fetchHousehold(row.country_id, row.household_id));
  }

  async save({ household, label }: { household: Household; label: string }) {
    const stored = await this.storeHousehold(household);
    const row = await this.routes.create<UserHouseholdCreateBody>({
      country_id: stored.country_id,
      household_id: stored.id,
      name: nameFor(label),
    });
    return savedHouseholdOf(row, householdFromV2Item(stored));
  }

  async rename(savedHouseholdId: string, label: string): Promise<SavedHouseholdRow> {
    return rowOf(await this.routes.patch(savedHouseholdId, { name: nameFor(label) }));
  }

  remove(savedHouseholdId: string): Promise<void> {
    return this.routes.delete(savedHouseholdId);
  }

  async replaceHousehold(saved: SavedHousehold, nextHousehold: Household) {
    if (!isAccountId(saved.id)) {
      throw new BrowserOnlyIdError();
    }
    let storedNext: V2HouseholdItem | null = null;
    // A failure to delete the earlier row comes after the edit is saved, so
    // it is not a failed update: it is raised once the replacement returns.
    let earlierRowKept: unknown = null;
    const replacement = await replaceHouseholdBaseForAssociation({
      association: saved,
      nextHousehold,
      createHouseholdId: async (household) => {
        storedNext = await this.storeHousehold(household);
        return storedNext.id;
      },
      store: {
        update: async (_savedHouseholdId, { householdId }) => {
          const repointed = await this.repoint(
            saved,
            householdId,
            householdFromV2Item(storedNext!)
          );
          earlierRowKept = repointed.earlierRowKept;
          return repointed.savedHousehold;
        },
      },
    });
    if (earlierRowKept) {
      throw new SavedHouseholdRepointError(replacement, earlierRowKept);
    }
    return replacement;
  }

  /**
   * Points a saved household at another stored household. The Public API's
   * PATCH cannot set a v2 household_id, so the saved household is replaced:
   * a new row with the same name points at the household, then the earlier
   * row is deleted. The saved household's id changes; nothing else refers
   * to it. Identical content is the same stored household, and changes
   * nothing.
   */
  private async repoint(
    saved: SavedHousehold,
    householdId: string,
    household: Household
  ): Promise<{ savedHousehold: SavedHousehold; earlierRowKept: unknown }> {
    if (householdId === saved.householdId) {
      return { savedHousehold: { ...saved, household }, earlierRowKept: null };
    }
    const replacementRow = await this.routes.create<UserHouseholdCreateBody>({
      country_id: saved.countryId,
      household_id: householdId,
      name: saved.label,
    });
    const savedHousehold = savedHouseholdOf(replacementRow, household);
    try {
      await this.routes.delete(saved.id);
    } catch (error) {
      return { savedHousehold, earlierRowKept: error };
    }
    return { savedHousehold, earlierRowKept: null };
  }

  /** Stores a household's content (`POST /v2/households`), or finds the identical stored one. */
  private async storeHousehold(household: Household): Promise<V2HouseholdItem> {
    const body = householdToV2CreateBody(household);
    const result = await this.context.client.request<V2ItemResult<V2HouseholdItem>>(
      'POST',
      'households',
      { query: { country_id: body.country_id }, body }
    );
    return result.item;
  }

  private async fetchHousehold(countryId: string, householdId: string): Promise<Household> {
    const result = await this.context.client.request<V2ItemResult<V2HouseholdItem>>(
      'GET',
      `households/${encodeURIComponent(householdId)}`,
      { query: { country_id: countryId } }
    );
    return householdFromV2Item(result.item);
  }
}

/** The saved-household store for a session: the account's; none without accounts. */
export function getSavedHouseholdStore(
  account: ApiStoreContext | null | undefined
): SavedHouseholdStore | null {
  return account ? new ApiSavedHouseholdStore(account) : null;
}
