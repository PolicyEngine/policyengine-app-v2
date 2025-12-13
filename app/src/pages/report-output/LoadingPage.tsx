import { Box, Group, Loader, Progress, Skeleton, Stack, Text } from '@mantine/core';
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
    <Stack gap={spacing.xl}>
      {/* Progress Bar with Status */}
      <Box>
        <Group justify="space-between" align="center" mb={spacing.xs}>
          <Text fw={typography.fontWeight.medium} c={colors.text.primary}>
            {message ||
              (queuePosition ? `Queue position: ${queuePosition}` : 'Processing calculation...')}
          </Text>
          <Group gap={spacing.xs}>
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {Math.round(progressValue)}%
            </Text>
          </Group>
        </Group>
        <Progress value={progressValue} size="lg" radius="md" animated color={colors.button.primaryBg} />
        {estimatedTime && (
          <Text size="sm" c="dimmed" mt={spacing.xs}>
            Estimated time remaining: {estimatedTime}
          </Text>
        )}
      </Box>

      {/* Skeleton Preview of Report Structure */}
      <Box>
        <Box
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          {/* Skeleton Tabs */}
          <Box
            style={{
              display: 'flex',
              gap: spacing.xs,
              borderBottom: `1px solid ${colors.border.light}`,
              paddingBottom: spacing.xs,
            }}
          >
            <Skeleton height={32} width={100} radius="sm" />
            <Skeleton height={32} width={160} radius="sm" />
            <Skeleton height={32} width={200} radius="sm" />
            <Skeleton height={32} width={120} radius="sm" />
            <Skeleton height={32} width={100} radius="sm" />
          </Box>

          {/* Skeleton Content Area */}
          <Stack gap={spacing.lg} mt={spacing.xl}>
            <Skeleton height={40} width="60%" />
            <Skeleton height={20} width="40%" />

            <Box
              p={spacing.xl}
              style={{
                border: `1px solid ${colors.border.light}`,
                borderRadius: spacing.sm,
              }}
            >
              <Stack gap={spacing.md}>
                <Skeleton height={24} width="30%" />
                <Skeleton height={120} />
                <Group gap={spacing.md}>
                  <Skeleton height={80} style={{ flex: 1 }} />
                  <Skeleton height={80} style={{ flex: 1 }} />
                  <Skeleton height={80} style={{ flex: 1 }} />
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Info Message */}
      <Box
        p={spacing.md}
        style={{
          backgroundColor: colors.blue[50],
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.sm,
        }}
      >
        <Text size="sm" c={colors.gray[700]}>
          {queuePosition
            ? `Your report is queued at position ${queuePosition}. The page will automatically update when ready.`
            : 'Your report is being calculated. This may take a few moments for complex analyses. The page will automatically update when ready.'}
        </Text>
      </Box>
    </Stack>
  );
}
