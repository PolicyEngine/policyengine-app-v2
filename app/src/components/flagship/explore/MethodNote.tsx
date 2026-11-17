import { IconInfoCircle } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import type { ExploreMetric } from '@/libs/flagship/explore/exploreMetrics';

const termStyle = {
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
  marginTop: spacing.sm,
};
const textStyle = {
  margin: '2px 0 0',
  fontSize: typography.fontSize.sm,
  color: colors.gray[700],
  lineHeight: 1.45,
};

/** "How we measure this": what the number is, where it comes from, its limits, and where to read more. */
export default function MethodNote({ metric }: { metric: ExploreMetric }) {
  return (
    <details
      style={{
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTop: `1px solid ${colors.border.light}`,
      }}
    >
      <summary
        className="tw:cursor-pointer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          fontWeight: typography.fontWeight.medium,
          color: colors.gray[700],
          fontSize: typography.fontSize.sm,
        }}
      >
        <IconInfoCircle size={16} color={colors.primary[600]} aria-hidden />
        How we measure this
      </summary>
      <dl style={{ margin: 0 }}>
        <dt style={termStyle}>Definition</dt>
        <dd style={textStyle}>{metric.definition}</dd>
        <dt style={termStyle}>Data</dt>
        <dd style={textStyle}>{metric.data}</dd>
        <dt style={termStyle}>Limits</dt>
        <dd style={textStyle}>{metric.limits}</dd>
        <dt style={termStyle}>Read more</dt>
        <dd style={textStyle}>
          <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
            {metric.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: colors.text.link }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </details>
  );
}
