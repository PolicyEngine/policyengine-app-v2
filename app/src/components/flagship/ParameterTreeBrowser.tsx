import { useEffect, useRef, useState } from 'react';
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
  /**
   * Folder path to reveal — its ancestors expand, it opens, and it
   * scrolls into view. Set when a search result's folder is opened, so
   * a near miss leads to the parameters around it.
   */
  expandTo?: string | null;
  /** Bump to repeat a reveal of the same path (state equality would swallow it). */
  expandSeq?: number;
}

/** Every ancestor path of a dotted parameter path, plus the path itself. */
function pathWithAncestors(path: string): string[] {
  const segments = path.split('.');
  return segments.map((_, index) => segments.slice(0, index + 1).join('.'));
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
  expandTo = null,
  expandSeq = 0,
}: ParameterTreeBrowserProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    if (!expandTo) {
      return;
    }
    pendingScroll.current = expandTo;
    // A new Set even when the contents are unchanged, so the scroll
    // effect below re-fires for a repeat reveal of the same path.
    setExpanded((prev) => new Set([...prev, ...pathWithAncestors(expandTo)]));
  }, [expandTo, expandSeq]);

  // The row only exists once the expansion has rendered, so the scroll
  // waits for a render in which it is actually there — an animation
  // frame scheduled alongside the state update fires too early and
  // finds nothing.
  useEffect(() => {
    const target = pendingScroll.current;
    if (!target) {
      return;
    }
    // One attempt, then clear regardless: by this render the expansion
    // has committed, so the row either exists now or never will — a
    // armed leftover would rescan the tree on every later toggle and
    // could yank the viewport to a stale target minutes on.
    pendingScroll.current = null;
    containerRef.current
      ?.querySelector(`[data-path="${CSS.escape(target)}"]`)
      ?.scrollIntoView({ block: 'center' });
  }, [expanded]);

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
                data-path={node.name}
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
                  background: node.name === expandTo ? colors.primary[50] : 'transparent',
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
      ref={containerRef}
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
