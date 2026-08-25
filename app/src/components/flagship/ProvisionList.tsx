import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { formatValue } from '@/utils/parameterValues';

export interface ProvisionListItem {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  value: any;
}

/**
 * A reform's provisions as a first-class card. Each row leads with the
 * parameter's own name, keeps its location in the parameter tree as
 * quiet context underneath, and states the change as current law → new
 * value. When the provision matches current law (enacted bills), the
 * arrow would be meaningless, so the row shows the single value with a
 * "current law" note instead.
 */
export default function ProvisionList({ provisions }: { provisions: ProvisionListItem[] }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      {provisions.map((provision, index) => {
        const parts = (provision.breadcrumb || provision.path).split(' → ');
        const name = parts[parts.length - 1] ?? provision.path;
        const context = parts.slice(0, -1).join(' → ');
        const baseline = formatValue(provision.baselineValue, provision.unit);
        const proposed = formatValue(provision.value, provision.unit);
        const unchanged = baseline === proposed;

        return (
          <div
            key={provision.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.lg,
              padding: `${spacing.sm} ${spacing.md}`,
              borderTop: index > 0 ? `1px solid ${colors.border.light}` : 'none',
            }}
          >
            <Stack style={{ gap: 2, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  lineHeight: 1.35,
                }}
              >
                {name}
              </Text>
              {context && (
                <Text
                  title={provision.breadcrumb}
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {context}
                </Text>
              )}
            </Stack>
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                color: colors.text.secondary,
                textAlign: 'right',
              }}
            >
              {unchanged ? (
                <>
                  <span
                    style={{
                      color: colors.primary[700],
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.base,
                    }}
                  >
                    {proposed}
                  </span>{' '}
                  <span style={{ fontSize: typography.fontSize.xs }}>current law</span>
                </>
              ) : (
                <>
                  {baseline} →{' '}
                  <span
                    style={{
                      color: colors.primary[700],
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.base,
                    }}
                  >
                    {proposed}
                  </span>
                </>
              )}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
