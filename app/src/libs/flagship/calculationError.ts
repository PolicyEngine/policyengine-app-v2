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

/** The API's own message, from the JSON body after the status when there is one. */
function apiMessage(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) {
    return null;
  }
  try {
    const body = JSON.parse(raw.slice(start));
    return typeof body?.message === 'string' ? body.message : null;
  } catch {
    return null;
  }
}

export function describeCalculationError(raw: string | null | undefined): CalculationErrorSummary {
  const detail = (raw ?? '').trim() || 'The calculation failed without a message.';
  const status = Number(detail.match(/\((\d{3})\)/)?.[1]) || null;
  const message = apiMessage(detail);
  const reference = detail.match(/correlation_id=([A-Za-z0-9-]+)/)?.[1] ?? null;

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
      body: "PolicyEngine's servers hit an error while running this reform nationwide. This is usually on our side rather than the reform's. Run the report again in a few minutes.",
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
