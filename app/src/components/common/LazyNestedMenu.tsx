/**
 * LazyNestedMenu - Renders a nested menu with on-demand child loading.
 *
 * Unlike NestedMenu which expects pre-populated children arrays,
 * this component fetches children via a callback when a node is expanded.
 */

import { useState } from 'react';
import { NavLink } from '@mantine/core';

export interface LazyMenuNode {
  name: string;
  label: string;
  type: 'parameterNode' | 'parameter';
}

interface LazyNestedMenuProps {
  /** Initial nodes to display (root level) */
  nodes: LazyMenuNode[];
  /** Callback to get children for a path */
  getChildren: (path: string) => LazyMenuNode[];
  /** Callback when a leaf node (parameter) is clicked */
  onParameterClick?: (name: string) => void;
}

export default function LazyNestedMenu({
  nodes,
  getChildren,
  onParameterClick,
}: LazyNestedMenuProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [activePath, setActivePath] = useState<string | null>(null);

  function toggleExpanded(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function handleClick(node: LazyMenuNode) {
    setActivePath(node.name);

    if (node.type === 'parameter') {
      onParameterClick?.(node.name);
    } else {
      toggleExpanded(node.name);
    }
  }

  function renderNodes(nodeList: LazyMenuNode[]): React.ReactNode {
    return nodeList.map((node) => {
      const isExpanded = expandedPaths.has(node.name);
      const isLeaf = node.type === 'parameter';

      return (
        <NavLink
          key={node.name}
          label={node.label}
          active={activePath === node.name}
          onClick={() => handleClick(node)}
          opened={isExpanded}
          childrenOffset={16}
        >
          {!isLeaf && isExpanded && renderNodes(getChildren(node.name))}
        </NavLink>
      );
    });
  }

  return <>{renderNodes(nodes)}</>;
}
