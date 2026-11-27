import type { ComponentProps } from 'react';
import { ShadcnTable, TableCell, TableHead, TableHeader } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * The admin page's tables, styled like the app's other tables (see
 * `IngredientReadView`): a rounded container with a light border, a gray
 * header row of small uppercase labels, and cells with the same padding.
 */
export function AdminTable(props: ComponentProps<typeof ShadcnTable>) {
  return (
    <div
      style={{
        width: '100%',
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
      }}
    >
      <ShadcnTable {...props} />
    </div>
  );
}

export function AdminTableHeader({ style, ...props }: ComponentProps<typeof TableHeader>) {
  return <TableHeader style={{ backgroundColor: colors.gray[50], ...style }} {...props} />;
}

export function AdminTableHead({ style, ...props }: ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      style={{
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
        ...style,
      }}
      {...props}
    />
  );
}

export function AdminTableCell({ style, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell style={{ padding: `${spacing.md} ${spacing.lg}`, ...style }} {...props} />;
}
