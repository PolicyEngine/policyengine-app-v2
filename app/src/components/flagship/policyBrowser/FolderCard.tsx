import { IconChevronRight } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';
import { folderIcon } from './folderIcons';

interface FolderCardProps {
  node: ParameterTreeNode;
  count: number;
  onOpen: () => void;
}

/** A top-level program as a card: it names where it goes and how much is inside. */
export default function FolderCard({ node, count, onOpen }: FolderCardProps) {
  const Icon = folderIcon(node.name);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${node.label}`}
      className="tw:group tw:cursor-pointer tw:border tw:border-border-light tw:bg-white tw:transition-colors tw:hover:border-primary-500 tw:hover:shadow-sm tw:focus-visible:outline-2 tw:focus-visible:outline-primary-500"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        width: '100%',
        minWidth: 0,
        padding: spacing.xl,
        borderRadius: spacing.radius.feature,
        textAlign: 'left',
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: spacing.radius.container,
          background: colors.primary[50],
          color: colors.primary[600],
        }}
      >
        <Icon size={22} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            lineHeight: typography.lineHeight.tight,
            // Agency names run long ("Department of Health and Human
            // Services"); three lines keep them whole in a narrow card.
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={node.label}
        >
          {node.label}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {count.toLocaleString()} parameter{count === 1 ? '' : 's'}
        </span>
      </span>
      <IconChevronRight
        size={16}
        aria-hidden
        className="tw:transition-transform tw:group-hover:translate-x-0.5"
        style={{ flexShrink: 0, color: colors.primary[600] }}
      />
    </button>
  );
}
