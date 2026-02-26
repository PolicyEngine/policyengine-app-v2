import { IconAlertTriangle } from '@tabler/icons-react';
import { Box, Code, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { CodeBlock } from './CodeBlock';
import type { ReportErrorFallbackProps } from './types';

// Re-export types for external use
export type { ReportErrorFallbackProps } from './types';

/**
 * ReportErrorFallback - Error UI for report output pages
 *
 * Displays an error message with technical details including
 * error message and stack trace.
 */
export function ReportErrorFallback({ error, errorInfo }: ReportErrorFallbackProps) {
  return (
    <Paper
      p={spacing.xl}
      radius="md"
      style={{
        backgroundColor: colors.gray[50],
        border: `1px solid ${colors.gray[200]}`,
      }}
    >
      <Stack gap={spacing.lg}>
        {/* Header */}
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
              We encountered an error while loading this report.
            </Text>
          </Box>
        </Group>

        {/* Error message */}
        <Box>
          <Text size="sm" fw={typography.fontWeight.medium} mb={spacing.xs}>
            Error message
          </Text>
          <Code
            block
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message || 'Unknown error'}
          </Code>
        </Box>

        {/* Stack trace */}
        {error.stack && <CodeBlock title="Stack trace" content={error.stack} maxHeight="200px" />}

        {/* Component stack */}
        {errorInfo?.componentStack && (
          <CodeBlock title="Component stack" content={errorInfo.componentStack} maxHeight="200px" />
        )}
      </Stack>
    </Paper>
  );
}
