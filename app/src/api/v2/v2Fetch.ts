/**
 * Shared fetch utility for the v2 API module.
 *
 * Provides:
 * - Safe JSON parsing (catches non-JSON responses with useful error messages)
 * - Safe error body reading (res.text() failure doesn't mask the original error)
 * - Status code inclusion in all error messages
 * - Structured console logging for all API errors
 */

/**
 * Safely read the response body as text. If reading fails (e.g. network
 * severed mid-response), returns a fallback string instead of throwing.
 */
async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '(unable to read response body)';
  }
}

/**
 * Parse a fetch Response as JSON with safety checks.
 *
 * If the response has a non-JSON content type or the body fails to parse,
 * throws a descriptive error including the operation name and a preview
 * of the actual response body.
 */
async function safeParseJson<T>(res: Response, operation: string): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    const body = await safeReadText(res);
    throw new Error(
      `${operation}: expected JSON but received ${contentType}. Body: ${body.slice(0, 200)}`
    );
  }
  try {
    return await res.json();
  } catch {
    const body = await safeReadText(res);
    throw new Error(`${operation}: failed to parse JSON response. Body: ${body.slice(0, 200)}`);
  }
}

/**
 * Throw an API error with status code, response body, and console logging.
 */
async function throwApiError(res: Response, operation: string): Promise<never> {
  const errorText = await safeReadText(res);
  const message = `${operation}: ${res.status} ${errorText}`;
  console.error(`[v2 API] ${message}`);
  throw new Error(message);
}

/**
 * Perform a v2 API fetch with standardized error handling.
 *
 * - On success: safely parses JSON response
 * - On error: reads body safely, logs, and throws with status code
 * - On 404: returns null if `nullOn404` is true, otherwise throws
 *
 * @param url - Full URL to fetch
 * @param operation - Human-readable description for error messages (e.g. "fetchHouseholdById")
 * @param options - Standard fetch RequestInit plus `nullOn404` flag
 */
export async function v2Fetch<T>(
  url: string,
  operation: string,
  options?: RequestInit & { nullOn404?: boolean }
): Promise<T> {
  const { nullOn404, ...fetchOptions } = options ?? {};

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    if (nullOn404 && res.status === 404) {
      return null as T;
    }
    await throwApiError(res, operation);
  }

  return safeParseJson<T>(res, operation);
}

/**
 * Perform a v2 API fetch that returns void (e.g. DELETE 204).
 * Accepts 204 and optionally 404 as success.
 */
export async function v2FetchVoid(
  url: string,
  operation: string,
  options?: RequestInit & { allowNotFound?: boolean }
): Promise<void> {
  const { allowNotFound, ...fetchOptions } = options ?? {};

  const res = await fetch(url, fetchOptions);

  if (res.ok || res.status === 204) {
    return;
  }

  if (allowNotFound && res.status === 404) {
    console.info(`[v2 API] ${operation}: entity already deleted (404)`);
    return;
  }

  await throwApiError(res, operation);
}

/**
 * Sleep that can be cancelled via AbortSignal.
 */
export function cancellableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true }
    );
  });
}
