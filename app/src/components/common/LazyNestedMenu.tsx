/**
 * LazyNestedMenu - Renders a nested parameter menu with API-backed lazy loading.
 *
 * Each expanded node fetches its children from the API via useParameterChildren.
 * Children are cached by TanStack Query so re-expanding a node is instant.
 */

import { useState } from 'react';
import { Loader, NavLink } from '@mantine/core';
import type { ParameterChildNode } from '@/api/v2';
import { useParameterChildren } from '@/hooks/useParameterChildren';

export interface LazyNestedMenuProps {
  /** Country ID for API calls (e.g., 'us', 'uk') */
  countryId: string;
  /** Parent path whose children are the root nodes (e.g., 'gov') */
  rootPath: string;
  /** Callback when a leaf parameter is clicked */
  onParameterClick?: (name: string) => void;
}

export default function LazyNestedMenu({
  countryId,
  rootPath,
  onParameterClick,
}: LazyNestedMenuProps) {
  const { children, isLoading } = useParameterChildren(rootPath, countryId);

  if (isLoading) {
    return <Loader size="sm" m="md" />;
  }

  return (
    <>
      {children.map((node) => (
        <LazyMenuNodeItem
          key={node.path}
          node={node}
          countryId={countryId}
          onParameterClick={onParameterClick}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal components
// ---------------------------------------------------------------------------

function LazyMenuNodeItem({
  node,
  countryId,
  onParameterClick,
}: {
  node: ParameterChildNode;
  countryId: string;
  onParameterClick?: (name: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const isLeaf = node.type === 'parameter';

  function handleClick() {
    setIsActive(true);
    if (isLeaf) {
      onParameterClick?.(node.path);
    } else {
      setIsExpanded((prev) => !prev);
    }
  }

  return (
    <NavLink
      label={node.label}
      active={isActive}
      onClick={handleClick}
      opened={isExpanded}
      childrenOffset={16}
    >
      {!isLeaf && isExpanded && (
        <LazyMenuChildren
          parentPath={node.path}
          countryId={countryId}
          onParameterClick={onParameterClick}
        />
      )}
    </NavLink>
  );
}

function LazyMenuChildren({
  parentPath,
  countryId,
  onParameterClick,
}: {
  parentPath: string;
  countryId: string;
  onParameterClick?: (name: string) => void;
}) {
  const { children, isLoading } = useParameterChildren(parentPath, countryId);

  if (isLoading) {
    return <Loader size="xs" m="xs" />;
  }

  return (
    <>
      {children.map((node) => (
        <LazyMenuNodeItem
          key={node.path}
          node={node}
          countryId={countryId}
          onParameterClick={onParameterClick}
        />
      ))}
    </>
  );
}
