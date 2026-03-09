/**
 * PolicyParameterTree - Parameter tree navigation for policy creation mode
 *
 * When activeTab / onTabChange are provided, renders a "Policy overview"
 * menu item above the search box. The item controls the main content
 * area — the sidebar itself always shows the parameter search + tree.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconListDetails,
  IconSearch,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  Command,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from '@/components/ui';
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
  const [searchOpen, setSearchOpen] = useState(false);

  // Get searchable parameters from memoized selector (computed once when metadata loads)
  const searchableParameters = useSelector(selectSearchableParameters);

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
                type="button"
                onClick={() => onMenuItemClick(item.name)}
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
                <div style={{ paddingLeft: 16 }}>{renderMenuItems(item.children!)}</div>
              )}
            </div>
          );
        });
    },
    [activeTab, selectedParam?.parameter, expandedMenuItems, onMenuItemClick, colorConfig]
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
        <Popover open={searchOpen && filteredSearchResults.length > 0} onOpenChange={setSearchOpen}>
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
                  setParameterSearch(e.target.value);
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
      <ScrollArea className="tw:flex-1">
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
      </ScrollArea>
    </div>
  );
}
