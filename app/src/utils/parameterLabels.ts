import { ParameterMetadataCollection } from '@/types/metadata';

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
 * Capitalizes only the first character of a string, leaving the rest unchanged.
 */
function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Gets hierarchical labels for a parameter path.
 * Starts from the second level (skipping "gov") and collects all available labels.
 * Only the first label has its first character capitalized; all others are unchanged.
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
    .filter((label): label is string => Boolean(label));

  // Capitalize the first character of each label, leaving the rest unchanged
  return labels.map(capitalizeFirst);
}

/**
 * Returns all labels for display (no truncation).
 */
export function buildCompactLabel(labels: string[]): {
  displayParts: string[];
  hasMore: boolean;
} {
  return {
    displayParts: labels,
    hasMore: false,
  };
}

/**
 * Formats label parts into a readable string.
 */
export function formatLabelParts(parts: string[]): string {
  return parts.join(' → ');
}
