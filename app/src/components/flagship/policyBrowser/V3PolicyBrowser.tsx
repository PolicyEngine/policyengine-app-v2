import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchParameterChildren, type ParameterChild } from '@/api/publicApi/parameterChildren';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { selectV2CatalogVersion } from '@/reducers/metadataReducer';
import type { RootState } from '@/store';
import type { ParameterTreeNode } from '@/types/metadata';
import PolicyBrowser, { PolicyBrowserView } from './PolicyBrowser';

interface V3PolicyBrowserProps {
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

/** The node v3's parameter tree starts from: every program sits under it. */
const TREE_ROOT = 'gov';

/** Numeric-aware, as the whole-tree browser sorts: "Bracket 2" before "Bracket 10". */
const byLabel = (first: ParameterTreeNode, second: ParameterTreeNode) =>
  first.label.localeCompare(second.label, undefined, { numeric: true });

/**
 * The folders from the top level down to `path`, itself last: each part of
 * the path that ends before a `.` or a `[` (a schedule's bracket is its
 * child), below the tree's root.
 */
function trailPathsOf(path: string): string[] {
  const paths: string[] = [];
  for (let index = TREE_ROOT.length + 1; index < path.length; index += 1) {
    if (path[index] === '.' || path[index] === '[') {
      paths.push(path.slice(0, index));
    }
  }
  return [...paths, path];
}

function toNode(child: ParameterChild, index: number): ParameterTreeNode {
  const folder = child.type !== 'parameter';
  return {
    name: child.path,
    label: child.label,
    index,
    type: folder ? 'parameterNode' : 'parameter',
    parameter: child.path,
    description: child.parameter?.description ?? null,
    unit: child.parameter?.unit ?? null,
    // A folder's children are listed when it opens; the marker says it has some.
    ...(folder ? { children: [] } : {}),
  };
}

/** The whole tree the v1 metadata holds. */
function WholeTreePolicyBrowser(props: V3PolicyBrowserProps) {
  const tree = useSelector((state: RootState) => state.metadata.parameterTree);
  return <PolicyBrowser tree={tree} {...props} />;
}

/** One level's placeholder rows, held until the level is in, with no time limit. */
function LevelPlaceholder() {
  return (
    <SkeletonRegion label="Loading the policy tree">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonLine key={index} width={index % 2 === 0 ? '70%' : '50%'} height={20} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/**
 * The tree on the v2 routes, read one level at a time from
 * `/v2/parameters/children` (only what a reform can change): the top level
 * at first, then each folder as it opens. The trail's labels come from the
 * levels above the open folder, which opening it read already (or which
 * load for a folder opened from search). The folder's parameters load
 * their current law in one request, so their rows show it.
 */
function OnDemandPolicyBrowser({
  addablePaths,
  draftPaths,
  path,
  onNavigate,
  onAdd,
  valueFor,
}: V3PolicyBrowserProps) {
  const countryId = useCurrentCountry();
  const policyengineVersion = useSelector(selectV2CatalogVersion);
  const trailPaths = useMemo(
    () => (path?.startsWith(`${TREE_ROOT}.`) ? trailPathsOf(path) : []),
    [path]
  );
  // The top level, then the level each trail folder sits in; the last
  // trail folder's own level is the open folder's contents.
  const levelPaths = [TREE_ROOT, ...trailPaths];
  const levels = useQueries({
    queries: levelPaths.map((parentPath) => ({
      queryKey: ['v2-parameter-children', countryId, policyengineVersion, parentPath] as const,
      queryFn: () => fetchParameterChildren(countryId, policyengineVersion!, parentPath),
      enabled: policyengineVersion !== null,
      staleTime: Infinity,
    })),
  });

  const nodesOf = (level: (typeof levels)[number] | undefined) => (level?.data ?? []).map(toNode);
  const rootNodes = nodesOf(levels[0]);
  const trail: ParameterTreeNode[] = [];
  for (let index = 0; index < trailPaths.length; index += 1) {
    const node = nodesOf(levels[index]).find((candidate) => candidate.name === trailPaths[index]);
    if (!node) {
      break;
    }
    trail.push(node);
  }
  // A path the tree does not hold (stale, or a search folder the tree
  // groups differently) falls back to the top level rather than a blank.
  const folderFound = trailPaths.length > 0 && trail.length === trailPaths.length;
  const contents = folderFound ? nodesOf(levels[levels.length - 1]) : [];
  const counts = new Map<string, number>(
    levels.flatMap((level) =>
      (level.data ?? []).map((child) => [child.path, child.child_count ?? 0])
    )
  );
  const folders = contents.filter(
    (node) => node.type === 'parameterNode' && (counts.get(node.name) ?? 0) > 0
  );
  const parameters = contents.filter(
    (node) => node.type === 'parameter' && addablePaths.has(node.name)
  );
  // The listed parameters' current law loads once they show.
  const parameterValues = useEnsureV3Parameters(parameters.map((node) => node.name));

  const failed = levels.find((level) => level.isError);
  // A folder whose trail is still loading waits for it: only once every
  // level is in does a path the tree does not hold fall back to the top.
  const loading = policyengineVersion === null || levels.some((level) => level.isPending);

  return (
    <PolicyBrowserView
      placeholder={
        failed ? (
          <ErrorState
            compact
            title="Could not load the policy tree"
            onRetry={() =>
              Promise.all(levels.filter((level) => level.isError).map((level) => level.refetch()))
            }
          />
        ) : loading ? (
          <LevelPlaceholder />
        ) : null
      }
      roots={rootNodes
        .filter((node) => node.type === 'parameterNode' && (counts.get(node.name) ?? 0) > 0)
        .sort(byLabel)}
      trail={folderFound ? trail : []}
      folders={folders.sort(byLabel)}
      parameters={parameters.sort(byLabel)}
      count={(node) => counts.get(node) ?? 0}
      draftPaths={draftPaths}
      onNavigate={onNavigate}
      onAdd={onAdd}
      valueFor={valueFor}
      valuesLoading={parameterValues.waiting}
      valuesNotice={
        parameterValues.status === 'error' ? (
          <ErrorState
            compact
            title="Could not load current law for these parameters"
            onRetry={parameterValues.retry}
          />
        ) : parameterValues.waiting ? (
          <span role="status" aria-label="Loading current law" className="tw:sr-only">
            Loading current law
          </span>
        ) : null
      }
    />
  );
}

/**
 * The policy browser for the routes v3 uses (V3_API_ROUTES, a constant):
 * the whole metadata tree on v1, the tree one level at a time on v2.
 */
const V3PolicyBrowser: (props: V3PolicyBrowserProps) => React.ReactNode =
  V3_API_ROUTES === 'v2' ? OnDemandPolicyBrowser : WholeTreePolicyBrowser;

export default V3PolicyBrowser;
