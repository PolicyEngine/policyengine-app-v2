import { isV2ApiError, V2ApiError, type V2Query, type V2UserClient } from '@/api/v2UserClient';
import {
  isAssociationCountry,
  type AssociationCountryId,
  type V2ItemResult,
  type V2PageResult,
} from '@/types/v2User';

/**
 * What every v3 account store needs: an authenticated client and the
 * country its routes are called with (`country_id`). The server derives
 * the owner from the token.
 */
export interface ApiStoreContext {
  client: V2UserClient;
  countryId: AssociationCountryId;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Account rows have UUIDs; items saved in this browser (`rf-…`, `lfr-…`) never do. */
export function isAccountId(id: unknown): id is string {
  return typeof id === 'string' && UUID_PATTERN.test(id);
}

/**
 * What an account store answers when handed the ID of something saved in
 * this browser while signed out: signed in, only account items open.
 */
export class BrowserOnlyIdError extends Error {
  constructor() {
    super('This was saved on this browser while signed out. Sign out to open it.');
    this.name = 'BrowserOnlyIdError';
  }
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

/**
 * The operations every `/v2/user-*` resource supports, scoped to the
 * store's country. Stores map items to app types; this class owns the
 * wire calls. It accepts account IDs only.
 */
export class AccountAssociationRoutes<TItem> {
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

  list(filters: V2Query = {}): Promise<TItem[]> {
    return this.context.client.listAll<TItem>(this.path, {
      ...filters,
      country_id: this.context.countryId,
    });
  }

  /** The first (oldest) row matching a list filter, or null. */
  async findFirst(filters: V2Query): Promise<TItem | null> {
    const page = await this.context.client.request<V2PageResult<TItem>>('GET', this.path, {
      query: { ...filters, country_id: this.context.countryId, limit: 1 },
    });
    return page.items[0] ?? null;
  }

  /** The row with this ID; null when it does not exist or belongs to someone else. */
  async get(id: string): Promise<TItem | null> {
    const accountId = this.requireAccountId(id);
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
  async patch(id: string, body: object): Promise<TItem> {
    const accountId = this.requireAccountId(id);
    const result = await this.context.client.request<V2ItemResult<TItem>>(
      Object.keys(body).length === 0 ? 'GET' : 'PATCH',
      `${this.path}/${encodeURIComponent(accountId)}`,
      {
        query: { country_id: this.context.countryId },
        ...(Object.keys(body).length === 0 ? {} : { body }),
      }
    );
    return result.item;
  }

  async delete(id: string): Promise<void> {
    const accountId = this.requireAccountId(id);
    await this.context.client.request<void>(
      'DELETE',
      `${this.path}/${encodeURIComponent(accountId)}`,
      { query: { country_id: this.context.countryId } }
    );
  }

  private requireAccountId(id: string): string {
    if (!id.trim()) {
      throw new V2ApiError(404, `${this.what} with id ${id} not found`);
    }
    if (!isAccountId(id)) {
      throw new BrowserOnlyIdError();
    }
    return id;
  }
}
