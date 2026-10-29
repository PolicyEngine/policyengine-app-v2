import { useEffect, useMemo, useRef } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { buildPolicyTreeIndex, folderContents, folderTrail } from '@/libs/flagship/policyTreeIndex';
import { ParameterTreeNode } from '@/types/metadata';
import FolderCard from './FolderCard';
import FolderRow from './FolderRow';
import ParameterRow from './ParameterRow';

interface PolicyBrowserProps {
  tree: ParameterTreeNode | null;
  /** Parameters the draft can take; everything else is left out. */
  addablePaths: Set<string>;
  draftPaths: Set<string>;
  /** The open folder, or null for the top level. Owned by the page. */
  path: string | null;
  onNavigate: (path: string | null) => void;
  onAdd: (path: string) => void;
  /** Formatted current-law value for a parameter row. */
  valueFor: (path: string) => string | null;
}

/** What the policy browser shows, however the tree was read. */
export interface PolicyBrowserViewProps {
  /** Shown in place of the tree until the level is in (null once it is). */
  placeholder: React.ReactNode | null;
  /** The top level's folders. */
  roots: ParameterTreeNode[];
  /** The open folder's trail from the top level, itself last; empty at the top level. */
  trail: ParameterTreeNode[];
  folders: ParameterTreeNode[];
  parameters: ParameterTreeNode[];
  /** How many parameters a reform can change at or below a folder. */
  count: (path: string) => number;
  draftPaths: Set<string>;
  onNavigate: (path: string | null) => void;
  onAdd: (path: string) => void;
  valueFor: (path: string) => string | null;
  /** The open folder's current-law values are still loading. */
  valuesLoading?: boolean;
  /** Above the open folder's list: what is loading, or what failed. */
  valuesNotice?: React.ReactNode;
}

/**
 * The policy tree as a first-class way in, beside search. The top level
 * is a grid of programs; inside one, a folder is a breadcrumb, its name,
 * and a single list — subfolders that open, then parameters that add.
 * One way to move (the breadcrumb), one list to read.
 */
export function PolicyBrowserView({
  placeholder,
  roots,
  trail,
  folders,
  parameters,
  count,
  draftPaths,
  onNavigate,
  onAdd,
  valueFor,
  valuesLoading = false,
  valuesNotice = null,
}: PolicyBrowserViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const current = trail[trail.length - 1];
  const ancestors = trail.slice(0, -1);

  // Deep in a long folder, opening the next one should show its top.
  useEffect(() => {
    const content = contentRef.current;
    if (content && content.getBoundingClientRect().top < 0) {
      content.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [current?.name]);

  return (
    <section aria-labelledby="policy-browser-heading">
      {/* The page's Search | Browse switch already names this view;
          the heading stays for assistive tech and the landmark's name. */}
      <h2 id="policy-browser-heading" className="tw:sr-only">
        Browse the policy tree
      </h2>

      {placeholder ? (
        placeholder
      ) : !current ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
            gap: spacing.md,
          }}
        >
          {roots.map((node) => (
            <FolderCard
              key={node.name}
              node={node}
              count={count(node.name)}
              onOpen={() => onNavigate(node.name)}
            />
          ))}
        </div>
      ) : (
        <div ref={contentRef} style={{ scrollMarginTop: spacing.lg }}>
          <nav aria-label="Policy tree location" style={{ marginBottom: spacing.xs }}>
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 4,
                margin: 0,
                padding: 0,
                listStyle: 'none',
                fontSize: typography.fontSize.sm,
              }}
            >
              <Crumb label="All programs" onOpen={() => onNavigate(null)} />
              {ancestors.map((node) => (
                <Crumb key={node.name} label={node.label} onOpen={() => onNavigate(node.name)} />
              ))}
            </ol>
          </nav>

          <h3
            style={{
              margin: `0 0 ${spacing.lg}`,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              letterSpacing: '-0.01em',
              color: colors.text.primary,
            }}
          >
            {current.label}
          </h3>

          {valuesNotice && <div style={{ marginBottom: spacing.md }}>{valuesNotice}</div>}

          <div
            style={{
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.feature,
              background: colors.background.primary,
              overflow: 'hidden',
            }}
          >
            {folders.map((node, i) => (
              <FolderRow
                key={node.name}
                node={node}
                count={count(node.name)}
                divided={i > 0}
                onOpen={() => onNavigate(node.name)}
              />
            ))}
            {parameters.map((node, i) => (
              <ParameterRow
                key={node.name}
                node={node}
                value={valueFor(node.name)}
                valueLoading={valuesLoading}
                inDraft={draftPaths.has(node.name)}
                divided={folders.length > 0 || i > 0}
                onAdd={() => onAdd(node.name)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** The policy browser over the whole metadata tree (the v1 routes). */
export default function PolicyBrowser({
  tree,
  addablePaths,
  draftPaths,
  path,
  onNavigate,
  onAdd,
  valueFor,
}: PolicyBrowserProps) {
  const index = useMemo(
    () => (tree ? buildPolicyTreeIndex(tree, addablePaths) : null),
    [tree, addablePaths]
  );
  // A path the tree does not hold (stale, or a search folder the tree
  // groups differently) falls back to the top level rather than a blank.
  const folder = path && index?.nodes.get(path) ? path : null;
  const trail = useMemo(() => (index && folder ? folderTrail(index, folder) : []), [index, folder]);
  const contents = useMemo(
    () => (index && folder ? folderContents(index, folder) : null),
    [index, folder]
  );

  return (
    <PolicyBrowserView
      placeholder={
        index ? null : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              padding: spacing['3xl'],
              border: `1px dashed ${colors.border.medium}`,
              borderRadius: spacing.radius.feature,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            <Spinner size="sm" />
            Loading the policy tree…
          </div>
        )
      }
      roots={index?.roots ?? []}
      trail={trail}
      folders={contents?.folders ?? []}
      parameters={contents?.parameters ?? []}
      count={(node) => index?.counts.get(node) ?? 0}
      draftPaths={draftPaths}
      onNavigate={onNavigate}
      onAdd={onAdd}
      valueFor={valueFor}
    />
  );
}

function Crumb({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <button
        type="button"
        onClick={onOpen}
        className="tw:cursor-pointer tw:text-gray-500 tw:underline-offset-2 tw:hover:text-primary-700 tw:hover:underline tw:max-sm:min-h-10"
        style={{
          padding: 0,
          border: 'none',
          background: 'transparent',
          font: 'inherit',
        }}
      >
        {label}
      </button>
      <IconChevronRight size={13} aria-hidden style={{ color: colors.text.tertiary }} />
    </li>
  );
}
