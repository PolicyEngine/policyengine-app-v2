import {
  IconChevronLeft,
  IconClock,
  IconPencil,
  IconRefresh,
  IconShare,
  IconStack2,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getComparativeAnalysisTree } from './comparativeAnalysisTree';
import { ReportSidebar } from './ReportSidebar';

interface ReportOutputLayoutProps {
  reportId: string;
  reportLabel?: string;
  timestamp?: string;
  tabs: Array<{ value: string; label: string }>;
  activeTab: string;
  onTabChange: (tabValue: string) => void;
  onRunAgain?: () => void;
  onShare?: () => void;
  onEditName?: () => void;
  showSidebar?: boolean;
  activeView?: string;
  onSidebarNavigate?: (view: string) => void;
  children: React.ReactNode;
}

/**
 * ReportOutputLayout - Structural chrome for report output pages
 *
 * Provides consistent layout with:
 * - Back navigation
 * - Header with title and actions
 * - Tab navigation bar
 * - Content area (children)
 *
 * This is a pure presentational component with no data fetching or business logic.
 */
export default function ReportOutputLayout({
  reportId,
  reportLabel,
  timestamp = 'Ran today at 05:23:41',
  tabs,
  activeTab,
  onTabChange,
  onRunAgain,
  onShare,
  onEditName,
  showSidebar = false,
  activeView = '',
  onSidebarNavigate,
  children,
}: ReportOutputLayoutProps) {
  const countryId = useCurrentCountry();
  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Back navigation */}
        <Group gap={spacing.xs} align="center">
          <IconChevronLeft size={20} color={colors.text.secondary} />
          <Text size="md" c={colors.text.secondary}>
            Reports
          </Text>
        </Group>

        {/* Header Section */}
        <Box>
          {/* Title row with actions */}
          <Group justify="space-between" align="flex-start" mb={spacing.xs}>
            <Group gap={spacing.xs} align="center">
              <Title
                order={1}
                variant="colored"
                fw={typography.fontWeight.semibold}
                fz={typography.fontSize['3xl']}
              >
                {reportLabel || reportId}
              </Title>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Edit report name"
                onClick={onEditName}
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Group>

            <Group gap={spacing.sm}>
              <Button
                variant="filled"
                leftSection={<IconRefresh size={18} />}
                bg={colors.warning}
                c={colors.black}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: colors.warning,
                      filter: 'brightness(0.95)',
                    },
                  },
                }}
                onClick={onRunAgain}
              >
                Run Again
              </Button>
              <Button variant="default" leftSection={<IconShare size={18} />} onClick={onShare}>
                Share
              </Button>
            </Group>
          </Group>

          {/* Timestamp and View All */}
          <Group gap={spacing.xs} align="center">
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              {timestamp}
            </Text>
            <Anchor size="sm" underline="always" c={colors.blue[700]}>
              View All
            </Anchor>
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
                <IconStack2 size={14} color={colors.gray[500]} />
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
              tree={getComparativeAnalysisTree(countryId)}
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
