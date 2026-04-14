/**
 * Generates the absolute URL path to a report output page.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param userReportId - The user report ID
 * @returns Absolute path to the report output page (e.g., '/us/report-output/123')
 */
export function getReportOutputPath(countryId: string, userReportId: string | number): string {
  return `/${countryId}/report-output/${userReportId}`;
}

/**
 * Generates the absolute URL path to a report configuration page.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param userReportId - The user report ID
 * @returns Absolute path to the report configuration page
 */
export function getReportConfigPath(countryId: string, userReportId: string | number): string {
  return `${getReportOutputPath(countryId, userReportId)}/config`;
}
