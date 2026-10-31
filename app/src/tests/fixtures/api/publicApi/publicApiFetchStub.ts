import { vi } from 'vitest';
import { modelCatalogEnvelope } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';

export type RouteHandler = (url: URL, request: Request) => Response | Promise<Response>;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Stubs the global fetch the Public API client uses, answering each v2
 * route from `handlers` by path; `/v2/model-catalog` answers with the US
 * fixture unless a handler replaces it. Returns the stub, so tests can
 * count the requests each path received.
 */
export function stubPublicApiFetch(handlers: Record<string, RouteHandler> = {}) {
  const routes: Record<string, RouteHandler> = {
    '/v2/model-catalog': () => jsonResponse(modelCatalogEnvelope()),
    ...handlers,
  };
  const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
      input instanceof Request ? input : new Request(absoluteUrl(String(input)), init);
    const url = new URL(request.url);
    const handler = routes[url.pathname];
    if (!handler) {
      return jsonResponse({ status: 'error', message: `No stub for ${url.pathname}` }, 404);
    }
    return handler(url, request);
  });
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
}

/** A same-origin path (`/api/…`), as the app's other clients send, made absolute. */
function absoluteUrl(input: string): string {
  return new URL(input, 'http://localhost').toString();
}

/** The requests the stub received for one path. */
export function requestsTo(fetchStub: ReturnType<typeof stubPublicApiFetch>, path: string): URL[] {
  return fetchStub.mock.calls
    .map(([input]) => new URL(input instanceof Request ? input.url : absoluteUrl(String(input))))
    .filter((url) => url.pathname === path);
}
