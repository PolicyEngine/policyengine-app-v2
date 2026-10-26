import createClient, { type Client } from 'openapi-fetch';
import {
  credentialHeaders,
  failureMessage,
  V2ApiError,
  type V2Credentials,
} from '@/api/v2UserClient';
import { BASE_URL } from '@/constants';
import type { paths } from './schema';

/**
 * A typed client for the Public API's v2 routes (policyengine-api), generated
 * from its OpenAPI document (see scripts/public-api-client.ts). Route paths,
 * query parameters, bodies and responses are checked against
 * src/api/publicApi/schema.d.ts at compile time.
 */
export type PublicApiClient = Client<paths>;

export interface CreatePublicApiClientOptions {
  /** Who requests are made as; metadata routes need no one. */
  credentials?: V2Credentials;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createPublicApiClient({
  credentials = { kind: 'none' },
  baseUrl,
  fetchImpl,
}: CreatePublicApiClientOptions = {}): PublicApiClient {
  const client = createClient<paths>({
    baseUrl: baseUrl ?? BASE_URL,
    // Resolved per request, so a stubbed global fetch is honoured.
    fetch: (request: Request) => (fetchImpl ?? globalThis.fetch)(request),
  });
  client.use({
    async onRequest({ request }) {
      for (const [name, value] of Object.entries(await credentialHeaders(credentials))) {
        request.headers.set(name, value);
      }
      return request;
    },
  });
  return client;
}

interface ClientOutcome<Data> {
  data?: Data;
  error?: unknown;
  response: Response;
}

/**
 * The body of a successful response, for routes that return a document
 * without the v2 envelope (such as the parameter search file). A failed
 * response throws V2ApiError with its status and the API's message, and a
 * request that never reached the API throws status 0.
 */
export async function requireBody<Body>(call: Promise<ClientOutcome<Body>>): Promise<Body> {
  let outcome: ClientOutcome<Body>;
  try {
    outcome = await call;
  } catch (error) {
    if (error instanceof V2ApiError) {
      throw error;
    }
    throw new V2ApiError(
      0,
      error instanceof Error ? `Network error: ${error.message}` : 'Network error'
    );
  }
  const { data, error, response } = outcome;
  if (!response.ok || data === undefined) {
    const apiMessage =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : null;
    throw new V2ApiError(response.status, failureMessage(response.status, apiMessage));
  }
  return data;
}

/**
 * The `result` of a v2 success envelope (`{status: "ok", message, result}`).
 * A failed response throws V2ApiError with its status and the API's message,
 * and a request that never reached the API throws status 0.
 */
export async function requireResult<Result>(
  call: Promise<ClientOutcome<{ result: Result }>>
): Promise<Result> {
  return (await requireBody(call)).result;
}
