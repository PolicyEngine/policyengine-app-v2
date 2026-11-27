/**
 * A failed calculation as a reader can act on it. The API's failures
 * arrive as one raw string — "Society-wide calculation failed (502):
 * {"status": "error", "message": "…(correlation_id=311d…)"}" — which says
 * nothing to someone running a report, but carries what support needs.
 */
export interface CalculationErrorSummary {
  /** Whether running it again is worth a try: the fault is on the servers' side. */
  retryable: boolean;
  title: string;
  body: string;
  /** The id the API logs the failure under, for whoever reads its logs. */
  reference: string | null;
  /** The message as it came, for the technical details. */
  detail: string;
}

/** The JSON body after the status, when there is one. */
function apiBody(raw: string): { message?: unknown; errors?: unknown } | null {
  const start = raw.indexOf('{');
  if (start < 0) {
    return null;
  }
  try {
    return JSON.parse(raw.slice(start));
  } catch {
    return null;
  }
}

/** The API's own message, from the JSON body. */
function apiMessage(raw: string): string | null {
  const message = apiBody(raw)?.message;
  return typeof message === 'string' ? message : null;
}

/** The error codes in the JSON body's `errors` list, e.g. SPM_CONFIGURATION_UNAVAILABLE. */
function apiErrorCodes(raw: string): string[] {
  const errors = apiBody(raw)?.errors;
  return Array.isArray(errors)
    ? errors.map((error) => (typeof error?.code === 'string' ? error.code : ''))
    : [];
}

/**
 * The code the Public API sends when the requested year is outside the
 * years the country's model and data cover. Running it again gives the
 * same answer; its message says which years are covered.
 */
const DATASET_YEAR_UNAVAILABLE = 'DATASET_YEAR_UNAVAILABLE';

/**
 * Whether a 4xx says the API itself could not serve the run, not that the
 * reform is wrong: an error code for something unavailable
 * (SPM_CONFIGURATION_UNAVAILABLE), or a message about its worker.
 */
function serverUnavailable(raw: string, message: string | null): boolean {
  return (
    apiErrorCodes(raw).some((code) => /_UNAVAILABLE$/.test(code)) ||
    /\bworker\b|unavailable/i.test(message ?? '')
  );
}

/**
 * @param scope Where the reform ran, as it reads after "running this
 * reform": "nationwide", "UK-wide", "for Wales".
 */
export function describeCalculationError(
  raw: string | null | undefined,
  scope = 'nationwide'
): CalculationErrorSummary {
  const detail = (raw ?? '').trim() || 'The calculation failed without a message.';
  const status = Number(detail.match(/\((\d{3})\)/)?.[1]) || null;
  const message = apiMessage(detail);
  const reference = detail.match(/correlation_id=([A-Za-z0-9-]+)/)?.[1] ?? null;

  // Checked before the other unavailable codes: it is about the year
  // asked for, not the servers, so a retry does not help.
  if (apiErrorCodes(detail).includes(DATASET_YEAR_UNAVAILABLE)) {
    return {
      retryable: false,
      title: 'The model does not cover this year',
      body:
        message ??
        "This year is outside the years the model's data cover. Choose another year and run the report again.",
      reference,
      detail,
    };
  }
  if (/timed? ?out|timeout/i.test(detail)) {
    return {
      retryable: true,
      title: 'The calculation took too long',
      body: 'The simulation did not finish in time. Run the report again; a second try often completes.',
      reference,
      detail,
    };
  }
  if ((status !== null && status >= 500) || /simulation failed|entrypoint/i.test(detail)) {
    return {
      retryable: true,
      title: 'The simulation did not finish',
      body: `PolicyEngine's servers hit an error while running this reform ${scope}. This is usually on our side rather than the reform's. Run the report again in a few minutes.`,
      reference,
      detail,
    };
  }
  if (status !== null && status >= 400 && serverUnavailable(detail, message)) {
    return {
      retryable: true,
      title: 'The API could not run this right now',
      body: "PolicyEngine's servers were not ready to run this report. This is on our side, not the reform's. Run the report again in a minute.",
      reference,
      detail,
    };
  }
  if (status !== null && status >= 400) {
    return {
      retryable: false,
      title: 'The reform could not be run',
      body: `The API turned the reform down${message ? `: ${message}` : '.'} Edit the reform and run it again.`,
      reference,
      detail,
    };
  }
  return {
    retryable: true,
    title: 'Something went wrong with this report',
    body: message ?? 'The calculation stopped before it finished. Run the report again.',
    reference,
    detail,
  };
}
