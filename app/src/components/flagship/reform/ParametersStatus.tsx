import { IconSearch } from '@tabler/icons-react';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { ROW_GRID, WIDE_ONLY } from './DraftTable';

/** The search bar and its filter row, as placeholders at their own size. */
export function SearchBarSkeleton() {
  return (
    <div>
      <div
        className="tw:border tw:border-border-light tw:shadow-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.lg} ${spacing.xl}`,
          borderRadius: spacing.radius.feature,
          background: colors.background.primary,
        }}
      >
        <IconSearch size={20} color={colors.text.tertiary} style={{ flexShrink: 0 }} />
        {/* The input's line box, so the bar is as tall as the real one. */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 24 }}>
          <SkeletonLine width="55%" height={16} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
        <SkeletonLine width={150} height={30} />
        <SkeletonLine width={140} height={30} />
        <SkeletonLine width={170} height={30} />
      </div>
    </div>
  );
}

const headerCell: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

/** The reform table with placeholder rows, the add bar's placeholder at its foot. */
function DraftTableSkeleton({ rows }: { rows: number }) {
  const count = Math.max(1, Math.min(rows, 8));
  return (
    <div
      className="tw:@container"
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div
        className={ROW_GRID}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <span style={headerCell}>Parameter</span>
        <span className={WIDE_ONLY} style={headerCell}>
          Current law
        </span>
        <span style={headerCell}>New value</span>
        <span className={WIDE_ONLY} style={headerCell}>
          Effective
        </span>
        <span />
      </div>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={ROW_GRID}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            borderTop: index > 0 ? `1px solid ${colors.border.light}` : undefined,
          }}
        >
          <SkeletonLine width="60%" />
          <span className={WIDE_ONLY}>
            <SkeletonLine width="70%" />
          </span>
          <SkeletonLine height={36} />
          <span className={WIDE_ONLY}>
            <SkeletonLine width="80%" height={12} />
          </span>
          <span />
        </div>
      ))}
      <div
        style={{
          padding: `${spacing.md} ${spacing.lg}`,
          borderTop: `1px solid ${colors.border.light}`,
          borderRadius: `0 0 ${spacing.radius.feature} ${spacing.radius.feature}`,
          background: colors.gray[50],
        }}
      >
        <SearchBarSkeleton />
      </div>
    </div>
  );
}

/**
 * Build waits on the model's parameters: the add bar has nothing to
 * search and the table cannot group breakdowns until they arrive. While
 * they load, placeholders hold the bar's place (and the table's, for a
 * draft of `rows` parameters); if they fail, the error says so and asks
 * for them again.
 */
export default function ParametersStatus({ rows = 0 }: { rows?: number }) {
  const metadata = useFlagshipMetadataStatus();

  if (metadata.status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ErrorState title="Could not load the parameters" onRetry={metadata.retry} />
      </div>
    );
  }

  return (
    <SkeletonRegion label="Loading parameters">
      {rows > 0 ? <DraftTableSkeleton rows={rows} /> : <SearchBarSkeleton />}
    </SkeletonRegion>
  );
}
