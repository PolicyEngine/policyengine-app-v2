import {
  AccountAssociationRoutes,
  BrowserOnlyIdError,
  isAccountId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { clampStoreText } from '@/libs/flagship/storeText';
import type { Household } from '@/models/Household';
import { householdFromV2Item, householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import type {
  UserHouseholdCreateBody,
  UserHouseholdItem,
  UserHouseholdPatchBody,
  V2HouseholdItem,
} from '@/types/v2Households';
import type { AssociationCountryId, V2ItemResult } from '@/types/v2User';

/**
 * v3's saved households, in the account (signed in, or signed out as this
 * browser's unauthenticated user). A household's content is stored once
 * on the Public API's `/v2/households`, which never changes a household
 * and returns the existing one for identical content; the user's saved
 * household is a `/v2/user-households` row holding their name for it and
 * the household's v2 id. An edit stores the new content and points the
 * saved household at it, so the saved household keeps its id. Without
 * accounts there are no saved households.
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

/** What changed in a saved household: its content, its label, or both. */
export interface SavedHouseholdChanges {
  /** The edited household; left out when its content is unchanged. */
  household?: Household;
  /** The new label; left out when it is unchanged. */
  label?: string;
}

export interface SavedHouseholdStore {
  /** This session's saved households, most recently updated first. */
  list: () => Promise<ListedSavedHousehold[]>;
  /** A saved household with its household; null when it does not exist (or is someone else's). */
  get: (savedHouseholdId: string) => Promise<SavedHousehold | null>;
  save: (args: { household: Household; label: string }) => Promise<SavedHousehold>;
  rename: (savedHouseholdId: string, label: string) => Promise<SavedHouseholdRow>;
  /** Deletes the saved row; the stored household stays, as households are shared. */
  remove: (savedHouseholdId: string) => Promise<void>;
  /**
   * Saves changes to a saved household, keeping its id: edited content is
   * stored and the saved household pointed at it, in one request with any
   * new label.
   */
  saveChanges: (saved: SavedHousehold, changes: SavedHouseholdChanges) => Promise<SavedHousehold>;
}

/** A saved row that names no v2 household cannot be opened in v3. */
export class SavedHouseholdUnavailableError extends Error {
  constructor() {
    super('This saved household cannot be opened here: it was saved before households moved.');
    this.name = 'SavedHouseholdUnavailableError';
  }
}

/**
 * The saved household could not be changed: it still holds what it held
 * before. Edited content may already be stored, which changes nothing, as
 * a stored household belongs to no one until a saved household points at it.
 */
export class SavedHouseholdChangesNotSavedError extends Error {
  constructor(cause: unknown) {
    super(
      `Your changes were not saved: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause }
    );
    this.name = 'SavedHouseholdChangesNotSavedError';
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

function savedHouseholdOf(
  item: UserHouseholdItem,
  householdId: string,
  household: Household
): SavedHousehold {
  return { ...rowOf(item), householdId, household };
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
        return outcome.status === 'fulfilled' && row.household_id
          ? savedHouseholdOf(row, row.household_id, outcome.value)
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
    return savedHouseholdOf(
      row,
      row.household_id,
      await this.fetchHousehold(row.country_id, row.household_id)
    );
  }

  async save({ household, label }: { household: Household; label: string }) {
    const stored = await this.storeHousehold(household);
    const row = await this.routes.create<UserHouseholdCreateBody>({
      country_id: stored.country_id,
      household_id: stored.id,
      name: nameFor(label),
    });
    return savedHouseholdOf(row, stored.id, householdFromV2Item(stored));
  }

  async rename(savedHouseholdId: string, label: string): Promise<SavedHouseholdRow> {
    const body: UserHouseholdPatchBody = { name: nameFor(label) };
    return rowOf(await this.routes.patch(savedHouseholdId, body));
  }

  remove(savedHouseholdId: string): Promise<void> {
    return this.routes.delete(savedHouseholdId);
  }

  async saveChanges(
    saved: SavedHousehold,
    { household, label }: SavedHouseholdChanges
  ): Promise<SavedHousehold> {
    // Checked before anything is stored: a household saved only in this
    // browser has no saved row to point at the edit.
    if (!isAccountId(saved.id)) {
      throw new BrowserOnlyIdError();
    }
    const stored = household ? await this.storeHousehold(household) : null;
    const body: UserHouseholdPatchBody = {};
    // Identical content is the stored household the saved one already points at.
    if (stored && stored.id !== saved.householdId) {
      body.household_id = stored.id;
    }
    if (label !== undefined && nameFor(label) !== saved.label) {
      body.name = nameFor(label);
    }
    const nextHousehold = stored ? householdFromV2Item(stored) : saved.household;
    if (Object.keys(body).length === 0) {
      return { ...saved, household: nextHousehold };
    }
    let row: UserHouseholdItem;
    try {
      row = await this.routes.patch(saved.id, body);
    } catch (error) {
      throw new SavedHouseholdChangesNotSavedError(error);
    }
    return savedHouseholdOf(row, row.household_id ?? saved.householdId, nextHousehold);
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
