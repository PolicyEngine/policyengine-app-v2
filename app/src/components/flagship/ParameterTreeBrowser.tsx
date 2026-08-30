import { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { Spinner, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterTreeNode } from '@/types/metadata';

interface ParameterTreeBrowserProps {
  tree: ParameterTreeNode | null;
  /** Called with the parameter path when an addable leaf is clicked. */
  onSelectLeaf: (path: string) => void;
  /** Paths that can be added to the draft; other leaves render muted. */
  addablePaths: Set<string>;
  /** Paths already in the draft — shown with an "In draft" tag. */
  draftPaths: Set<string>;
}

/**
 * The full policy tree as an inline expandable browser — the
 * complement to search on the Build page. Folders expand in place;
 * clicking an editable leaf adds it straight to the draft.
 */
export default function ParameterTreeBrowser({
  tree,
  onSelectLeaf,
  addablePaths,
  draftPaths,
}: ParameterTreeBrowserProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!tree) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <Spinner size="sm" />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Loading the policy tree…
        </Text>
      </div>
    );
  }

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const renderNodes = (nodes: ParameterTreeNode[]): React.ReactNode =>
    nodes
      .filter((node) => !node.name.includes('pycache'))
      .map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const isExpanded = expanded.has(node.name);
        const inDraft = draftPaths.has(node.name);
        const addable = addablePaths.has(node.name);
        const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;

        if (hasChildren) {
          return (
            <div key={node.name}>
              <button
                type="button"
                onClick={() => toggle(node.name)}
                aria-expanded={isExpanded}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: 6,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  boxSizing: 'border-box',
                }}
              >
                <ChevronIcon size={14} color={colors.text.secondary} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.label}
                </span>
              </button>
              {isExpanded && <div style={{ paddingLeft: 18 }}>{renderNodes(node.children!)}</div>}
            </div>
          );
        }

        return (
          <button
            key={node.name}
            type="button"
            data-path={node.name}
            disabled={!addable || inDraft}
            onClick={() => onSelectLeaf(node.name)}
            style={{
              all: 'unset',
              cursor: addable && !inDraft ? 'pointer' : 'default',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: 6,
              fontSize: typography.fontSize.sm,
              color: addable ? colors.text.primary : colors.gray[400],
              background: inDraft ? colors.primary[50] : 'transparent',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ width: 14, flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.label}
            </span>
            {inDraft ? (
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.primary[700],
                  fontWeight: typography.fontWeight.medium,
                  whiteSpace: 'nowrap',
                }}
              >
                In draft
              </span>
            ) : (
              addable && (
                <IconPlus size={13} color={colors.text.secondary} style={{ flexShrink: 0 }} />
              )
            )}
          </button>
        );
      });

  return (
    <div
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        padding: spacing.sm,
        maxHeight: '45vh',
        overflowY: 'auto',
      }}
    >
      {renderNodes(tree.children ?? [])}
    </div>
  );
}
