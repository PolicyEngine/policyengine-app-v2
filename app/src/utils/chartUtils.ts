/**
 * General chart utility functions
 */

/**
 * Gets the label for the reform policy line in parameter charts
 *
 * Priority order:
 * 1. Policy label (if provided)
 * 2. Policy ID formatted as "Policy #123" (if provided)
 * 3. Default "Reform" label
 *
 * @param policyLabel - Optional custom label for the policy
 * @param policyId - Optional policy ID number
 * @returns The label to display for the reform line
 */
export function getReformPolicyLabel(
  policyLabel?: string | null,
  policyId?: number | null
): string {
  if (policyLabel) {
    return policyLabel;
  }

  if (policyId !== null && policyId !== undefined) {
    return `Policy #${policyId}`;
  }

  return 'Reform';
}


/**
 * Downloads data as a CSV file
 * @param data - 2D array of data to export
 * @param filename - Name of the file to download
 */
export function downloadCsv(data: string[][], filename: string): void {
  const csvContent = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.setAttribute('download', filename);
  tempLink.click();
  URL.revokeObjectURL(url);
}

/**
 * Default Plotly chart configuration
 */
export const DEFAULT_CHART_CONFIG = {
  displayModeBar: false,
  responsive: true,
};

/**
 * Returns base layout configuration for charts
 * @param mobile - Whether the chart is being rendered on mobile
 * @returns Plotly layout object
 */
export function getBaseChartLayout(mobile: boolean) {
  return {
    height: mobile ? 300 : 500,
    margin: { t: 40, r: 20, b: 60, l: 80 },
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true },
  };
}
