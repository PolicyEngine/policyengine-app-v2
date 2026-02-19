/**
 * SimulationCanvasSkeleton - Loading placeholder for the simulation canvas
 */

import { Box, Group, Skeleton } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { styles } from '../styles';

export function SimulationCanvasSkeleton() {
  return (
    <Box style={styles.canvasContainer}>
      <Box style={styles.canvasGrid} />
      <Box style={styles.simulationsGrid}>
        {/* Simulation block skeleton */}
        <Box
          style={{
            background: colors.white,
            borderRadius: spacing.radius.lg,
            border: `2px solid ${colors.border.light}`,
            padding: spacing.xl,
            gridRow: 'span 4',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: spacing.lg,
          }}
        >
          <Group justify="space-between">
            <Skeleton height={24} width={180} radius="md" />
            <Skeleton height={20} width={20} radius="sm" />
          </Group>

          <Box
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.md,
            }}
          >
            <Group gap={spacing.xs} mb={spacing.md}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={60} radius="sm" />
            </Group>
            <Group gap={spacing.xs}>
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
            </Group>
          </Box>

          <Box
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.md,
            }}
          >
            <Group gap={spacing.xs} mb={spacing.md}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={80} radius="sm" />
            </Group>
            <Group gap={spacing.xs}>
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
            </Group>
          </Box>

          <Box
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.md,
            }}
          >
            <Group gap={spacing.xs} mb={spacing.md}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={70} radius="sm" />
            </Group>
            <Skeleton height={48} radius="md" />
          </Box>
        </Box>

        {/* Add simulation card skeleton */}
        <Box
          style={{
            background: colors.white,
            borderRadius: spacing.radius.lg,
            border: `2px dashed ${colors.gray[300]}`,
            padding: spacing.xl,
            gridRow: 'span 4',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
          }}
        >
          <Skeleton height={48} width={48} radius="xl" />
          <Skeleton height={20} width={140} radius="sm" />
          <Skeleton height={14} width={200} radius="sm" />
        </Box>
      </Box>
    </Box>
  );
}
