import { Group, Progress, Skeleton, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface LoadingPageProps {
  progress?: number;
  message?: string;
  queuePosition?: number;
  estimatedTimeRemaining?: number;
}

/**
 * Loading page component displayed while report calculation is in progress
 */
export default function LoadingPage({
  progress,
  message,
  queuePosition,
  estimatedTimeRemaining,
}: LoadingPageProps) {
  // Calculate progress value
  // Note: progress is already 0-100, not 0-1, so don't multiply by 100
  const progressValue = progress ?? (queuePosition ? 100 - queuePosition : 50);

  // Format estimated time
  const formatTime = (ms?: number) => {
    if (!ms) {
      return null;
    }
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const estimatedTime = formatTime(estimatedTimeRemaining);

  return (
    <Stack className="tw:gap-xl">
      {/* Progress Bar with Status */}
      <div>
        <Group className="tw:justify-between tw:items-center tw:mb-xs">
          <Text style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
            {message ||
              (queuePosition ? `Queue position: ${queuePosition}` : 'Processing calculation...')}
          </Text>
          <Group className="tw:gap-xs">
            <Spinner size="sm" />
            <Text className="tw:text-sm tw:text-gray-500">
              {Math.round(progressValue)}%
            </Text>
          </Group>
        </Group>
        <Progress value={progressValue} className="tw:h-3" />
        {estimatedTime && (
          <Text className="tw:text-sm tw:text-gray-500 tw:mt-xs">
            Estimated time remaining: {estimatedTime}
          </Text>
        )}
      </div>

      {/* Skeleton Preview of Report Structure */}
      <div>
        <div
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          {/* Skeleton Tabs */}
          <div
            className="tw:flex tw:pb-xs"
            style={{
              gap: spacing.xs,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Skeleton className="tw:h-8 tw:w-[100px] tw:rounded-sm" />
            <Skeleton className="tw:h-8 tw:w-[160px] tw:rounded-sm" />
            <Skeleton className="tw:h-8 tw:w-[200px] tw:rounded-sm" />
            <Skeleton className="tw:h-8 tw:w-[120px] tw:rounded-sm" />
            <Skeleton className="tw:h-8 tw:w-[100px] tw:rounded-sm" />
          </div>

          {/* Skeleton Content Area */}
          <Stack className="tw:gap-lg tw:mt-xl">
            <Skeleton className="tw:h-10 tw:w-[60%]" />
            <Skeleton className="tw:h-5 tw:w-[40%]" />

            <div
              className="tw:p-xl"
              style={{
                border: `1px solid ${colors.border.light}`,
                borderRadius: spacing.radius.container,
              }}
            >
              <Stack className="tw:gap-md">
                <Skeleton className="tw:h-6 tw:w-[30%]" />
                <Skeleton className="tw:h-[120px]" />
                <Group className="tw:gap-md">
                  <Skeleton className="tw:h-20 tw:flex-1" />
                  <Skeleton className="tw:h-20 tw:flex-1" />
                  <Skeleton className="tw:h-20 tw:flex-1" />
                </Group>
              </Stack>
            </div>
          </Stack>
        </div>
      </div>

      {/* Info Message */}
      <div
        className="tw:p-md"
        style={{
          backgroundColor: colors.blue[50],
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
        }}
      >
        <Text className="tw:text-sm" style={{ color: colors.gray[700] }}>
          {queuePosition
            ? `Your report is queued at position ${queuePosition}. The page will automatically update when ready.`
            : 'Your report is being calculated. This may take a few moments for complex analyses. The page will automatically update when ready.'}
        </Text>
      </div>
    </Stack>
  );
}
