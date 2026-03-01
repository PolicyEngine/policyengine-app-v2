import { useEffect, useState, type ReactElement } from 'react';
import { ScrollArea } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import type { TreeNode } from './comparativeAnalysisTree';

interface ReportSidebarProps {
  tree: TreeNode[];
  activeView: string;
  onNavigate: (view: string) => void;
  /** When true, hides on mobile. Defaults to true. */
  hideOnMobile?: boolean;
}

/**
 * Left sidebar menu for tabs with nested subviews (e.g., Comparative Analysis).
 */
export function ReportSidebar({
  tree,
  activeView,
  onNavigate,
  hideOnMobile = true,
}: ReportSidebarProps) {
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

  function renderNode(node: TreeNode, depth: number = 0): ReactElement {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = selectedSet.has(node.name);
    const isActive = active === node.name;

    return (
      <div key={node.name}>
        <button
          type="button"
          className="tw:w-full tw:text-left tw:border-none tw:cursor-pointer tw:flex tw:items-center tw:rounded"
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            paddingLeft: `calc(${spacing.sm} + ${depth * 12}px)`,
            backgroundColor: isActive ? colors.primary[50] : 'transparent',
            color: node.disabled
              ? colors.text.tertiary
              : isActive
                ? colors.primary[700]
                : colors.text.primary,
            fontWeight: isActive ? 500 : 400,
            opacity: node.disabled ? 0.6 : 1,
            pointerEvents: node.disabled ? 'none' : 'auto',
          }}
          onClick={() => handleClick(node.name, hasChildren)}
          disabled={node.disabled}
        >
          {node.label}
        </button>
        {hasChildren && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div
      className={hideOnMobile ? 'tw:hidden tw:sm:block' : undefined}
      style={{
        width: 250,
        padding: spacing.md,
        borderRight: `1px solid ${colors.border.light}`,
        position: 'sticky',
        top: spacing.xl,
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
      }}
    >
      <ScrollArea className="tw:max-h-[calc(100dvh-250px)]">
        {tree.map((node) => renderNode(node))}
      </ScrollArea>
    </div>
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
