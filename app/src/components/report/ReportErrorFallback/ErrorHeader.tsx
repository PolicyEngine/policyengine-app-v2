import { IconAlertTriangle } from '@tabler/icons-react';
import { Box, Group, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

/**
 * Header section displaying the error icon and message
 */
export function ErrorHeader() {
  return (
    <Group gap={spacing.md} align="flex-start">
      <IconAlertTriangle
        size={32}
        color={colors.gray[600]}
        style={{ flexShrink: 0, marginTop: 4 }}
      />
      <Box>
        <Title
          order={3}
          fw={typography.fontWeight.semibold}
          c={colors.text.primary}
          mb={spacing.xs}
        >
          Something went wrong
        </Title>
        <Text size="sm" c={colors.text.secondary}>
          We encountered an error while loading this report. This may be due to a temporary issue or
          a problem with the report data.
        </Text>
      </Box>
    </Group>
  );
}
