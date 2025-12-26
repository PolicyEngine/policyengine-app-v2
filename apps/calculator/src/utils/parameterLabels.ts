import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * Splits a parameter path into its hierarchical parts.
 * Example: "gov.irs.credits.eitc.max[0].amount" -> ["gov", "irs", "credits", "eitc", "max[0]", "amount"]
 */
function splitParameterPath(paramName: string): string[] {
  return paramName.split('.');
}

/**
 * Builds cumulative paths from parameter parts.
 * Example: ["gov", "irs", "credits"] -> ["gov", "gov.irs", "gov.irs.credits"]
 */
function buildCumulativePaths(parts: string[]): string[] {
  const paths: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    paths.push(parts.slice(0, i + 1).join('.'));
  }
  return paths;
}

/**
 * Formats a string to sentence case (only first letter capitalized).
 */
function toSentenceCase(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Gets hierarchical labels for a parameter path.
 * Starts from the second level (skipping "gov") and collects all available labels.
 */
export function getHierarchicalLabels(
  paramName: string,
  parameters: ParameterMetadataCollection
): string[] {
  const parts = splitParameterPath(paramName);
  const paths = buildCumulativePaths(parts);

  // Skip the first path ("gov") and collect labels
  const labels = paths
    .slice(1)
    .map((path) => parameters[path]?.label)
    .filter((label): label is string => Boolean(label))
    .map(toSentenceCase);

  return labels;
}

/**
 * Builds a display label using the "first + last" strategy.
 * - If 3 or fewer labels: show all
 * - If more than 3: show first 1 and last 2
 */
export function buildCompactLabel(labels: string[]): {
  displayParts: string[];
  hasMore: boolean;
} {
  if (labels.length <= 3) {
    return {
      displayParts: labels,
      hasMore: false,
    };
  }

  // Show first 1 and last 2
  const first = labels.slice(0, 1);
  const last = labels.slice(-2);

  return {
    displayParts: [...first, '...', ...last],
    hasMore: true,
  };
}

/**
 * Formats label parts into a readable string.
 */
export function formatLabelParts(parts: string[]): string {
  return parts.join(' → ');
}
