import { useEffect, useState, type ReactElement } from 'react';
import { Box, NavLink, ScrollArea } from '@mantine/core';
import { spacing } from '@/designTokens';
import type { TreeNode } from './comparativeAnalysisTree';

interface ReportSidebarProps {
  tree: TreeNode[];
  activeView: string;
  onNavigate: (view: string) => void;
}

/**
 * Left sidebar menu for tabs with nested subviews (e.g., Comparative Analysis).
 */
export function ReportSidebar({ tree, activeView, onNavigate }: ReportSidebarProps) {
  // Track which item is currently active (clicked)
  const [active, setActive] = useState<string | null>(activeView);

  // Track which parent items are expanded
  const [selectedSet, setSelectedSet] = useState<Set<string>>(() => {
    // Auto-expand parents if any child is active
    const initialExpanded = new Set<string>();
    tree.forEach((node) => {
      if (isChildActive(node, activeView)) {
        initialExpanded.add(node.name);
        // Also expand second-level parents
        node.children?.forEach((child) => {
          if (isChildActive(child, activeView)) {
            initialExpanded.add(child.name);
          }
        });
      }
    });
    return initialExpanded;
  });

  // Update active state when activeView changes from outside (e.g., URL navigation)
  useEffect(() => {
    setActive(activeView);
  }, [activeView]);

  function handleClick(name: string, hasChildren: boolean) {
    // Only navigate if it's a leaf node (has no children)
    if (!hasChildren) {
      onNavigate(name);
    }

    // ALWAYS set as active (highlight it)
    setActive(name);

    // If has children, toggle expand/collapse
    if (hasChildren) {
      setSelectedSet((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(name)) {
          newSet.delete(name);
        } else {
          newSet.add(name);
        }
        return newSet;
      });
    }
  }

  function renderNode(node: TreeNode): ReactElement {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = selectedSet.has(node.name);
    const isActive = active === node.name;

    return (
      <NavLink
        key={node.name}
        label={node.label}
        active={isActive}
        opened={hasChildren ? isExpanded : undefined}
        onClick={() => handleClick(node.name, hasChildren)}
        disabled={node.disabled}
      >
        {hasChildren && isExpanded && node.children?.map((child) => renderNode(child))}
      </NavLink>
    );
  }

  return (
    <Box
      bg="gray.0"
      style={{
        width: 250,
        padding: spacing.md,
        borderRight: '1px solid var(--mantine-color-gray-3)',
        position: 'sticky',
        top: spacing.xl,
        alignSelf: 'flex-start',
      }}
    >
      <ScrollArea.Autosize mah="calc(100vh - 250px)" type="auto" offsetScrollbars>
        {tree.map((node) => renderNode(node))}
      </ScrollArea.Autosize>
    </Box>
  );
}

/**
 * Helper to check if any descendant is the active view
 */
function isChildActive(node: TreeNode, activeView: string): boolean {
  if (node.name === activeView) {
    return true;
  }
  if (node.children) {
    return node.children.some((child) => isChildActive(child, activeView));
  }
  return false;
}
