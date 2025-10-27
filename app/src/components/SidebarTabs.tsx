import { ReactNode } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface SidebarTab {
  value: string;
  label: string;
}

interface SidebarTabsProps {
  /** Array of tab configurations */
  tabs: SidebarTab[];

  /** Currently active tab value */
  activeTab: string;

  /** Callback when tab is clicked */
  onTabChange: (value: string) => void;

  /** Content to display for the active tab */
  children: ReactNode;

  /** Optional minimum width for sidebar (default: 240px) */
  sidebarMinWidth?: string;
}

/**
 * Generic sidebar tabs component
 *
 * Displays vertical tabs in a left sidebar with content on the right.
 * Mirrors the styling pattern used in PolicyDesign1 page.
 *
 * @example
 * ```tsx
 * <SidebarTabs
 *   tabs={[
 *     { value: 'average', label: 'Average Change' },
 *     { value: 'relative', label: 'Relative Change' }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   {activeTab === 'average' && <AverageContent />}
 *   {activeTab === 'relative' && <RelativeContent />}
 * </SidebarTabs>
 * ```
 */
export function SidebarTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  sidebarMinWidth = '240px',
}: SidebarTabsProps) {
  return (
    <Group align="flex-start" gap={spacing.xl} style={{ flexWrap: 'nowrap' }}>
      {/* Left sidebar with vertical tabs */}
      <Box
        style={{
          minWidth: sidebarMinWidth,
          paddingRight: spacing.lg,
        }}
      >
        <Stack gap={4}>
          {tabs.map((tab) => (
            <Box
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              py={spacing.sm}
              px={spacing.md}
              style={{
                cursor: 'pointer',
                backgroundColor: activeTab === tab.value ? colors.gray[50] : 'transparent',
                borderLeft:
                  activeTab === tab.value
                    ? `3px solid ${colors.primary[500]}`
                    : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Text
                size="sm"
                fw={
                  activeTab === tab.value
                    ? typography.fontWeight.medium
                    : typography.fontWeight.normal
                }
                c={activeTab === tab.value ? colors.text.primary : colors.text.secondary}
              >
                {tab.label}
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Right content area */}
      <Box style={{ flex: 1 }}>{children}</Box>
    </Group>
  );
}
