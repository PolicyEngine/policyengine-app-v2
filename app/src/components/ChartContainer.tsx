import type { ReactNode } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { colors } from '@/designTokens/colors';
import { spacing } from '@/designTokens/spacing';

interface ChartContainerProps {
  children: ReactNode;
  title: string;
  onDownloadCsv: () => void;
}

/**
 * A consistent container for charts with standard border, padding, and background styling.
 * Automatically renders a header with title and CSV download button.
 *
 * @param title - Chart title text
 * @param onDownloadCsv - Callback function for CSV download
 * @param children - Main content (description and chart) displayed inside the white card
 */
export function ChartContainer({ children, title, onDownloadCsv }: ChartContainerProps) {
  return (
    <Stack gap={spacing.md}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="lg" fw={500} style={{ flex: 1, wordWrap: 'break-word' }}>
          {title}
        </Text>
        <Button variant="outline" size="sm" onClick={onDownloadCsv} style={{ flexShrink: 0 }}>
          Download CSV
        </Button>
      </Group>

      <Box
        p={spacing.md}
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: '8px',
          backgroundColor: colors.white,
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}
