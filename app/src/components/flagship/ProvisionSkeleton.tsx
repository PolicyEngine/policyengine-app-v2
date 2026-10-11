import { Skeleton } from '@/components/ui';
import { colors, spacing } from '@/designTokens';

/**
 * Placeholder rows for provisions whose names and units are still
 * loading, in place of raw parameter paths and unformatted values
 * ("gov.states.ga.tax.income.main.flat_rate: 0.0499").
 */
export default function ProvisionSkeleton({ count }: { count: number }) {
  const rows = Math.max(1, Math.min(count, 5));
  return (
    <div role="status" aria-busy="true" aria-label="Loading parameter names">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.lg,
            padding: `${spacing.md} 0`,
            borderTop: index > 0 ? `1px solid ${colors.border.light}` : 'none',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <Skeleton style={{ height: 14, width: '40%' }} />
            <Skeleton style={{ height: 12, width: '75%' }} />
          </div>
          <Skeleton style={{ height: 14, width: 72 }} />
        </div>
      ))}
    </div>
  );
}
