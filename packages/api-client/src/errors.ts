/** The dashboard API refused a request, failed, or could not be read. */
export class PolicyEngineApiError extends Error {
  override name = "PolicyEngineApiError";

  constructor(
    message: string,
    /** The HTTP status, or null when no answer arrived. */
    readonly status: number | null,
    /** The answer's parsed body, when it had one. */
    readonly body: unknown = null,
    /** Seconds to wait before trying again, from Retry-After. */
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
  }
}

/** Economy comparison polling gave up before the comparison finished. */
export class EconomyComparisonTimeoutError extends Error {
  override name = "EconomyComparisonTimeoutError";
}
