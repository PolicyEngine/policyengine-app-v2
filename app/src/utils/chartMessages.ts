/**
 * Chart message utilities ported from v1 app
 * Original: policyengine-app/src/pages/policy/output/ImpactChart.jsx
 */

import wordwrap from 'wordwrapjs';
import type { countryIds } from '@/libs/countries';
import { formatPercent } from './formatters';

type CountryId = (typeof countryIds)[number];

/**
 * Wrap text to a specified width.
 * Returns newline-separated text. Consumers that render HTML (e.g. Plotly
 * hover templates) should convert '\n' → '<br>' at point of use.
 */
function wordWrap(text: string, width: number = 50): string {
  return wordwrap.wrap(text, { width });
}

/**
 * Generate an absolute change message
 * @param subjectTerm - The subject of the sentence (e.g., "This reform")
 * @param objectTerm - The object of the sentence (e.g., "tax revenues", "benefit spending")
 * @param change - The absolute change value
 * @param tolerance - Tolerance for "less than" messaging
 * @param formatter - Function to format the change value
 * @returns The formatted message with HTML line breaks
 */
export function absoluteChangeMessage(
  subjectTerm: string,
  objectTerm: string,
  change: number,
  tolerance: number,
  formatter: (value: number) => string
): string {
  const signTerm =
    change > tolerance
      ? `increase ${objectTerm} by ${formatter(change)}`
      : change > 0
        ? `increase ${objectTerm} by less than ${formatter(tolerance)}`
        : change < -tolerance
          ? `decrease ${objectTerm} by ${formatter(-change)}`
          : change < 0
            ? `decrease ${objectTerm} by less than ${formatter(tolerance)}`
            : `have no effect on ${objectTerm}`;

  const msg = `${subjectTerm} would ${signTerm}`;
  return wordWrap(msg, 50);
}

/**
 * Generate a relative change message
 * @param subjectTerm - The subject of the sentence (e.g., "This reform")
 * @param objectTerm - The object of the sentence (e.g., "the income of households in the 1st decile")
 * @param change - The relative change value (as a decimal, e.g., 0.05 for 5%)
 * @param tolerance - Tolerance for "less than" messaging (e.g., 0.001 for 0.1%)
 * @param countryId - Country ID for formatting
 * @param options - Optional baseline and reform values with formatter
 * @returns The formatted message with HTML line breaks
 */
export function relativeChangeMessage(
  subjectTerm: string,
  objectTerm: string,
  change: number,
  tolerance: number,
  countryId: CountryId,
  options?: {
    baseline: number;
    reform: number;
    formatter: (value: number) => string;
  }
): string {
  const formatter = (x: number) =>
    formatPercent(x, countryId, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const baselineReformTerm = options
    ? ` from ${options.formatter(options.baseline)} to ${options.formatter(options.reform)}`
    : '';

  const signTerm =
    change > tolerance
      ? `increase ${objectTerm} by ${formatter(change) + baselineReformTerm}`
      : change > 0
        ? `increase ${objectTerm} by less than ${formatter(tolerance)}`
        : change < -tolerance
          ? `decrease ${objectTerm} by ${formatter(-change) + baselineReformTerm}`
          : change < 0
            ? `decrease ${objectTerm} by less than ${formatter(tolerance)}`
            : `have no effect on ${objectTerm}`;

  const msg = `${subjectTerm} would ${signTerm}`;
  return wordWrap(msg, 50);
}
