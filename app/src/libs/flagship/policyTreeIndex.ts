import { ParameterTreeNode } from '@/types/metadata';

/**
 * Lookup tables over the metadata parameter tree for the Build page's
 * policy browser: every node by path, its parent, and how many draftable
 * parameters sit at or below it. Built once per tree; folders with none
 * are dropped, so browsing never lands somewhere with nothing to add.
 */
export interface PolicyTreeIndex {
  nodes: Map<string, ParameterTreeNode>;
  parents: Map<string, string | null>;
  counts: Map<string, number>;
  /** Top-level folders holding at least one draftable parameter */
  roots: ParameterTreeNode[];
}

export interface FolderContents {
  folders: ParameterTreeNode[];
  parameters: ParameterTreeNode[];
}

const isFolder = (node: ParameterTreeNode) => Boolean(node.children?.length);

// Numeric-aware so "Bracket 2" sorts before "Bracket 10".
const byLabel = (a: ParameterTreeNode, b: ParameterTreeNode) =>
  a.label.localeCompare(b.label, undefined, { numeric: true });

export function buildPolicyTreeIndex(
  tree: ParameterTreeNode,
  addablePaths: Set<string>
): PolicyTreeIndex {
  const nodes = new Map<string, ParameterTreeNode>();
  const parents = new Map<string, string | null>();
  const counts = new Map<string, number>();

  const visit = (node: ParameterTreeNode, parent: string | null): number => {
    nodes.set(node.name, node);
    parents.set(node.name, parent);
    let count = 0;
    if (isFolder(node)) {
      for (const child of node.children!) {
        if (!child.name.includes('pycache')) {
          count += visit(child, node.name);
        }
      }
    } else if (addablePaths.has(node.name)) {
      count = 1;
    }
    counts.set(node.name, count);
    return count;
  };

  const roots: ParameterTreeNode[] = [];
  for (const child of tree.children ?? []) {
    if (visit(child, null) > 0 && isFolder(child)) {
      roots.push(child);
    }
  }
  roots.sort(byLabel);

  return { nodes, parents, counts, roots };
}

/** A folder's direct subfolders and draftable parameters, each sorted by label. */
export function folderContents(index: PolicyTreeIndex, path: string): FolderContents {
  const folders: ParameterTreeNode[] = [];
  const parameters: ParameterTreeNode[] = [];
  for (const child of index.nodes.get(path)?.children ?? []) {
    if ((index.counts.get(child.name) ?? 0) === 0) {
      continue;
    }
    (isFolder(child) ? folders : parameters).push(child);
  }
  return { folders: folders.sort(byLabel), parameters: parameters.sort(byLabel) };
}

/** The folders from the top level down to `path`, inclusive. */
export function folderTrail(index: PolicyTreeIndex, path: string): ParameterTreeNode[] {
  const trail: ParameterTreeNode[] = [];
  let current: string | null | undefined = path;
  while (current) {
    const node = index.nodes.get(current);
    if (!node) {
      break;
    }
    trail.unshift(node);
    current = index.parents.get(current);
  }
  return trail;
}

/**
 * How many of `addablePaths` sit at or below each folder, by path, as
 * buildPolicyTreeIndex counts the whole tree: a parameter counts for every
 * folder its path runs through (`a.b[0].c` counts for `a`, `a.b` and
 * `a.b[0]`). A folder missing from the map has nothing a draft can add.
 */
export function addableCountsByFolder(addablePaths: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const path of addablePaths) {
    for (let index = 1; index < path.length; index += 1) {
      if (path[index] === '.' || path[index] === '[') {
        const folder = path.slice(0, index);
        counts.set(folder, (counts.get(folder) ?? 0) + 1);
      }
    }
  }
  return counts;
}
