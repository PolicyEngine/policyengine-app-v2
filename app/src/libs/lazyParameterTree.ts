/**
 * Lazy Parameter Tree Builder
 *
 * Builds parameter tree nodes on-demand instead of upfront.
 * Each level is built only when requested and cached for subsequent access.
 *
 * Usage:
 *   const cache = createParameterTreeCache();
 *   const rootChildren = getChildrenForPath(parameters, 'gov', cache);
 *   const taxChildren = getChildrenForPath(parameters, 'gov.tax', cache);
 */

import { ParameterMetadata } from '@/types/metadata';

export interface LazyParameterTreeNode {
  name: string;
  label: string;
  type: 'parameterNode' | 'parameter';
  // Present only for leaf parameters
  id?: string;
  parameter?: string;
  description?: string | null;
  unit?: string | null;
  period?: string | null;
  values?: Record<string, unknown>;
  economy?: boolean;
  household?: boolean;
}

export type ParameterTreeCache = Map<string, LazyParameterTreeNode[]>;

// Prefixes to exclude from the parameter tree
const EXCLUDED_PREFIXES = ['calibration.', 'gov.abolitions.', 'gov.taxsim.', 'taxsim.'];

/**
 * Create a new empty cache for storing built tree nodes.
 */
export function createParameterTreeCache(): ParameterTreeCache {
  return new Map();
}

/**
 * Clear all entries from the cache.
 */
export function clearParameterTreeCache(cache: ParameterTreeCache): void {
  cache.clear();
}

/**
 * Check if a parameter name should be included in the tree.
 */
function shouldIncludeParameter(paramName: string): boolean {
  if (!paramName.startsWith('gov.')) {
    return false;
  }
  return !EXCLUDED_PREFIXES.some((prefix) => paramName.startsWith(prefix));
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a path segment into a human-readable label.
 */
function formatSegmentLabel(
  segment: string,
  fullPath: string,
  parameters: Record<string, ParameterMetadata>
): string {
  // Use parameter's label if this path exists as a parameter
  if (fullPath in parameters && parameters[fullPath].label) {
    return capitalize(parameters[fullPath].label.replaceAll('_', ' '));
  }

  // Handle bracket notation (e.g., "0]" -> "Bracket 1")
  if (segment.endsWith(']')) {
    return `Bracket ${parseInt(segment.slice(0, -1), 10) + 1}`;
  }

  return capitalize(segment.replaceAll('_', ' '));
}

/**
 * Sort nodes alphabetically by label.
 */
function sortByLabel(nodes: LazyParameterTreeNode[]): LazyParameterTreeNode[] {
  return [...nodes].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Find all unique direct child paths for a parent path.
 */
function findDirectChildPaths(
  parameters: Record<string, ParameterMetadata>,
  parentPath: string
): Set<string> {
  const children = new Set<string>();
  const prefix = parentPath ? `${parentPath}.` : '';
  const prefixLength = prefix.length;

  for (const paramName of Object.keys(parameters)) {
    if (!shouldIncludeParameter(paramName)) {
      continue;
    }

    if (!paramName.startsWith(prefix)) {
      continue;
    }

    // Extract the next path segment
    const remainder = paramName.slice(prefixLength);
    const match = remainder.match(/^([^.[]+(?:])?)/);

    if (match) {
      const childPath = prefix + match[1];
      children.add(childPath);
    }
  }

  return children;
}

/**
 * Check if a path represents a leaf parameter (no children).
 */
function isLeafParameter(parameters: Record<string, ParameterMetadata>, path: string): boolean {
  if (!(path in parameters)) {
    return false;
  }

  const childPrefix = `${path}.`;
  const bracketPrefix = `${path}[`;

  for (const paramName of Object.keys(parameters)) {
    if (paramName.startsWith(childPrefix) || paramName.startsWith(bracketPrefix)) {
      return false;
    }
  }

  return true;
}

/**
 * Create a leaf node from a parameter.
 */
function createLeafNode(parameter: ParameterMetadata): LazyParameterTreeNode {
  const path = parameter.parameter || parameter.name || '';
  const fallbackLabel = path.split(/[.[]/).pop() || '';

  return {
    name: path,
    label: capitalize((parameter.label || fallbackLabel).replaceAll('_', ' ')),
    type: 'parameter',
    id: parameter.id,
    parameter: path,
    description: parameter.description,
    unit: parameter.unit,
    period: parameter.period,
    values: parameter.values,
    economy: parameter.economy,
    household: parameter.household,
  };
}

/**
 * Create a branch node (intermediate node with children).
 */
function createBranchNode(path: string, label: string): LazyParameterTreeNode {
  return {
    name: path,
    label,
    type: 'parameterNode',
  };
}

/**
 * Build children for a specific path (internal, not cached).
 */
function buildChildrenForPath(
  parameters: Record<string, ParameterMetadata>,
  parentPath: string
): LazyParameterTreeNode[] {
  const childPaths = findDirectChildPaths(parameters, parentPath);
  const nodes: LazyParameterTreeNode[] = [];

  for (const childPath of childPaths) {
    if (isLeafParameter(parameters, childPath)) {
      nodes.push(createLeafNode(parameters[childPath]));
    } else {
      const segment = childPath.slice(parentPath ? parentPath.length + 1 : 0);
      const label = formatSegmentLabel(segment, childPath, parameters);
      nodes.push(createBranchNode(childPath, label));
    }
  }

  return sortByLabel(nodes);
}

/**
 * Get children for a path, using cache if available.
 *
 * @param parameters - Flat record of all parameters from API
 * @param parentPath - Path to get children for (e.g., 'gov', 'gov.tax')
 * @param cache - Cache for storing built nodes
 * @returns Sorted array of child nodes
 */
export function getChildrenForPath(
  parameters: Record<string, ParameterMetadata>,
  parentPath: string,
  cache: ParameterTreeCache
): LazyParameterTreeNode[] {
  const cached = cache.get(parentPath);
  if (cached) {
    return cached;
  }

  const children = buildChildrenForPath(parameters, parentPath);
  cache.set(parentPath, children);

  return children;
}

/**
 * Check if a path has children (without building them).
 */
export function hasChildren(
  parameters: Record<string, ParameterMetadata>,
  path: string
): boolean {
  return !isLeafParameter(parameters, path);
}
