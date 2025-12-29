import { MetadataApiPayload, ParameterMetadata } from '@/types/metadata';

export interface ParameterTreeNode {
  name: string;
  label: string;
  index: number;
  children?: ParameterTreeNode[];
  type?: 'parameterNode' | 'parameter';
  // Include metadata for actual parameters
  id?: string;
  parameter?: string;
  description?: string | null;
  unit?: string | null;
  period?: string | null;
  values?: Record<string, any>;
  economy?: boolean;
  household?: boolean;
}

/**
 * Capitalizes the first letter of a string (matching V1's capitalize function)
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sorts parameter tree alphabetically by label, recursively for all children
 * Adapted from V1's sortTreeInPlace function
 */
function sortTreeInPlace(tree: ParameterTreeNode[]): ParameterTreeNode[] {
  if (!Array.isArray(tree)) {
    return [];
  }

  tree.sort((a, b) => a.label.localeCompare(b.label));

  tree.forEach((item) => {
    if (Array.isArray(item.children)) {
      sortTreeInPlace(item.children);
    }
  });

  return tree;
}

/**
 * Builds a hierarchical parameter tree from flat metadata parameters
 * Adapted from policyengine-app/src/api/parameters.js
 */
export function buildParameterTree(parameters: Record<string, any>): ParameterTreeNode | undefined {
  const tree: { children?: ParameterTreeNode[] } = {};

  for (const parameter of Object.values(parameters).filter(
    (param: any) =>
      (param.economy || param.household) &&
      !param.parameter.includes('taxsim') &&
      !param.parameter.includes('gov.abolitions')
  )) {
    const nodeToInsert: ParameterTreeNode = {
      name: parameter.parameter,
      label: capitalize(
        (parameter.label || parameter.parameter.split(/\.|\[/).pop()).replaceAll('_', ' ')
      ),
      index: parameter.indexInModule || 0,
      type: parameter.type,
      parameter: parameter.parameter,
      description: parameter.description,
      unit: parameter.unit,
      period: parameter.period,
      values: parameter.values,
      economy: parameter.economy,
      household: parameter.household,
    };

    // Split based on . or [
    const pathComponents = parameter.parameter.split(/\.|\[/);
    // Keep track of the delimiters, so that we can reconstruct the path later.
    const delimiters = parameter.parameter.match(/\.|\[/g);
    // For a given path "x.y.z.a", create the nodes x, x.y and x.y.z if they don't exist.

    let currentNode = tree;
    let cumulativePath = '';

    for (const key of pathComponents.slice(0, -1)) {
      cumulativePath += key;
      const fixedCumulativePath = cumulativePath;
      let label = (cumulativePath in parameters && parameters[cumulativePath].label) || key;

      // Transform e.g. "0]" -> "Bracket 1"
      if (key.endsWith(']')) {
        label = `Bracket ${parseInt(key.slice(0, -1), 10) + 1}`;
      }
      label = capitalize(label.replaceAll('_', ' '));

      if (!currentNode.children) {
        currentNode.children = [];
      }

      if (!currentNode.children.find((child) => child.name === fixedCumulativePath)) {
        currentNode.children.push({
          label,
          name: cumulativePath,
          index: 0,
          children: [],
          type: 'parameterNode',
        });
      }

      currentNode = currentNode.children.find((child) => child.name === fixedCumulativePath)!;

      // Re-add the delimiter to the cumulative path
      if (delimiters) {
        cumulativePath += delimiters.shift();
      }
    }

    try {
      if (!currentNode.children) {
        currentNode.children = [];
      }
      currentNode.children.push(nodeToInsert);
    } catch (e) {
      console.error('Error inserting node', nodeToInsert, 'into', currentNode);
    }
  }

  const govTree = tree.children?.find((child) => child.name === 'gov');

  // Sort the tree alphabetically by label (matching V1 behavior)
  if (govTree?.children) {
    sortTreeInPlace(govTree.children);
  }

  return govTree;
}

/**
 * Prefixes to exclude from the parameter tree.
 * These are internal/calibration parameters not meant for policy editing.
 */
const EXCLUDED_PREFIXES = [
  'calibration.',
  'gov.abolitions.',
  'taxsim.',
];

/**
 * Checks if a parameter name should be included in the tree.
 * V2 API returns all parameters, so we filter to only policy-relevant ones.
 */
function shouldIncludeParameter(paramName: string): boolean {
  // Must start with "gov." to be a policy parameter
  if (!paramName.startsWith('gov.')) {
    return false;
  }

  // Exclude internal/calibration parameters
  for (const prefix of EXCLUDED_PREFIXES) {
    if (paramName.startsWith(prefix)) {
      return false;
    }
  }

  return true;
}

/**
 * Builds a hierarchical parameter tree from V2 API parameters.
 *
 * Unlike the V1 version, V2 parameters don't have economy/household flags.
 * Instead, we filter based on the parameter name prefix:
 * - Include: Parameters starting with "gov." (policy parameters)
 * - Exclude: calibration.*, gov.abolitions.*, taxsim.*
 *
 * @param parameters - Record of parameters keyed by name from V2 API
 * @returns The root "gov" node of the parameter tree, or undefined if empty
 */
export function buildParameterTreeV2(
  parameters: Record<string, ParameterMetadata>
): ParameterTreeNode | undefined {
  const tree: { children?: ParameterTreeNode[] } = {};

  for (const parameter of Object.values(parameters)) {
    // Use the parameter path (name) for filtering
    const paramPath = parameter.parameter || parameter.name || '';

    if (!shouldIncludeParameter(paramPath)) {
      continue;
    }

    const nodeToInsert: ParameterTreeNode = {
      name: paramPath,
      label: capitalize(
        (parameter.label || paramPath.split(/\.|\[/).pop() || '').replaceAll('_', ' ')
      ),
      index: 0,
      type: 'parameter',
      id: parameter.id,
      parameter: paramPath,
      description: parameter.description,
      unit: parameter.unit,
      period: parameter.period,
      values: parameter.values,
    };

    // Split based on . or [
    const pathComponents = paramPath.split(/\.|\[/);
    // Keep track of the delimiters so we can reconstruct the path later
    const delimiters = paramPath.match(/\.|\[/g);

    let currentNode = tree;
    let cumulativePath = '';

    // For a given path "x.y.z.a", create the nodes x, x.y and x.y.z if they don't exist
    for (const key of pathComponents.slice(0, -1)) {
      cumulativePath += key;
      const fixedCumulativePath = cumulativePath;

      // Try to get label from the parameters record, fall back to the key
      let label = (cumulativePath in parameters && parameters[cumulativePath].label) || key;

      // Transform e.g. "0]" -> "Bracket 1"
      if (key.endsWith(']')) {
        label = `Bracket ${parseInt(key.slice(0, -1), 10) + 1}`;
      }
      label = capitalize(label.replaceAll('_', ' '));

      if (!currentNode.children) {
        currentNode.children = [];
      }

      if (!currentNode.children.find((child) => child.name === fixedCumulativePath)) {
        currentNode.children.push({
          label,
          name: cumulativePath,
          index: 0,
          children: [],
          type: 'parameterNode',
        });
      }

      currentNode = currentNode.children.find((child) => child.name === fixedCumulativePath)!;

      // Re-add the delimiter to the cumulative path
      if (delimiters) {
        cumulativePath += delimiters.shift();
      }
    }

    try {
      if (!currentNode.children) {
        currentNode.children = [];
      }
      currentNode.children.push(nodeToInsert);
    } catch (e) {
      console.error('Error inserting node', nodeToInsert, 'into', currentNode);
    }
  }

  const govTree = tree.children?.find((child) => child.name === 'gov');

  // Sort the tree alphabetically by label
  if (govTree?.children) {
    sortTreeInPlace(govTree.children);
  }

  return govTree;
}

/**
 * Converts metadata API response to parameter tree format
 */
export function convertMetadataToParameterTree(
  metadata: MetadataApiPayload
): ParameterTreeNode | undefined {
  return buildParameterTree(metadata.result.parameters);
}
