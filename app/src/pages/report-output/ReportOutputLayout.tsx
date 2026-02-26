import { IconCalendar, IconChevronLeft, IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Group, Stack, Text, Title } from '@mantine/core';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface ReportOutputLayoutProps {
  reportId: string;
  reportLabel?: string;
  reportYear?: string;
  timestamp?: string;
  isSharedView?: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
  children: React.ReactNode;
}

/**
 * ReportOutputLayout - Structural chrome for report output pages
 *
 * Provides consistent layout with:
 * - Breadcrumb navigation
 * - Header with title and actions
 * - Content area (children)
 *
 * This is a pure presentational component with no data fetching or business logic.
 */
export default function ReportOutputLayout({
  reportId,
  reportLabel,
  reportYear,
  timestamp = 'Ran today at 05:23:41',
  isSharedView = false,
  onShare,
  onSave,
  onView,
  onReproduce,
  children,
}: ReportOutputLayoutProps) {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Back breadcrumb */}
        <Group
          gap={spacing.xs}
          align="center"
          style={{ cursor: 'pointer', marginBottom: `-${spacing.md}` }}
          onClick={() => navigate(`/${countryId}/reports`)}
        >
          <IconChevronLeft size={14} color={colors.gray[500]} />
          <Text size="sm" c="dimmed">
            Back to reports
          </Text>
        </Group>

        {/* Header Section */}
        <Box>
          {/* Title row with actions */}
          <Group
            gap={spacing.xs}
            align="center"
            mb={spacing.xs}
            justify="space-between"
            wrap="nowrap"
          >
            <Group gap={spacing.xs} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
              <Title
                order={1}
                variant="colored"
                fw={typography.fontWeight.semibold}
                fz={typography.fontSize['3xl']}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {reportLabel || reportId}
              </Title>
              {isSharedView && <SharedReportTag />}
            </Group>
            <ReportActionButtons
              isSharedView={isSharedView}
              onShare={onShare}
              onSave={onSave}
              onView={onView}
              onReproduce={onReproduce}
            />
          </Group>

          {/* Timestamp and year */}
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

        {/* Content */}
        {children}
      </Stack>
    </Container>
  );
}
