import { useState, type ReactElement } from 'react';
import {
  IconCalendar,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconClock,
} from '@tabler/icons-react';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
import {
  Button,
  Container,
  Group,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useIsMobile } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getComparativeAnalysisTree, type TreeNode } from './comparativeAnalysisTree';
import { getHouseholdOutputTree } from './householdOutputTree';
import { ReportSidebar } from './ReportSidebar';

interface ReportOutputLayoutProps {
  reportId: string;
  reportLabel?: string;
  reportYear?: string;
  timestamp?: string;
  tabs: Array<{ value: string; label: string }>;
  activeTab: string;
  onTabChange: (tabValue: string) => void;
  onEditName?: () => void;
  showSidebar?: boolean;
  outputType?: 'household' | 'societyWide';
  activeView?: string;
  onSidebarNavigate?: (view: string) => void;
  isSharedView?: boolean;
  onShare?: () => void;
  onSave?: () => void;
  children: React.ReactNode;
}

/**
 * Find the label for a view name by walking the tree.
 * Returns "parent > child" for nested views.
 */
function findViewLabel(tree: TreeNode[], viewName: string, parentLabel?: string): string | null {
  for (const node of tree) {
    if (node.name === viewName) {
      return parentLabel ? `${parentLabel} — ${node.label}` : node.label;
    }
    if (node.children) {
      const found = findViewLabel(node.children, viewName, node.label);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * ReportOutputLayout - Structural chrome for report output pages
 *
 * Provides consistent layout with:
 * - Header with title and actions
 * - Tab navigation bar
 * - Content area (children)
 *
 * This is a pure presentational component with no data fetching or business logic.
 */
export default function ReportOutputLayout({
  reportId,
  reportLabel,
  reportYear,
  timestamp = 'Ran today at 05:23:41',
  tabs,
  activeTab,
  onTabChange,
  onEditName,
  showSidebar = false,
  outputType = 'societyWide',
  activeView = '',
  onSidebarNavigate,
  isSharedView = false,
  onShare,
  onSave,
  children,
}: ReportOutputLayoutProps) {
  const countryId = useCurrentCountry();
  const isMobile = useIsMobile();
  const [drawerOpened, setDrawerOpened] = useState(false);

  // Get the appropriate tree based on output type
  const sidebarTree =
    outputType === 'household' ? getHouseholdOutputTree() : getComparativeAnalysisTree(countryId);

  const showMobileDrawer = showSidebar && onSidebarNavigate && isMobile;
  const showDesktopSidebar = showSidebar && onSidebarNavigate && !isMobile;

  const activeViewLabel = activeView ? findViewLabel(sidebarTree, activeView) : null;

  function handleMobileNavigate(view: string) {
    if (onSidebarNavigate) {
      onSidebarNavigate(view);
      setDrawerOpened(false);
    }
  }

  return (
    <Container size="xl" className="tw:px-xl">
      <Stack
        className="tw:gap-xl"
        style={{ paddingBottom: showMobileDrawer ? spacing['5xl'] : undefined }}
      >
        {/* Header Section */}
        <div>
          {/* Title row with actions */}
          <Group className="tw:gap-xs tw:items-center tw:mb-xs">
            <Title
              order={1}
              style={{
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize['3xl'],
                color: colors.primary[700],
              }}
            >
              {reportLabel || reportId}
            </Title>
            {isSharedView && <SharedReportTag />}
            <ReportActionButtons
              isSharedView={isSharedView}
              onShare={onShare}
              onSave={onSave}
              onEdit={onEditName}
            />
          </Group>

          {/* Timestamp and View All */}
          <Group className="tw:gap-xs tw:items-center">
            {reportYear && (
              <>
                <IconCalendar size={16} color={colors.text.secondary} />
                <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
                  Year: {reportYear}
                </Text>
                <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
                  •
                </Text>
              </>
            )}
            <IconClock size={16} color={colors.text.secondary} />
            <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
              {timestamp}
            </Text>
          </Group>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: `1px solid ${colors.border.light}`,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {tabs.map((tab, index) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className="tw:cursor-pointer tw:bg-transparent tw:border-none tw:p-0"
                style={{
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingBottom: spacing.xs,
                  paddingTop: spacing.xs,
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  borderRight:
                    index < tabs.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  marginBottom: '-1px',
                }}
              >
                <Text
                  span
                  className="tw:text-sm"
                  style={{
                    color: activeTab === tab.value ? colors.text.primary : colors.gray[700],
                    fontWeight:
                      activeTab === tab.value
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                  }}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.value && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: colors.primary[700],
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area with optional sidebar */}
        {showDesktopSidebar ? (
          <Group className="tw:items-start tw:gap-lg">
            <ReportSidebar
              tree={sidebarTree}
              activeView={activeView}
              onNavigate={onSidebarNavigate}
            />
            <div className="tw:flex-1">{children}</div>
          </Group>
        ) : (
          children
        )}
      </Stack>

      {/* Mobile bottom bar for comparative analysis navigation */}
      {showMobileDrawer && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.md,
            backgroundColor: 'white',
            borderTop: `1px solid ${colors.border.light}`,
            zIndex: 200,
          }}
        >
          <Group className="tw:justify-between tw:items-center tw:gap-sm tw:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpened(true)}
              className="tw:flex tw:items-center tw:gap-xs"
            >
              <IconChevronUp
                size={16}
                style={{
                  transform: drawerOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
              {activeViewLabel || 'Select view'}
            </Button>
          </Group>
        </div>
      )}

      {/* Mobile bottom drawer for sidebar navigation */}
      {showMobileDrawer && (
        <Sheet open={drawerOpened} onOpenChange={setDrawerOpened}>
          <SheetContent side="bottom" className="tw:h-[70vh]" style={{ zIndex: 300 }}>
            <SheetHeader>
              <SheetTitle>Comparative analysis</SheetTitle>
            </SheetHeader>
            <ScrollArea className="tw:flex-1">
              <MobileTreeNav
                tree={sidebarTree}
                activeView={activeView}
                onNavigate={handleMobileNavigate}
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </Container>
  );
}

/**
 * Full-width tree navigation for the mobile bottom drawer.
 * Renders the same tree as ReportSidebar but without
 * desktop-specific styles (fixed width, border, sticky positioning).
 */
function MobileTreeNav({
  tree,
  activeView,
  onNavigate,
}: {
  tree: TreeNode[];
  activeView: string;
  onNavigate: (view: string) => void;
}) {
  const [active, setActive] = useState<string | null>(activeView);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    tree.forEach((node) => {
      if (hasActiveDescendant(node, activeView)) {
        initial.add(node.name);
        node.children?.forEach((child) => {
          if (hasActiveDescendant(child, activeView)) {
            initial.add(child.name);
          }
        });
      }
    });
    return initial;
  });

  function handleClick(name: string, hasChildren: boolean) {
    if (!hasChildren) {
      onNavigate(name);
    }
    setActive(name);
    if (hasChildren) {
      setExpandedSet((prev) => {
        const next = new Set(prev);
        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }
        return next;
      });
    }
  }

  function renderNode(node: TreeNode, depth: number = 0): ReactElement {
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedSet.has(node.name);
    const isActive = active === node.name;

    return (
      <div key={node.name}>
        <button
          type="button"
          className="tw:w-full tw:text-left tw:border-none tw:cursor-pointer tw:flex tw:items-center tw:gap-1 tw:text-sm tw:rounded"
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
          {hasChildren &&
            (isExpanded ? (
              <IconChevronDown size={14} style={{ flexShrink: 0 }} />
            ) : (
              <IconChevronRight size={14} style={{ flexShrink: 0 }} />
            ))}
          {node.label}
        </button>
        {hasChildren && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return <>{tree.map((node) => renderNode(node))}</>;
}

function hasActiveDescendant(node: TreeNode, activeView: string): boolean {
  if (node.name === activeView) {
    return true;
  }
  return node.children?.some((child) => hasActiveDescendant(child, activeView)) ?? false;
}
