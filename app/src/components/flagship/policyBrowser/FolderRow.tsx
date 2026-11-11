import { IconChevronRight, IconFolder } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';

interface FolderRowProps {
  node: ParameterTreeNode;
  count: number;
  divided: boolean;
  onOpen: () => void;
}

/** A subfolder as a list row: it opens, so it carries a chevron and no action. */
export default function FolderRow({ node, count, divided, onOpen }: FolderRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${node.label}`}
      className="tw:group tw:cursor-pointer tw:transition-colors tw:hover:bg-gray-50"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        width: '100%',
        minHeight: 48,
        padding: `${spacing.sm} ${spacing.lg}`,
        border: 'none',
        borderTop: divided ? `1px solid ${colors.border.light}` : 'none',
        textAlign: 'left',
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <IconFolder size={18} aria-hidden style={{ flexShrink: 0, color: colors.primary[600] }} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        {node.label}
      </span>
      <span
        style={{
          flexShrink: 0,
          fontSize: typography.fontSize.xs,
          color: colors.text.tertiary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count.toLocaleString()}
      </span>
      <IconChevronRight
        size={16}
        aria-hidden
        className="tw:transition-transform tw:group-hover:translate-x-0.5"
        style={{ flexShrink: 0, color: colors.text.tertiary }}
      />
    </button>
  );
}
