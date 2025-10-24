import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { Box, Group, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import type { TreeNode } from './comparativeAnalysisTree';

interface MenuItemProps {
  node: TreeNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

function MenuItem({ node, activeView, onNavigate }: MenuItemProps) {
  const isActive = activeView === node.name;
  const isDisabled = node.disabled;

  return (
    <Box
      onClick={isDisabled ? undefined : () => onNavigate(node.name)}
      style={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: 8,
        backgroundColor: isActive ? colors.gray[100] : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && !isActive) {
          e.currentTarget.style.backgroundColor = colors.gray[50];
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Text
        size="sm"
        style={{
          color: isDisabled ? colors.gray[400] : isActive ? colors.text.primary : colors.gray[700],
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {node.label}
      </Text>
    </Box>
  );
}

interface MenuGroupProps {
  node: TreeNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

function MenuGroup({ node, activeView, onNavigate }: MenuGroupProps) {
  // Auto-expand if any child is active
  const isChildActive = node.children?.some(
    (child) => child.name === activeView || child.children?.some((c) => c.name === activeView)
  );
  const [expanded, setExpanded] = useState(isChildActive || false);
  const isDisabled = node.disabled;

  const toggleExpanded = () => {
    if (!isDisabled) {
      setExpanded(!expanded);
    }
  };

  return (
    <Box>
      <Box
        onClick={toggleExpanded}
        style={{
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: 8,
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = colors.gray[50];
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Group gap={spacing.xs}>
          {expanded ? (
            <IconChevronDown size={16} color={isDisabled ? colors.gray[400] : colors.gray[600]} />
          ) : (
            <IconChevronRight size={16} color={isDisabled ? colors.gray[400] : colors.gray[600]} />
          )}
          <Text
            size="sm"
            style={{
              color: isDisabled ? colors.gray[400] : colors.text.primary,
              fontWeight: 500,
            }}
          >
            {node.label}
          </Text>
        </Group>
      </Box>

      {expanded && node.children && (
        <Box style={{ paddingLeft: spacing.md }}>
          {node.children.map((child) =>
            child.children ? (
              <MenuGroup
                key={child.name}
                node={child}
                activeView={activeView}
                onNavigate={onNavigate}
              />
            ) : (
              <MenuItem
                key={child.name}
                node={child}
                activeView={activeView}
                onNavigate={onNavigate}
              />
            )
          )}
        </Box>
      )}
    </Box>
  );
}

interface ReportSidebarProps {
  tree: TreeNode[];
  activeView: string;
  onNavigate: (view: string) => void;
}

/**
 * Left sidebar menu for tabs with nested subviews (e.g., Comparative Analysis).
 * Renders expandable/collapsible groups with chevrons; leaf items navigate on click.
 */
export function ReportSidebar({ tree, activeView, onNavigate }: ReportSidebarProps) {
  return (
    <Box
      style={{
        width: 250,
        padding: spacing.md,
        borderRight: `1px solid ${colors.border.light}`,
        minHeight: '60vh',
      }}
    >
      {tree.map((node) =>
        node.children ? (
          <MenuGroup key={node.name} node={node} activeView={activeView} onNavigate={onNavigate} />
        ) : (
          <MenuItem key={node.name} node={node} activeView={activeView} onNavigate={onNavigate} />
        )
      )}
    </Box>
  );
}
