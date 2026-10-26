/**
 * The app v3 pages: Build, Reforms, a report and a bill report (and the
 * Ask redirect), under a country (`/us/build`, `/uk/report/bill/abc`).
 * With the flagship flag on, the shell also hosts the legacy v2 pages
 * (`/us/report-output/…`, `/us/reports`, `/us/policies` …); those are not
 * v3 pages and keep their own layout.
 */
const FLAGSHIP_PAGE_PATH = /^\/[^/]+\/(?:build|reforms|ask|report\/[^/]+)(?:[/?#]|$)/;

/** Whether `pathname` is an app v3 page. */
export function isFlagshipPagePath(pathname: string): boolean {
  return FLAGSHIP_PAGE_PATH.test(pathname);
}
