/**
 * SimulationCanvasSkeleton - Loading placeholder for the simulation canvas
 */

import { Group, Skeleton } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { styles } from '../styles';

export function SimulationCanvasSkeleton() {
  return (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasGrid} />
      <div style={styles.simulationsGrid}>
        {/* Simulation block skeleton */}
        <div
          style={{
            background: colors.white,
            borderRadius: spacing.radius.feature,
            border: `2px solid ${colors.border.light}`,
            padding: spacing.xl,
            gridRow: 'span 4',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: spacing.lg,
          }}
        >
          <Group justify="space-between">
            <Skeleton className="tw:h-[24px]" style={{ width: 180 }} />
            <Skeleton className="tw:h-[20px] tw:rounded-sm" style={{ width: 20 }} />
          </Group>

          <div
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.container,
            }}
          >
            <Group gap="xs" style={{ marginBottom: spacing.md }}>
              <Skeleton className="tw:h-[32px]" style={{ width: 32 }} />
              <Skeleton className="tw:h-[16px] tw:rounded-sm" style={{ width: 60 }} />
            </Group>
            <Group gap="xs">
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
            </Group>
          </div>

          <div
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.container,
            }}
          >
            <Group gap="xs" style={{ marginBottom: spacing.md }}>
              <Skeleton className="tw:h-[32px]" style={{ width: 32 }} />
              <Skeleton className="tw:h-[16px] tw:rounded-sm" style={{ width: 80 }} />
            </Group>
            <Group gap="xs">
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
              <Skeleton className="tw:h-[80px]" style={{ flex: 1 }} />
            </Group>
          </div>

          <div
            style={{
              padding: spacing.lg,
              background: colors.gray[50],
              borderRadius: spacing.radius.container,
            }}
          >
            <Group gap="xs" style={{ marginBottom: spacing.md }}>
              <Skeleton className="tw:h-[32px]" style={{ width: 32 }} />
              <Skeleton className="tw:h-[16px] tw:rounded-sm" style={{ width: 70 }} />
            </Group>
            <Skeleton className="tw:h-[48px]" />
          </div>
        </div>

        {/* Add simulation card skeleton */}
        <div
          style={{
            background: colors.white,
            borderRadius: spacing.radius.feature,
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
          <Skeleton className="tw:h-[48px] tw:rounded-xl" style={{ width: 48 }} />
          <Skeleton className="tw:h-[20px] tw:rounded-sm" style={{ width: 140 }} />
          <Skeleton className="tw:h-[14px] tw:rounded-sm" style={{ width: 200 }} />
        </div>
      </div>
    </div>
  );
}
