/**
 * Keeps tests off the network. `vitest.setup.mjs` installs this guard as the
 * global `fetch` (and, in jsdom suites, as `XMLHttpRequest`'s `send`) before
 * each test file, and checks after each test that no request reached it.
 *
 * Without it, a request that no test mocked would go to `BASE_URL`, which
 * defaults to the production Public API. A test that mocks `fetch` (with
 * `vi.stubGlobal`, `vi.spyOn` or an assignment) or the API module that sends
 * the request replaces the guard for that request, as before.
 */

/** The requests refused since the last check, as `METHOD url`. */
const unmockedRequests: string[] = [];

export class UnmockedRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnmockedRequestError';
  }
}

const MOCKING_ADVICE =
  'Mock fetch (for example with vi.stubGlobal) or the API module that sends the request.';

function refuseRequest(requestDescription: string): UnmockedRequestError {
  unmockedRequests.push(requestDescription);
  return new UnmockedRequestError(
    `A test sent a network request that nothing mocked: ${requestDescription}. ${MOCKING_ADVICE}`
  );
}

function fetchRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  return input instanceof URL ? input.href : input.url;
}

function describeFetchRequest(input: RequestInfo | URL, init?: RequestInit): string {
  const requestMethod = init?.method ?? (input instanceof Request ? input.method : 'GET');
  return `${requestMethod.toUpperCase()} ${fetchRequestUrl(input)}`;
}

/** The global `fetch` while no test has mocked it: rejects at once, naming the request. */
export function unmockedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return Promise.reject(refuseRequest(describeFetchRequest(input, init)));
}

/**
 * A `fetch` mock that answers each listed URL with a new response from its
 * factory, and refuses every other request as the guard does, so a test can
 * mock the requests it expects without letting any other one through.
 */
export function fetchRespondingTo(responsesByUrl: Record<string, () => Response>) {
  const responseFactories = new Map(Object.entries(responsesByUrl));
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const createResponse = responseFactories.get(fetchRequestUrl(input));
    return createResponse ? Promise.resolve(createResponse()) : unmockedFetch(input, init);
  };
}

function guardXMLHttpRequest(requestPrototype: XMLHttpRequest): void {
  const openedRequests = new WeakMap<XMLHttpRequest, string>();
  const originalOpen = requestPrototype.open;

  requestPrototype.open = function open(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...openOptions: unknown[]
  ) {
    openedRequests.set(this, `${method.toUpperCase()} ${String(url)}`);
    Reflect.apply(originalOpen, this, [method, url, ...openOptions]);
  };

  requestPrototype.send = function send(this: XMLHttpRequest) {
    throw refuseRequest(openedRequests.get(this) ?? 'an XMLHttpRequest that was never opened');
  };
}

/** Replaces the global `fetch`, and `XMLHttpRequest`'s `send` where it exists, with the guard. */
export function installUnmockedRequestGuard(): void {
  globalThis.fetch = unmockedFetch;
  if (typeof XMLHttpRequest !== 'undefined') {
    guardXMLHttpRequest(XMLHttpRequest.prototype);
  }
}

/** Returns the requests the guard refused since the last call, and forgets them. */
export function takeUnmockedRequests(): string[] {
  return unmockedRequests.splice(0);
}

/**
 * Throws if the guard refused any request since the last check. The setup
 * runs this after each test, so a test fails even when the code under test
 * catches the rejected request and carries on.
 */
export function failOnUnmockedRequests(): void {
  const refusedRequests = takeUnmockedRequests();
  if (refusedRequests.length === 0) {
    return;
  }
  throw new UnmockedRequestError(
    [
      `This test (or the previous test in this file, after it finished) sent ${refusedRequests.length} network request(s) that nothing mocked:`,
      ...refusedRequests.map((requestDescription) => `  ${requestDescription}`),
      MOCKING_ADVICE,
    ].join('\n')
  );
}
