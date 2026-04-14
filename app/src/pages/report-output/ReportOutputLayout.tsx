import { IconCalendar, IconClock } from '@tabler/icons-react';
import { BackBreadcrumb } from '@/components/common/BackBreadcrumb';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';
import { SharedReportTag } from '@/components/report/SharedReportTag';
import { Container, Group, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface ReportOutputLayoutProps {
  reportId: string;
  reportLabel?: string;
  reportYear?: string;
  modelVersion?: string;
  dataVersion?: string;
  timestamp?: string;
  backPath?: string;
  backLabel?: string;
  isSharedView?: boolean;
  shareUrl?: string;
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
  modelVersion,
  dataVersion,
  timestamp = 'Ran today at 05:23:41',
  backPath,
  backLabel,
  isSharedView = false,
  shareUrl,
  onSave,
  onView,
  onReproduce,
  children,
}: ReportOutputLayoutProps) {
  return (
    <Container size="xl" className="tw:px-xl">
      <Stack className="tw:gap-xl">
        {/* Back breadcrumb */}
        <BackBreadcrumb
          className="tw:gap-xs tw:items-center tw:cursor-pointer"
          style={{ marginBottom: `-${spacing.md}` }}
          backPath={backPath}
          backLabel={backLabel}
        />

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
              shareUrl={shareUrl}
              onSave={onSave}
              onView={onView}
              onReproduce={onReproduce}
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
          {(modelVersion || dataVersion) && (
            <Text className="tw:text-sm tw:mt-1" style={{ color: colors.text.secondary }}>
              Model version: {modelVersion ?? '—'} • Data version: {dataVersion ?? '—'}
            </Text>
          )}
        </div>

        {/* Content */}
        {children}
      </Stack>
    </Container>
  );
}
