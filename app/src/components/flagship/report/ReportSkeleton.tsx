import { SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { colors, spacing } from '@/designTokens';

/** On the teal cover, placeholders are a light wash rather than gray. */
const ON_COVER = { background: `${colors.white}2e` };

/** One of the report's section tabs, by its rough label width. */
const TAB_WIDTHS = [64, 116, 64, 72, 76];

/**
 * A report on its way, laid out as the report: the teal cover with its
 * title, the section tabs, and the overview's summary, changes and
 * headline tiles — so the report takes its place without a jump.
 */
export default function ReportSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label} style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            borderRadius: spacing.radius.feature,
            padding: `${spacing['4xl']} ${spacing['2xl']}`,
            background: `linear-gradient(105deg, ${colors.primary[900]} 0%, ${colors.primary[800]} 55%, ${colors.primary[700]} 100%)`,
          }}
        >
          <SkeletonLine width="70%" height={36} style={ON_COVER} />
          <SkeletonLine width="45%" height={36} style={ON_COVER} />
          <SkeletonLine width={140} style={{ ...ON_COVER, marginTop: spacing.sm }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.lg,
            padding: `${spacing.sm} ${spacing.md}`,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          {TAB_WIDTHS.map((width, index) => (
            <SkeletonLine key={index} width={width} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <SkeletonLine width="95%" height={16} />
          <SkeletonLine width="80%" height={16} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.feature,
            background: colors.background.primary,
          }}
        >
          <SkeletonLine width="25%" />
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <SkeletonLine width="50%" />
              <SkeletonLine width={72} style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: spacing.md,
          }}
        >
          {[0, 1, 2].map((tile) => (
            <div
              key={tile}
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
              <SkeletonLine width="60%" height={12} />
              <SkeletonLine width="45%" height={24} />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
