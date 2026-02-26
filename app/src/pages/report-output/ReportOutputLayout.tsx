import { useState, type ReactElement } from 'react';
import { IconCalendar, IconChevronUp, IconClock } from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  Drawer,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
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
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure();

  // Get the appropriate tree based on output type
  const sidebarTree =
    outputType === 'household' ? getHouseholdOutputTree() : getComparativeAnalysisTree(countryId);

  const showMobileDrawer = showSidebar && onSidebarNavigate && isMobile;
  const showDesktopSidebar = showSidebar && onSidebarNavigate && !isMobile;

  const activeViewLabel = activeView ? findViewLabel(sidebarTree, activeView) : null;

  function handleMobileNavigate(view: string) {
    if (onSidebarNavigate) {
      onSidebarNavigate(view);
      closeDrawer();
    }
  }

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl} pb={showMobileDrawer ? 60 : undefined}>
        {/* Header Section */}
        <Box>
          {/* Title row with actions */}
          <Group gap={spacing.xs} align="center" mb={spacing.xs}>
            <Title
              order={1}
              variant="colored"
              fw={typography.fontWeight.semibold}
              fz={typography.fontSize['3xl']}
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
          <Group gap={spacing.xs} align="center">
            {reportYear && (
              <>
                <IconCalendar size={16} color={colors.text.secondary} />
                <Text size="sm" c="dimmed">
                  Year: {reportYear}
                </Text>
                <Text size="sm" c="dimmed">
                  •
                </Text>
              </>
            )}
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              {timestamp}
            </Text>
          </Group>
        </Box>

        {/* Navigation Tabs */}
        <Box
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          <Box
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: `1px solid ${colors.border.light}`,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {tabs.map((tab, index) => (
              <Box
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                style={{
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingBottom: spacing.xs,
                  paddingTop: spacing.xs,
                  cursor: 'pointer',
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
                  variant="tab"
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
                  <Box
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
              </Box>
            ))}
          </Box>
        </Box>

        {/* Content Area with optional sidebar */}
        {showDesktopSidebar ? (
          <Group align="flex-start" gap={spacing.lg}>
            <ReportSidebar
              tree={sidebarTree}
              activeView={activeView}
              onNavigate={onSidebarNavigate}
            />
            <Box style={{ flex: 1 }}>{children}</Box>
          </Group>
        ) : (
          children
        )}
      </Stack>

      {/* Mobile bottom bar for comparative analysis navigation */}
      {showMobileDrawer && (
        <Box
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
          <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
            <Button
              variant="default"
              size="sm"
              onClick={openDrawer}
              leftSection={
                <IconChevronUp
                  size={16}
                  style={{
                    transform: drawerOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              }
            >
              {activeViewLabel || 'Select view'}
            </Button>
          </Group>
        </Box>
      )}

      {/* Mobile bottom drawer for sidebar navigation */}
      {showMobileDrawer && (
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          position="bottom"
          size="70%"
          title="Comparative analysis"
          zIndex={300}
        >
          <ScrollArea style={{ height: '100%' }} type="auto">
            <MobileTreeNav
              tree={sidebarTree}
              activeView={activeView}
              onNavigate={handleMobileNavigate}
            />
          </ScrollArea>
        </Drawer>
      )}
    </Container>
  );
}

/**
 * Full-width tree navigation for the mobile bottom drawer.
 * Renders the same NavLink tree as ReportSidebar but without
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

  function renderNode(node: TreeNode): ReactElement {
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedSet.has(node.name);
    return (
      <NavLink
        key={node.name}
        label={node.label}
        active={active === node.name}
        opened={hasChildren ? isExpanded : undefined}
        onClick={() => handleClick(node.name, hasChildren)}
        disabled={node.disabled}
      >
        {hasChildren && isExpanded && node.children?.map((child) => renderNode(child))}
      </NavLink>
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
