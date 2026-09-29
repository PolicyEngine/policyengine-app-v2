import type { ReactNode } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

export const panelStyle = {
  padding: spacing.xl,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.feature,
  background: colors.background.primary,
  gap: spacing.lg,
};
export const cardStyle = {
  gap: spacing.sm,
  padding: spacing.md,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
};
export const detailStyle = {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
  lineHeight: 1.6,
  overflowWrap: 'anywhere' as const,
};
export const linkStyle = {
  color: colors.primary[700],
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.xs,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
};
export const summaryStyle = {
  cursor: 'pointer',
  color: colors.primary[700],
  fontWeight: typography.fontWeight.medium,
  paddingBlock: spacing.sm,
};

export function EvidenceHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Read source',
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.md,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 280px' }}>
        <Text
          style={{
            fontWeight: typography.fontWeight.semibold,
            fontSize: typography.fontSize.base,
            margin: 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ ...detailStyle, margin: 0, fontSize: typography.fontSize.xs }}>
            {subtitle}
          </Text>
        )}
      </div>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" style={linkStyle}>
          {linkLabel}
          <IconExternalLink size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
export function EvidenceValues({
  left,
  right,
}: {
  left: { label: string; value: ReactNode; note?: ReactNode };
  right: { label: string; value: ReactNode; note?: ReactNode };
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
        gap: spacing.md,
        background: colors.background.secondary,
        padding: spacing.sm,
        borderRadius: spacing.radius.container,
      }}
    >
      {[left, right].map((item, index) => (
        <div key={index}>
          <Text style={{ ...detailStyle, margin: 0 }}>{item.label}</Text>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              margin: 0,
            }}
          >
            {item.value}
          </Text>
          <Text style={{ ...detailStyle, fontSize: typography.fontSize.xs, margin: 0 }}>
            {item.note}
          </Text>
        </div>
      ))}
    </div>
  );
}
