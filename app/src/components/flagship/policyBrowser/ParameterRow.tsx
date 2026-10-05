import { IconCheck, IconPlus } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';

interface ParameterRowProps {
  node: ParameterTreeNode;
  value: string | null;
  inDraft: boolean;
  divided: boolean;
  onAdd: () => void;
}

/**
 * A parameter as a list row: its name, its current-law value, and a
 * round add button that turns into a check once it is in the draft.
 * Either way a click opens it for editing. The description waits in the
 * tooltip, so the list reads as names.
 */
export default function ParameterRow({ node, value, inDraft, divided, onAdd }: ParameterRowProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={node.description ?? undefined}
      // In the draft already, the row reopens it rather than adding twice.
      aria-label={inDraft ? `Edit ${node.label}, in your draft` : `Add ${node.label} to your draft`}
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
        // No inline background: it would pin over the hover class.
        textAlign: 'left',
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
        }}
      >
        {node.label}
      </span>
      {value && (
        <span
          title={value}
          style={{
            maxWidth: '35%',
            flexShrink: 0,
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      )}
      <span
        aria-hidden
        // Idle colors live in classes so the row's hover can fill the
        // button; inline colors would pin them.
        className={
          inDraft
            ? undefined
            : 'tw:border tw:border-border-medium tw:text-gray-500 tw:transition-colors tw:group-hover:border-primary-500 tw:group-hover:bg-primary-500 tw:group-hover:text-white'
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 999,
          ...(inDraft && { background: colors.primary[500], color: colors.text.inverse }),
        }}
      >
        {inDraft ? <IconCheck size={14} /> : <IconPlus size={14} />}
      </span>
    </button>
  );
}
