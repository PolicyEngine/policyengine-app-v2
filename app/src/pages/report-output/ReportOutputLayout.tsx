import { IconCalendar, IconClock } from '@tabler/icons-react';
import { Box, Container, Group, Stack, Text, Title } from '@mantine/core';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getComparativeAnalysisTree } from './comparativeAnalysisTree';
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

  // Get the appropriate tree based on output type
  const sidebarTree =
    outputType === 'household' ? getHouseholdOutputTree() : getComparativeAnalysisTree(countryId);
  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
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
        {showSidebar && onSidebarNavigate ? (
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
    </Container>
  );
}
