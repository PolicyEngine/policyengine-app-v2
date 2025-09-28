import { MetadataApiPayload } from '@/types/metadata';

export interface ParameterTreeNode {
  name: string;
  label: string;
  index: number;
  children?: ParameterTreeNode[];
  type?: 'parameterNode' | 'parameter';
  // Include metadata for actual parameters
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
    // Preserve the original label without modification
    const displayLabel = parameter.label ||
      capitalize(parameter.parameter.split(/\.|\[/).pop()?.replaceAll('_', ' ') || '');

    const nodeToInsert: ParameterTreeNode = {
      name: parameter.parameter,
      label: displayLabel,
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
 * Converts metadata API response to parameter tree format
 */
export function convertMetadataToParameterTree(
  metadata: MetadataApiPayload
): ParameterTreeNode | undefined {
  return buildParameterTree(metadata.result.parameters);
}
