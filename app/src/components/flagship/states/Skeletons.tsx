import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { colors, spacing } from '@/designTokens';

/**
 * A loading region: one live status, named for what is coming, around
 * placeholder shapes laid out like the view that replaces them, so
 * nothing jumps when it arrives.
 */
export function SkeletonRegion({
  label,
  children,
  style,
}: {
  /** What is loading, e.g. "Loading bills". */
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} style={style}>
      {children}
    </div>
  );
}

/** One placeholder line of text or a control, at the size of what it stands for. */
export function SkeletonLine({
  width = '100%',
  height = 14,
  style,
}: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  style?: CSSProperties;
}) {
  return <Skeleton style={{ width, height, flexShrink: 0, ...style }} />;
}

/** The card grid's own columns, so the placeholders fill the same tracks. */
export const CARD_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
  gap: spacing.md,
};

/** One card: eyebrow, two-line title, two-line summary, and a stats line when cards carry one. */
function CardSkeleton({ withStats }: { withStats: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
      }}
    >
      <SkeletonLine width="30%" height={10} />
      <SkeletonLine width="90%" height={16} />
      <SkeletonLine width="60%" height={16} />
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="75%" height={12} />
      {withStats && (
        <div
          style={{
            display: 'flex',
            gap: spacing.lg,
            marginTop: spacing.xs,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.border.light}`,
          }}
        >
          <SkeletonLine width={96} height={14} />
          <SkeletonLine width={80} height={14} />
        </div>
      )}
    </div>
  );
}

/** A grid of cards still on its way: the Reforms surface's bills and saved reforms. */
export function CardGridSkeleton({
  label,
  count = 6,
  withStats = false,
}: {
  label: string;
  count?: number;
  withStats?: boolean;
}) {
  return (
    <SkeletonRegion label={label} style={CARD_GRID_STYLE}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} withStats={withStats} />
      ))}
    </SkeletonRegion>
  );
}
