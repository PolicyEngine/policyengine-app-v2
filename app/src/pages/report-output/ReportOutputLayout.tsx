import { IconCalendar, IconChevronLeft, IconClock } from '@tabler/icons-react';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
import { Container, Group, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface ReportOutputLayoutProps {
  reportId: string;
  reportLabel?: string;
  reportYear?: string;
  timestamp?: string;
  isSharedView?: boolean;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
  shareUrl?: string | null;
  backPath?: string;
  backLabel?: string;
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
  onSave,
  onView,
  onReproduce,
  shareUrl,
  backPath,
  backLabel,
  children,
}: ReportOutputLayoutProps) {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();

  return (
    <Container size="xl" className="tw:px-xl">
      <Stack className="tw:gap-xl">
        {/* Back breadcrumb */}
        <Group
          className="tw:gap-xs tw:items-center tw:cursor-pointer"
          style={{ marginBottom: `-${spacing.md}` }}
          onClick={() => nav.push(backPath || `/${countryId}/reports`)}
        >
          <IconChevronLeft size={14} color={colors.text.secondary} />
          <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
            {backLabel ? `Back to ${backLabel}` : 'Back to reports'}
          </Text>
        </Group>

        {/* Header Section */}
        <div>
          {/* Title row with actions */}
          <Group className="tw:gap-xs tw:items-center tw:mb-xs tw:justify-between tw:flex-nowrap">
            <Group className="tw:gap-xs tw:items-center tw:flex-nowrap" style={{ minWidth: 0 }}>
              <Title
                order={1}
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize['3xl'],
                  color: colors.primary[700],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {reportLabel || reportId}
              </Title>
              {isSharedView && <SharedReportTag />}
            </Group>
            <ReportActionButtons
              isSharedView={isSharedView}
              onSave={onSave}
              onView={onView}
              onReproduce={onReproduce}
              shareUrl={shareUrl}
            />
          </Group>

          {/* Timestamp and year */}
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

        {/* Content */}
        {children}
      </Stack>
    </Container>
  );
}
