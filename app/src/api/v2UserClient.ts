import { BASE_URL } from '@/constants';
import type { V2Envelope, V2PageResult } from '@/types/v2User';

/**
 * Fetch wrapper for the PolicyEngine API's signed-in routes
 * (`${BASE_URL}/v2/me*` and `/v2/user-*`). Every request carries the
 * session's access token as `Authorization: Bearer …`; the server derives
 * the user from it, so callers never send a user ID. Responses are the
 * API's `{status, message, result}` envelope, unwrapped to `result`.
 */

/** Largest page the list routes serve. */
export const V2_MAX_PAGE_SIZE = 500;

/** A failed signed-in request: HTTP status (0 for a network failure) and the API's message. */
export class V2ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'V2ApiError';
    this.status = status;
  }
}

export function isV2ApiError(error: unknown, status?: number): error is V2ApiError {
  return error instanceof V2ApiError && (status === undefined || error.status === status);
}

export type AccessTokenGetter = () => Promise<string | null>;

type QueryValue = string | number | boolean | null | undefined;
export type V2Query = Record<string, QueryValue>;

export interface V2RequestOptions {
  query?: V2Query;
  body?: unknown;
}

export interface V2UserClient {
  /** Sends a request and returns the envelope's `result` (undefined for 204). */
  request: <R>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options?: V2RequestOptions
  ) => Promise<R>;
  /** Reads every page of a list route. */
  listAll: <T>(path: string, query?: V2Query) => Promise<T[]>;
}

export interface CreateV2UserClientOptions {
  getAccessToken: AccessTokenGetter;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Messages for errors that arrive without one from the API. 409 and 422
 * cover several causes on the server, so their messages name the likely
 * ones rather than asserting one.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was not valid.',
  401: 'Your session has ended. Sign in again to continue.',
  403: 'This account cannot use saved work.',
  404: 'Not found.',
  409: 'This conflicts with what is already saved: it may exist already, or be kept up to date from elsewhere.',
  413: 'Too much data in one request.',
  422: 'This could not be saved: something in it is not valid, or something it refers to may no longer exist.',
  503: 'Saved work is temporarily unavailable.',
};

function queryString(query: V2Query | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function readEnvelope(response: Response): Promise<V2Envelope<unknown> | null> {
  try {
    return (await response.json()) as V2Envelope<unknown>;
  } catch {
    return null;
  }
}

export function createV2UserClient({
  getAccessToken,
  baseUrl,
  fetchImpl,
}: CreateV2UserClientOptions): V2UserClient {
  async function request<R>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    { query, body }: V2RequestOptions = {}
  ): Promise<R> {
    let token: string | null;
    try {
      token = await getAccessToken();
    } catch {
      token = null;
    }
    if (!token) {
      throw new V2ApiError(401, STATUS_MESSAGES[401]);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Resolved per request so building a client never touches configuration.
    const url = `${baseUrl ?? BASE_URL}/v2/${path.replace(/^\/+/, '')}${queryString(query)}`;
    let response: Response;
    try {
      response = await (fetchImpl ?? fetch)(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new V2ApiError(
        0,
        error instanceof Error ? `Network error: ${error.message}` : 'Network error'
      );
    }

    if (response.status === 204) {
      return undefined as R;
    }

    const envelope = await readEnvelope(response);
    if (!response.ok) {
      throw new V2ApiError(
        response.status,
        envelope?.message ||
          STATUS_MESSAGES[response.status] ||
          `Request failed (${response.status})`
      );
    }
    if (!envelope || envelope.status !== 'ok') {
      throw new V2ApiError(
        response.status,
        envelope?.message || 'Unexpected response from the API'
      );
    }
    return envelope.result as R;
  }

  async function listAll<T>(path: string, query: V2Query = {}): Promise<T[]> {
    const items: T[] = [];
    let offset = 0;
    // A generous cap keeps a misbehaving server from looping forever.
    for (let page = 0; page < 100; page += 1) {
      const result = await request<V2PageResult<T>>('GET', path, {
        query: { ...query, offset, limit: V2_MAX_PAGE_SIZE },
      });
      items.push(...result.items);
      if (!result.has_more || result.items.length === 0) {
        break;
      }
      offset += result.items.length;
    }
    return items;
  }

  return { request, listAll };
}
