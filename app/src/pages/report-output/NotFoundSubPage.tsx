import { IconAlertCircle } from '@tabler/icons-react';
import { Box, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

/**
 * 404 page for invalid sub-page routes
 */
export default function NotFoundSubPage() {
  return (
    <Box
      p={spacing.xl}
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        backgroundColor: colors.background.primary,
        textAlign: 'center',
      }}
    >
      <Stack gap={spacing.lg} align="center">
        <IconAlertCircle size={48} color={colors.gray[400]} />
        <Stack gap={spacing.xs} align="center">
          <Title order={3} fw={typography.fontWeight.semibold} c={colors.text.primary}>
            Page Not Found
          </Title>
          <Text c="dimmed" size="sm">
            The sub-page you're looking for doesn't exist or hasn't been implemented yet.
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
}
