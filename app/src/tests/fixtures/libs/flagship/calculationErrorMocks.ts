/**
 * Failed economy requests: the bodies the Public API answers with, and the
 * error message the app's API client builds from them (the request's
 * name, the HTTP status, then the body as it came).
 */

/** The years the UK model and data cover, as the Public API's metadata lists them. */
export const UK_FIRST_SUPPORTED_YEAR = 2024;
export const UK_LAST_SUPPORTED_YEAR = 2032;

/** The year UK reports start from: the current one. */
export const UK_REPORT_START_YEAR = 2026;

/** The first year after the last one the UK model and data cover. */
export const UK_UNSUPPORTED_YEAR = 2033;

/** The Public API's readable message for a year outside the UK model's data. */
export const DATASET_YEAR_UNAVAILABLE_MESSAGE =
  'UK results are available for 2024 to 2032. 2033 is outside the years the current UK model and data cover.';

/** The Public API's 400 body for a year outside the data, with its stable error code. */
export const DATASET_YEAR_UNAVAILABLE_BODY = {
  status: 'error',
  message: DATASET_YEAR_UNAVAILABLE_MESSAGE,
  result: null,
  errors: [{ code: 'DATASET_YEAR_UNAVAILABLE', message: DATASET_YEAR_UNAVAILABLE_MESSAGE }],
};

/** The simulation service's failure ID that the Public API passes on in its message. */
export const SIMULATION_FAILURE_CORRELATION_ID = '311da50645a847c59ed077ca60f15279';

/** The Public API's 502 body when the simulation service fails without saying why. */
export const SIMULATION_FAILED_BODY = {
  status: 'error',
  message: `Simulation entrypoint execution failed: Simulation failed (correlation_id=${SIMULATION_FAILURE_CORRELATION_ID})`,
  result: null,
};

/** A failed society-wide request as the app's API client reports it. */
export function societyWideFailure(httpStatus: number, body: object): string {
  return `Society-wide calculation failed (${httpStatus}): ${JSON.stringify(body)}`;
}

/** A JSON response with the given HTTP status, as fetch resolves it. */
export function jsonResponse(httpStatus: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}
