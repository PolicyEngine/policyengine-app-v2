import type { CSSProperties, ReactNode } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { Badge, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * The validation tab's building blocks: one card frame for every check,
 * the same as the overview's sections, and one table style so numbers
 * line up in tabular figures across every comparison.
 */

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

/** A link-styled button that opens a row's detail dialog. */
export const rowButtonStyle: CSSProperties = {
  ...linkStyle,
  display: 'inline',
  background: 'none',
  border: 0,
  padding: 0,
  font: 'inherit',
  fontWeight: typography.fontWeight.medium,
  textAlign: 'left',
  overflowWrap: 'anywhere',
  cursor: 'pointer',
};

/** One validation check, framed like the overview's section cards. */
export function ValidationCard({
  id,
  title,
  href,
  linkLabel,
  children,
}: {
  /** The heading's id, which names the card for assistive technology. */
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        minWidth: 0,
        padding: spacing['2xl'],
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <h3
          id={id}
          style={{
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {title}
        </h3>
        {href && linkLabel && (
          <a href={href} target="_blank" rel="noreferrer" style={linkStyle}>
            {linkLabel}
            <IconExternalLink size={16} aria-hidden="true" />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

/** A heading for a group of rows inside a card. */
export function ValidationSubheading({ children }: { children: ReactNode }) {
  return (
    <h4
      style={{
        margin: 0,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
      }}
    >
      {children}
    </h4>
  );
}

/** A plain line of text in a card: an empty state, a caveat, a provenance note. */
export function ValidationNote({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: 0,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.relaxed,
        color: colors.text.secondary,
      }}
    >
      {children}
    </Text>
  );
}

/** A check that does not apply to this report, marked as such, with the reason. */
export function NotComparable({ children }: { children: ReactNode }) {
  return (
    <Stack style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
      <Badge variant="outline" style={{ color: colors.text.secondary }}>
        Not comparable
      </Badge>
      <ValidationNote>{children}</ValidationNote>
    </Stack>
  );
}

/** A card's check is still loading; the line, not the spinner, is what gets announced. */
export function ValidationLoading({ children }: { children: ReactNode }) {
  return (
    <Stack role="status" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Spinner size="sm" role="presentation" aria-hidden="true" />
      <ValidationNote>{children}</ValidationNote>
    </Stack>
  );
}

const headerCellStyle: CSSProperties = {
  padding: `0 0 ${spacing.sm} ${spacing.lg}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

export const rowStyle: CSSProperties = { borderTop: `1px solid ${colors.border.light}` };

/** The first cell of a row: what is compared. */
export const labelCellStyle: CSSProperties = {
  padding: `${spacing.md} ${spacing.lg} ${spacing.md} 0`,
  textAlign: 'left',
  verticalAlign: 'top',
  fontWeight: typography.fontWeight.normal,
  minWidth: 160,
};

/** A number, right-aligned in tabular figures so columns line up. */
export const numberCellStyle: CSSProperties = {
  padding: `${spacing.md} 0 ${spacing.md} ${spacing.lg}`,
  textAlign: 'right',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
};

/** A secondary line under a cell's main text, e.g. a source or a period. */
export function CellNote({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        marginTop: 2,
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </span>
  );
}

/**
 * A comparison table: a label column, then right-aligned number columns.
 * Children are rows; with `grouped`, they are one `<tbody>` per group.
 */
export function EvidenceTable({
  label,
  columns,
  grouped = false,
  children,
}: {
  label: string;
  columns: string[];
  grouped?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-label={label}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
        }}
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                scope="col"
                style={
                  index === 0
                    ? { ...headerCellStyle, textAlign: 'left', padding: `0 0 ${spacing.sm}` }
                    : headerCellStyle
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        {grouped ? children : <tbody>{children}</tbody>}
      </table>
    </div>
  );
}

/**
 * How far PolicyEngine's number sits from another, as a share of the
 * other: (model − other) ÷ |other|. A dash when either is missing.
 */
export function gapText(model: number | null | undefined, other: number | null | undefined) {
  if (typeof model !== 'number' || typeof other !== 'number' || other === 0) {
    return '—';
  }
  return percentText((model - other) / Math.abs(other));
}

/** A fraction as a percent: one decimal, whole numbers from 100%. */
export function percentText(fraction: number): string {
  const value = fraction * 100;
  return `${Math.abs(value) >= 100 ? Math.round(value) : value.toFixed(1)}%`;
}

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
              fontVariantNumeric: 'tabular-nums',
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
