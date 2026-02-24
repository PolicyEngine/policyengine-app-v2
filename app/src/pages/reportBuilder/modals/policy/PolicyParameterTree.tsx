/**
 * PolicyParameterTree - Parameter tree navigation for policy creation mode
 *
 * When activeTab / onTabChange are provided, renders a "Policy overview"
 * menu item above the search box. The item controls the main content
 * area — the sidebar itself always shows the parameter search + tree.
 */
import { useCallback, useMemo } from 'react';
import { IconListDetails, IconSearch } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  Autocomplete,
  Box,
  NavLink,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { selectSearchableParameters } from '@/libs/metadataUtils';
import { ParameterTreeNode } from '@/types/metadata';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';
import { modalStyles } from '../../styles';
import type { SidebarTab } from '../policyCreation/types';

interface PolicyParameterTreeProps {
  parameterTree: ParameterTreeNode | null;
  parameters: Record<string, ParameterMetadata>;
  metadataLoading: boolean;
  selectedParam: ParameterMetadata | null;
  expandedMenuItems: Set<string>;
  parameterSearch: string;
  setParameterSearch: (search: string) => void;
  onMenuItemClick: (paramName: string) => void;
  onSearchSelect: (paramName: string) => void;
  /** Active sidebar tab — when provided, renders tab buttons above search */
  activeTab?: SidebarTab;
  /** Called when the user clicks a tab */
  onTabChange?: (tab: SidebarTab) => void;
}

export function PolicyParameterTree({
  parameterTree,
  parameters: _parameters,
  metadataLoading,
  selectedParam,
  expandedMenuItems,
  parameterSearch,
  setParameterSearch,
  onMenuItemClick,
  onSearchSelect,
  activeTab,
  onTabChange,
}: PolicyParameterTreeProps) {
  const hasOverview = activeTab !== undefined && onTabChange !== undefined;
  const colorConfig = INGREDIENT_COLORS.policy;

  // Get searchable parameters from memoized selector (computed once when metadata loads)
  const searchableParameters = useSelector(selectSearchableParameters);

  // Render nested menu recursively
  const renderMenuItems = useCallback(
    (items: ParameterTreeNode[]): React.ReactNode => {
      return items
        .filter((item) => !item.name.includes('pycache'))
        .map((item) => (
          <NavLink
            key={item.name}
            label={item.label}
            active={activeTab !== 'overview' && selectedParam?.parameter === item.name}
            opened={expandedMenuItems.has(item.name)}
            onClick={() => onMenuItemClick(item.name)}
            childrenOffset={16}
            color="primary"
            style={{ borderRadius: spacing.radius.sm }}
          >
            {item.children && expandedMenuItems.has(item.name) && renderMenuItems(item.children)}
          </NavLink>
        ));
    },
    [activeTab, selectedParam?.parameter, expandedMenuItems, onMenuItemClick]
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
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: `-${spacing.lg}`,
        marginRight: 0,
      }}
    >
      {/* Policy overview menu item (optional) */}
      {hasOverview && (
        <Box style={{ padding: `${spacing.sm} ${spacing.sm} 0` }}>
          <UnstyledButton
            style={{
              ...modalStyles.sidebarItem,
              width: '100%',
              background:
                activeTab === 'overview' ? 'var(--mantine-color-primary-light)' : 'transparent',
              color:
                activeTab === 'overview'
                  ? 'var(--mantine-color-primary-light-color)'
                  : colors.gray[700],
            }}
            onClick={() => onTabChange('overview')}
          >
            <IconListDetails size={16} />
            <Text style={{ fontSize: FONT_SIZES.small, flex: 1 }}>Policy overview</Text>
          </UnstyledButton>
        </Box>
      )}

      {/* Search + tree — always visible */}
      <Box style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border.light}` }}>
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
        <Autocomplete
          placeholder="Search parameters..."
          value={parameterSearch}
          onChange={setParameterSearch}
          onOptionSubmit={onSearchSelect}
          data={searchableParameters}
          limit={20}
          leftSection={<IconSearch size={14} color={colors.gray[400]} />}
          styles={{
            input: { fontSize: FONT_SIZES.small, height: 32, minHeight: 32 },
            dropdown: { maxHeight: 300 },
            option: { fontSize: FONT_SIZES.small, padding: `${spacing.xs} ${spacing.sm}` },
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
  );
}
