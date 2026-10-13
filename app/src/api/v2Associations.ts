import { isV2ApiError, V2ApiError, type V2Query, type V2UserClient } from '@/api/v2UserClient';
import { recordImportedIds, resolveImportedId } from '@/libs/auth/importedIds';
import {
  isAssociationCountry,
  type AssociationCountryId,
  type V2ItemResult,
  type V2PageResult,
} from '@/types/v2User';

/**
 * Local IDs: how every account store treats the IDs it is handed.
 *
 * - A UUID, or a local ID this browser imported, names an account row.
 * - Any other local ID (`sup-`, `suh-`, `sus-`, `sur-`, `lfr-`, `rf-`)
 *   names an item only this browser has: saved while signed out and never
 *   imported. Reading it reads this browser's copy. Changing it first
 *   copies it into the account under its local ID as `client_ref` and
 *   records the mapping, so links keep resolving and a later import finds
 *   that row instead of adding a second one. Deleting it deletes this
 *   browser's copy.
 */

/** What every account row carries. */
export interface AccountRow {
  id: string;
  client_ref: string | null;
}

/**
 * What every account-backed store needs: an authenticated client, the
 * country its routes are called with (`country_id`), and the signed-in
 * PolicyEngine user (only used to resolve this browser's imported local
 * IDs — the server derives the owner from the token).
 */
export interface ApiStoreContext {
  client: V2UserClient;
  countryId: AssociationCountryId;
  userId: string;
}

/**
 * v1 artifact IDs are positive integers on the wire; the app carries them
 * as strings. Anything else cannot be saved to an account.
 */
export function isLegacyId(value: unknown): value is string | number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }
  const text = String(value).trim();
  return /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text) >= 1;
}

export function toLegacyId(value: string | number | null | undefined, what: string): number {
  if (!isLegacyId(value)) {
    throw new Error(`Cannot save ${what} ${String(value)}: it has no PolicyEngine API ID`);
  }
  return Number(String(value).trim());
}

/** The account association ID for an ID the UI holds (a UUID or an imported local ID). */
export function accountAssociationId(context: ApiStoreContext, id: string): string | null {
  return resolveImportedId(context.userId, id);
}

/** Drops undefined fields so a patch carries only what the caller set. */
export function definedFields<T extends object>(body: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * The five operations every `/v2/user-*` resource supports, scoped to the
 * store's country. Stores map items to app types; this class owns the
 * wire calls and the local-ID → UUID resolution.
 */
export class AccountAssociationRoutes<TItem extends AccountRow> {
  constructor(
    private readonly context: ApiStoreContext,
    private readonly path: string,
    private readonly what: string
  ) {}

  get countryId(): AssociationCountryId {
    return this.context.countryId;
  }

  /**
   * The country a write goes to: the item's own when it has account
   * storage, otherwise the store's (the page's) country.
   */
  writeCountry(itemCountryId: unknown): AssociationCountryId {
    return isAssociationCountry(itemCountryId) ? itemCountryId : this.context.countryId;
  }

  async create<TBody extends { country_id: AssociationCountryId }>(body: TBody): Promise<TItem> {
    const result = await this.context.client.request<V2ItemResult<TItem>>('POST', this.path, {
      query: { country_id: body.country_id },
      body,
    });
    return result.item;
  }

  /** Rows in `countryId` (default: the store's country). */
  list(
    filters: V2Query = {},
    countryId: AssociationCountryId = this.context.countryId
  ): Promise<TItem[]> {
    return this.context.client.listAll<TItem>(this.path, { ...filters, country_id: countryId });
  }

  /** The first (oldest) row matching a list filter, or null. */
  async findFirst(filters: V2Query): Promise<TItem | null> {
    const page = await this.context.client.request<V2PageResult<TItem>>('GET', this.path, {
      query: { ...filters, country_id: this.context.countryId, limit: 1 },
    });
    return page.items[0] ?? null;
  }

  /** Whether the ID names an item only this browser has (see "Local IDs" above). */
  isLocalOnly(id: string): boolean {
    return accountAssociationId(this.context, id) === null;
  }

  /** This browser's copy of a local-only item; not found (404) when it has none. */
  async requireLocal<T>(localId: string, lookup: Promise<T | null>): Promise<T> {
    const copy = await lookup;
    if (!copy) {
      throw new V2ApiError(404, `${this.what} with id ${localId} not found`);
    }
    return copy;
  }

  /**
   * Copies a local-only item into the account under its local ID and
   * records the mapping. If the account already has that `client_ref` (an
   * import or another tab got there first), `changes` go to that row.
   */
  async promote<TBody extends { country_id: AssociationCountryId }>(
    localId: string,
    body: TBody,
    changes: object
  ): Promise<TItem> {
    let item: TItem;
    try {
      item = await this.create({ ...body, client_ref: localId });
    } catch (error) {
      if (!isV2ApiError(error, 409)) {
        throw error;
      }
      // Look for it in the country it was created in.
      const existing = (await this.list({}, body.country_id)).find(
        (row) => row.client_ref === localId
      );
      if (!existing) {
        throw error;
      }
      item =
        Object.keys(changes).length > 0
          ? await this.patch(existing.id, changes, body.country_id)
          : existing;
    }
    recordImportedIds(this.context.userId, { [localId]: item.id });
    return item;
  }

  /** The row with this ID; null when it does not exist or belongs to someone else. */
  async get(id: string): Promise<TItem | null> {
    const accountId = accountAssociationId(this.context, id);
    if (!accountId) {
      return null;
    }
    try {
      const result = await this.context.client.request<V2ItemResult<TItem>>(
        'GET',
        `${this.path}/${encodeURIComponent(accountId)}`,
        { query: { country_id: this.context.countryId } }
      );
      return result.item;
    } catch (error) {
      if (isV2ApiError(error, 404)) {
        return null;
      }
      throw error;
    }
  }

  /** Applies only the supplied fields; an empty patch just reads the row. */
  async patch(
    id: string,
    body: object,
    countryId: AssociationCountryId = this.context.countryId
  ): Promise<TItem> {
    const accountId = this.requireId(id);
    const result = await this.context.client.request<V2ItemResult<TItem>>(
      Object.keys(body).length === 0 ? 'GET' : 'PATCH',
      `${this.path}/${encodeURIComponent(accountId)}`,
      {
        query: { country_id: countryId },
        ...(Object.keys(body).length === 0 ? {} : { body }),
      }
    );
    return result.item;
  }

  async delete(id: string): Promise<void> {
    const accountId = this.requireId(id);
    await this.context.client.request<void>(
      'DELETE',
      `${this.path}/${encodeURIComponent(accountId)}`,
      { query: { country_id: this.context.countryId } }
    );
  }

  private requireId(id: string): string {
    const accountId = accountAssociationId(this.context, id);
    if (!accountId) {
      throw new V2ApiError(404, `${this.what} with id ${id} not found`);
    }
    return accountId;
  }
}
