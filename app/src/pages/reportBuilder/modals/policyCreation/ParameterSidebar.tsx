/**
 * ParameterSidebar - Left sidebar with parameter search and tree navigation
 */

import React, { useCallback, useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Autocomplete, Box, NavLink, ScrollArea, Skeleton, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';
import { FONT_SIZES } from '../../constants';
import { ParameterSidebarProps } from './types';

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
}: ParameterSidebarProps) {
  // Render nested menu recursively
  const renderMenuItems = useCallback(
    (items: ParameterTreeNode[]): React.ReactNode => {
      return items
        .filter((item) => !item.name.includes('pycache'))
        .map((item) => (
          <NavLink
            key={item.name}
            label={item.label}
            active={selectedParam?.parameter === item.name}
            opened={expandedMenuItems.has(item.name)}
            onClick={() => onMenuItemClick(item.name)}
            childrenOffset={16}
            style={{
              borderRadius: spacing.radius.sm,
            }}
          >
            {item.children && expandedMenuItems.has(item.name) && renderMenuItems(item.children)}
          </NavLink>
        ));
    },
    [selectedParam?.parameter, expandedMenuItems, onMenuItemClick]
  );

  // Memoize the rendered tree
  const renderedMenuTree = useMemo(() => {
    if (metadataLoading || !parameterTree) {
      return null;
    }
    return renderMenuItems(parameterTree.children || []);
  }, [metadataLoading, parameterTree, renderMenuItems]);

  return (
    <Box
      style={{
        width: 280,
        borderRight: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        background: colors.gray[50],
      }}
    >
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border.light}` }}>
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
          <Autocomplete
            placeholder="Search parameters..."
            value={parameterSearch}
            onChange={onSearchChange}
            onOptionSubmit={onSearchSelect}
            data={searchableParameters}
            limit={20}
            leftSection={<IconSearch size={14} color={colors.gray[400]} />}
            styles={{
              input: {
                fontSize: FONT_SIZES.small,
                height: 32,
                minHeight: 32,
              },
              dropdown: {
                maxHeight: 300,
              },
              option: {
                fontSize: FONT_SIZES.small,
                padding: `${spacing.xs} ${spacing.sm}`,
              },
            }}
            size="xs"
          />
        </Box>
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Box style={{ padding: spacing.sm }}>
            {metadataLoading || !parameterTree ? (
              <Stack gap={spacing.xs}>
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
              </Stack>
            ) : (
              renderedMenuTree
            )}
          </Box>
        </ScrollArea>
      </Box>
    </Box>
  );
}
