/* eslint-disable @typescript-eslint/no-unused-vars -- placeholder until the implementation commit */
export const DASHBOARD_VERCEL_HOSTS: ReadonlySet<string> = new Set();

export function isAllowedDashboardOrigin(_origin: URL): boolean {
  return false;
}
