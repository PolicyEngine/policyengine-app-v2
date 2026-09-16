/**
 * ParameterSidebar - Left sidebar with parameter search and tree navigation
 *
 * When activeTab / onTabChange are provided, renders a "Policy overview"
 * menu item above the search box. The item controls the main content
 * area — the sidebar itself always shows the parameter search + tree.
 */

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconListDetails,
  IconSearch,
} from '@tabler/icons-react';
import {
  Command,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';
import { modalStyles } from '../../styles';
import { ParameterSidebarProps } from './types';

const VISIBLE_CHILDREN_VIEWPORT_FRACTION = 0.5;

export function ParameterSidebar({
  parameterTree,
  metadataLoading,
  selectedParam,
  expandedMenuItems,
  parameterSearch,
  searchableParameters,
  onSearchChange,
  onSearchSelect,
  onMenuItemClick,
  activeTab,
  onTabChange,
}: ParameterSidebarProps) {
  const hasOverview = activeTab !== undefined && onTabChange !== undefined;
  const colorConfig = INGREDIENT_COLORS.policy;
  const [searchOpen, setSearchOpen] = useState(false);
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const folderButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const childGroupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingExpansionRef = useRef<string | null>(null);

  const handleMenuItemClick = useCallback(
    (name: string, hasChildren: boolean, isExpanded: boolean) => {
      if (hasChildren && !isExpanded) {
        pendingExpansionRef.current = name;
      }
      onMenuItemClick(name);
    },
    [onMenuItemClick]
  );

  useLayoutEffect(() => {
    const pendingExpansion = pendingExpansionRef.current;
    if (!pendingExpansion || !expandedMenuItems.has(pendingExpansion)) {
      return;
    }
    pendingExpansionRef.current = null;

    const treeScroll = treeScrollRef.current;
    const folderButton = folderButtonRefs.current.get(pendingExpansion);
    const childGroup = childGroupRefs.current.get(pendingExpansion);
    if (!treeScroll || !folderButton || !childGroup) {
      return;
    }

    const treeBounds = treeScroll.getBoundingClientRect();
    const folderBounds = folderButton.getBoundingClientRect();
    const childBounds = childGroup.getBoundingClientRect();
    const treeHeight = treeBounds.bottom - treeBounds.top;
    const desiredChildBottom = Math.min(
      childBounds.bottom,
      folderBounds.bottom + treeHeight * VISIBLE_CHILDREN_VIEWPORT_FRACTION
    );

    if (folderBounds.top < treeBounds.top) {
      treeScroll.scrollTop += folderBounds.top - treeBounds.top;
      return;
    }

    if (desiredChildBottom > treeBounds.bottom) {
      const availableScrollBeforeFolderIsHidden = folderBounds.top - treeBounds.top;
      treeScroll.scrollTop += Math.min(
        desiredChildBottom - treeBounds.bottom,
        availableScrollBeforeFolderIsHidden
      );
    }
  }, [expandedMenuItems]);

  // Filter search results
  const filteredSearchResults = useMemo(() => {
    if (!parameterSearch.trim()) {
      return [];
    }
    const query = parameterSearch.toLowerCase();
    return searchableParameters.filter((p) => p.label.toLowerCase().includes(query)).slice(0, 20);
  }, [parameterSearch, searchableParameters]);

  // Render nested menu recursively
  const renderMenuItems = useCallback(
    (items: ParameterTreeNode[]): React.ReactNode => {
      return items
        .filter((item) => !item.name.includes('pycache'))
        .map((item) => {
          const isActive = activeTab !== 'overview' && selectedParam?.parameter === item.name;
          const isExpanded = expandedMenuItems.has(item.name);
          const hasChildren = !!item.children?.length;
          const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;

          return (
            <div key={item.name}>
              <button
                ref={(element) => {
                  if (element && hasChildren) {
                    folderButtonRefs.current.set(item.name, element);
                  } else {
                    folderButtonRefs.current.delete(item.name);
                  }
                }}
                type="button"
                aria-expanded={hasChildren ? isExpanded : undefined}
                onClick={() => handleMenuItemClick(item.name, hasChildren, isExpanded)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: spacing.radius.element,
                  fontSize: FONT_SIZES.small,
                  background: isActive ? colorConfig.bg : 'transparent',
                  color: isActive ? colorConfig.icon : colors.gray[700],
                  fontWeight: isActive ? 600 : 400,
                  boxSizing: 'border-box',
                }}
              >
                {hasChildren ? (
                  <ChevronIcon size={14} style={{ flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 14, flexShrink: 0 }} />
                )}
                <span
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              </button>
              {hasChildren && isExpanded && (
                <div
                  ref={(element) => {
                    if (element) {
                      childGroupRefs.current.set(item.name, element);
                    } else {
                      childGroupRefs.current.delete(item.name);
                    }
                  }}
                  role="group"
                  aria-label={`${item.label} parameters`}
                  style={{ paddingLeft: 16 }}
                >
                  {renderMenuItems(item.children!)}
                </div>
              )}
            </div>
          );
        });
    },
    [activeTab, selectedParam?.parameter, expandedMenuItems, handleMenuItemClick, colorConfig]
  );

  // Memoize the rendered tree
  const renderedMenuTree = useMemo(() => {
    if (metadataLoading || !parameterTree) {
      return null;
    }
    return renderMenuItems(parameterTree.children || []);
  }, [metadataLoading, parameterTree, renderMenuItems]);

  return (
    <div
      style={{
        width: 280,
        borderRight: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        background: colors.gray[50],
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Policy overview menu item (optional) */}
        {hasOverview && (
          <div style={{ padding: `${spacing.sm} ${spacing.sm} 0` }}>
            <button
              type="button"
              style={{
                all: 'unset',
                ...modalStyles.sidebarItem,
                width: '100%',
                background: activeTab === 'overview' ? colorConfig.bg : 'transparent',
                color: activeTab === 'overview' ? colorConfig.icon : colors.gray[700],
              }}
              onClick={() => onTabChange('overview')}
            >
              <IconListDetails size={16} />
              <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>Policy overview</Text>
            </button>
          </div>
        )}

        {/* Search + tree — always visible */}
        <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border.light}` }}>
          {!hasOverview && (
            <Text
              fw={600}
              style={{
                fontSize: FONT_SIZES.small,
                color: colors.gray[600],
                marginBottom: spacing.sm,
              }}
            >
              PARAMETERS
            </Text>
          )}
          <Popover
            open={searchOpen && filteredSearchResults.length > 0}
            onOpenChange={setSearchOpen}
          >
            <PopoverTrigger asChild>
              <div className="tw:relative">
                <IconSearch
                  size={14}
                  className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2"
                  color={colors.gray[400]}
                />
                <Input
                  placeholder="Search parameters..."
                  value={parameterSearch}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="tw:pl-8 tw:h-8"
                  style={{ fontSize: FONT_SIZES.small }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="tw:p-0"
              style={{
                width: 'var(--radix-popover-trigger-width)',
                maxHeight: 300,
                overflow: 'auto',
              }}
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command>
                <CommandList>
                  {filteredSearchResults.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => {
                        onSearchSelect(item.value);
                        setSearchOpen(false);
                      }}
                      style={{ fontSize: FONT_SIZES.small, padding: `${spacing.xs} ${spacing.sm}` }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div
          ref={treeScrollRef}
          role="region"
          aria-label="Policy parameter tree"
          className="tw:flex-1 tw:min-h-0"
          style={{ overflowY: 'scroll' }}
        >
          <div style={{ padding: spacing.sm }}>
            {metadataLoading || !parameterTree ? (
              <Stack gap="xs">
                <Skeleton className="tw:h-8" />
                <Skeleton className="tw:h-8" />
                <Skeleton className="tw:h-8" />
              </Stack>
            ) : (
              renderedMenuTree
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
