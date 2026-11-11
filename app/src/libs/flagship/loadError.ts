/**
 * Whether a failed fetch means the record is not there — a 404 status
 * ("Failed to fetch report 12: 404 Not Found"), or the API saying it was
 * not found — rather than that the request failed. A missing record is
 * not worth asking for again; a failed request is.
 */
export function isNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  // The status follows a colon, so a record id that reads "404" is not one.
  return /:\s*404\b|\bnot found\b/i.test(message);
}

/** Retries for a record fetch: a few for a failed request, none for a missing record. */
export function retryUnlessNotFound(failureCount: number, error: unknown): boolean {
  return !isNotFoundError(error) && failureCount < 3;
}
