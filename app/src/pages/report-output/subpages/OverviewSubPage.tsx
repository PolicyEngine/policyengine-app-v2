import { Box, Stack, Text, Title } from '@mantine/core';
import { EconomyReportOutput } from '@/api/economy';
import { colors, spacing, typography } from '@/designTokens';
import { Household } from '@/types/ingredients/Household';
import { ReportOutputType } from '@/pages/ReportOutput.page';

interface OverviewSubPageProps {
  output: EconomyReportOutput | Household;
  outputType: ReportOutputType;
}

/**
 * Overview sub-page - displays high-level summary of report results
 * This is a placeholder that will be replaced with actual implementation
 */
export default function OverviewSubPage({ output, outputType }: OverviewSubPageProps) {
  return (
    <Box
      p={spacing.xl}
      style={{
        border: `1px dashed ${colors.border.light}`,
        borderRadius: spacing.sm,
        backgroundColor: colors.background.secondary,
      }}
    >
      <Stack gap={spacing.md}>
        <Title order={3} fw={typography.fontWeight.medium}>
          Overview Sub-Page
        </Title>
        <Text c="dimmed">
          This is a placeholder for the overview sub-page component. It will display a high-level
          summary of the report results.
        </Text>
        <Text size="sm" c="dimmed">
          Output type: <strong>{outputType}</strong>
        </Text>
        <Text size="xs" c="dimmed" ff="monospace">
          Output data available: {Object.keys(output).slice(0, 5).join(', ')}...
        </Text>
      </Stack>
    </Box>
  );
}
