import { Button, Group } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export default function HeaderActionButtons() {
  return (
    <Group gap={spacing.sm} visibleFrom="lg">
      <Button
        style={{ backgroundColor: colors.warning, borderRadius: spacing.radius.md }}
        c={colors.text.primary}
        fw={typography.fontWeight.semibold}
        size="sm"
      >
        Sign Up
      </Button>
    </Group>
  );
}
