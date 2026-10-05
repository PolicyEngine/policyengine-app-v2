import { useEffect, useMemo, useState } from 'react';
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconFolder,
  IconInfoCircle,
  IconSearch,
} from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useParameterSearch } from '@/hooks/useParameterSearch';
import {
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  groupSearchResults,
  listStateCodes,
  ParameterSearchEntry,
  ParameterSearchFilters,
  ParameterSearchIndex,
} from '@/libs/parameterSearch';
import ScopePicker from './ScopePicker';

interface ParameterSearchBoxProps {
  entries: ParameterSearchEntry[];
  onSelect: (entry: ParameterSearchEntry) => void;
  /** Prebuilt index (e.g. the store-memoized one); skips a rebuild per mount */
  index?: ParameterSearchIndex;
  placeholder?: string;
  /** Formatted current value for a result row, e.g. "$2,000" */
  currentValueFor?: (entry: ParameterSearchEntry) => string | null;
  /** Derived concept clusters for variant-aware matching */
  clusters?: string[][];
  /** State code → name, so the scope filter reads "California", not "CA only" */
  stateLabels?: Record<string, string>;
  /**
   * Label for any tree node by dotted path, from the metadata the
   * entries were built from. Powers the clickable breadcrumb when
   * browsing a folder; without it the breadcrumb is static text.
   */
  labelFor?: (path: string) => string | null | undefined;
  /**
   * Render results in the page flow rather than floating over it. Set
   * when something below needs to stay visible — a floating list would
   * sit on top of the very folder it just opened.
   */
  resultsInFlow?: boolean;
  /** Search large indexes without blocking input. */
  backgroundSearch?: boolean;
  /** Told whether anything is typed or a folder is open, so the page can make room. */
  onActiveChange?: (active: boolean) => void;
  /**
   * Opens a result's folder somewhere else — the page's own browser —
   * instead of in place. The query stays, so coming back to search
   * finds the same results.
   */
  onOpenFolder?: (path: string) => void;
  /**
   * Keep the query and results after a pick, so several parameters can
   * come from one search. Picked rows are marked with `inDraft`.
   */
  keepResultsOnSelect?: boolean;
  /** Marks rows already in the draft. */
  inDraft?: (path: string) => boolean;
  /** Keep results (and their empty state) out of view — the picker is not in use. */
  hideResults?: boolean;
  /** Extra controls at the end of the filter row, e.g. a Browse toggle. */
  filterActions?: React.ReactNode;
  autoFocus?: boolean;
}

/**
 * The folder a leaf sits in: gov.irs.credits.ctc.amount →
 * gov.irs.credits.ctc.
 *
 * Bracket indices are not nodes in the policy tree — it stops at
 * `...eitc.max` and renders the brackets inside it — so a trailing
 * `[n]` is dropped: `...max[0]` is not a folder anything can open.
 */
function parentPath(path: string): string | null {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0) {
    return null;
  }
  return path.slice(0, lastDot).replace(/\[\d+\]$/, '');
}

/**
 * The folder a search group opens. Groups form on breadcrumb labels, and
 * unlabeled tree nodes fold out of breadcrumbs, so one group can span
 * sibling paths — `…amount.base[0]` and `…amount.actc[0]` both read
 * "… → Amount → Bracket 1". The shared ancestor is the folder that holds
 * every matched row; null when there is none deep enough to browse.
 */
function groupFolderPath(entries: ParameterSearchEntry[]): string | null {
  let shared: string[] | null = null;
  for (const entry of entries) {
    const parent = parentPath(entry.path);
    if (!parent) {
      return null;
    }
    const segments = parent.split('.');
    if (!shared) {
      shared = segments;
      continue;
    }
    let depth = 0;
    while (depth < shared.length && depth < segments.length && shared[depth] === segments[depth]) {
      depth += 1;
    }
    shared = shared.slice(0, depth);
  }
  return shared && shared.length >= 2 ? shared.join('.') : null;
}

const CONTRIB_EXPLANATION =
  'Policy options contributed to the model — proposed reforms and ' +
  'experimental provisions that are not current law.';

const RESULT_LIMIT = 20;

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '1px 6px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
};

const controlShell: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `0 ${spacing.sm}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
  background: colors.background.primary,
  fontSize: typography.fontSize.xs,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.secondary,
  height: 30,
};

const sectionLabel: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.lg} ${spacing.xs}`,
  fontSize: typography.fontSize.xs,
  fontFamily: typography.fontFamily.primary,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.tertiary,
};

/**
 * A folder breadcrumb with its own name emphasized: the ancestors give
 * context and truncate first, the last segment is what opens.
 */
function FolderName({
  breadcrumb,
  highlighted = false,
}: {
  breadcrumb: string;
  highlighted?: boolean;
}) {
  const segments = breadcrumb.split(' → ');
  const name = segments[segments.length - 1];
  const ancestors = segments.slice(0, -1).join(' → ');
  return (
    <span style={{ display: 'flex', minWidth: 0, gap: 4 }}>
      {ancestors && (
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: typography.fontWeight.normal,
          }}
        >
          {ancestors} →
        </span>
      )}
      <span
        style={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          color: highlighted ? colors.primary[700] : colors.text.primary,
        }}
      >
        {name}
      </span>
    </span>
  );
}

function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

interface FolderSubfolder {
  path: string;
  count: number;
  /** One entry inside, to derive a display name when no label exists */
  sample: ParameterSearchEntry;
}

/**
 * One level of a folder: its own leaves plus a row per immediate
 * subfolder, instead of every descendant flattened with arrow-prefixed
 * labels. Bracket leaves (`max[0].amount`) count as the folder's own —
 * bracket indices are not nodes in the policy tree.
 */
function buildFolderView(entries: ParameterSearchEntry[], path: string) {
  const descendants: ParameterSearchEntry[] = [];
  const direct: ParameterSearchEntry[] = [];
  const subfolderMap = new Map<string, FolderSubfolder>();
  for (const entry of entries) {
    const inDot = entry.path.startsWith(`${path}.`);
    if (!inDot && !entry.path.startsWith(`${path}[`)) {
      continue;
    }
    descendants.push(entry);
    const rest = inDot ? entry.path.slice(path.length + 1) : '';
    const separator = rest.search(/[.[]/);
    if (!inDot || separator === -1) {
      direct.push(entry);
      continue;
    }
    const subPath = `${path}.${rest.slice(0, separator)}`;
    const subfolder = subfolderMap.get(subPath);
    if (subfolder) {
      subfolder.count += 1;
    } else {
      subfolderMap.set(subPath, { path: subPath, count: 1, sample: entry });
    }
  }
  direct.sort((a, b) => a.path.localeCompare(b.path));
  return {
    descendants,
    direct,
    subfolders: [...subfolderMap.values()].sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function EntryBadges({
  entry,
  inDraft = false,
}: {
  entry: ParameterSearchEntry;
  inDraft?: boolean;
}) {
  return (
    <span style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
      {inDraft && (
        <span
          style={{
            ...badgeStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            color: colors.text.inverse,
            background: colors.primary[500],
          }}
        >
          <IconCheck size={10} aria-hidden />
          in draft
        </span>
      )}
      {entry.stateCode && (
        <span
          style={{
            ...badgeStyle,
            color: colors.text.secondary,
            background: colors.gray[50],
            border: `1px solid ${colors.border.light}`,
          }}
        >
          {entry.stateCode.toUpperCase()}
        </span>
      )}
      {entry.isContrib && (
        <span style={{ ...badgeStyle, color: colors.primary[700], background: colors.primary[50] }}>
          contributed
        </span>
      )}
    </span>
  );
}

/**
 * Typeahead over the full parameter index. Results mirror the model's
 * hierarchy: parameters sharing a folder cluster under a folder header
 * with indented children, standalone parameters follow. Scope filters
 * tame the state/contributed namespaces that dominate the index.
 */
export default function ParameterSearchBox({
  entries,
  onSelect,
  placeholder = 'Search any parameter, e.g. child tax credit amount',
  currentValueFor,
  clusters = [],
  stateLabels = {},
  resultsInFlow = false,
  backgroundSearch = false,
  index: providedIndex,
  labelFor,
  onActiveChange,
  onOpenFolder,
  keepResultsOnSelect = false,
  inDraft,
  hideResults = false,
  filterActions,
  autoFocus = false,
}: ParameterSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  /**
   * A folder opened from the results: the dropdown shows everything the
   * folder holds, in place — search only surfaced the leaves that
   * matched, and the siblings that did not are usually what a near miss
   * needs. `folder` is the breadcrumb, kept to label rows relative to it.
   */
  const [browsing, setBrowsing] = useState<{ path: string; folder: string } | null>(null);
  const [filters, setFilters] = useState<ParameterSearchFilters>(DEFAULT_SEARCH_FILTERS);

  const index = useMemo(
    () => providedIndex ?? createParameterSearchIndex(entries, clusters),
    [providedIndex, entries, clusters]
  );
  // Named states sort by name; any code the metadata does not name falls
  // to the end of the list under its bare code.
  const stateOptions = useMemo(
    () =>
      listStateCodes(entries)
        .map((code) => ({ code, label: stateLabels[code] ?? code.toUpperCase() }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [entries, stateLabels]
  );
  const search = useParameterSearch(index, query, filters, RESULT_LIMIT, backgroundSearch);
  const groups = useMemo(() => groupSearchResults(search.entries), [search.entries]);
  const folderView = useMemo(
    () => (browsing ? buildFolderView(entries, browsing.path) : null),
    [entries, browsing]
  );

  /**
   * The folder's display name, as the longest breadcrumb prefix its
   * contents share. The clicked header's label can be deeper than the
   * folder itself — "… → Bracket 1" for a folder that also holds
   * Bracket 2 — because bracket indices fold into their parent.
   * Fallback for when no `labelFor` lookup produces crumbs.
   */
  const folderLabel = useMemo(() => {
    const contents = folderView?.descendants ?? [];
    if (contents.length === 0) {
      return browsing?.folder ?? '';
    }
    let prefix = contents[0].breadcrumb.split(' → ').slice(0, -1);
    for (const entry of contents.slice(1)) {
      const segments = entry.breadcrumb.split(' → ');
      let shared = 0;
      while (shared < prefix.length && prefix[shared] === segments[shared]) {
        shared += 1;
      }
      prefix = prefix.slice(0, shared);
    }
    return prefix.join(' → ');
  }, [folderView, browsing]);

  /**
   * The breadcrumb as clickable ancestors: every prefix of the folder
   * path that the metadata gives a label to. Unlabeled nodes simply get
   * no crumb, matching how entry breadcrumbs are built.
   */
  const crumbs = useMemo(() => {
    if (!browsing || !labelFor) {
      return [];
    }
    const segments = browsing.path.split('.');
    const found: { path: string; label: string }[] = [];
    for (let depth = 2; depth <= segments.length; depth += 1) {
      const ancestor = segments.slice(0, depth).join('.');
      const label = labelFor(ancestor);
      if (label) {
        found.push({ path: ancestor, label: capitalizeFirst(label) });
      }
    }
    return found;
  }, [browsing, labelFor]);

  // What entry breadcrumbs are sliced against; the crumb join equals
  // the shared breadcrumb prefix because both come from the same labels.
  const currentLabel = crumbs.length > 0 ? crumbs.map((c) => c.label).join(' → ') : folderLabel;

  const flatEntries = useMemo(
    () => (browsing ? (folderView?.direct ?? []) : groups.flatMap((group) => group.entries)),
    [browsing, folderView, groups]
  );

  const select = (entry: ParameterSearchEntry) => {
    if (!browsing && search.stale) {
      return;
    }
    onSelect(entry);
    if (keepResultsOnSelect) {
      return;
    }
    setQuery('');
    setBrowsing(null);
    setHighlighted(0);
  };

  // Pointing at a folder takes the row highlight away: a highlighted row
  // right under a hovered folder header reads as one block, as if both
  // were the target. The arrow keys bring the highlight back.
  const hoverFolder = (path: string) => {
    setHoveredFolder(path);
    setHighlighted(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Escape works even in a folder with no direct parameters, where
    // there is nothing to highlight but still somewhere to go back to.
    if (event.key === 'Escape') {
      // Step out of the folder first; a second Escape clears the search.
      if (browsing) {
        setBrowsing(null);
        setHighlighted(0);
      } else {
        setQuery('');
      }
      return;
    }
    if ((!browsing && search.stale) || !flatEntries.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, flatEntries.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // Nothing is highlighted while a folder is pointed at.
      if (highlighted < 0) {
        return;
      }
      // The list can shrink under a stale highlight (a filter change);
      // clamp rather than select past the end.
      select(flatEntries[Math.min(highlighted, flatEntries.length - 1)]);
    }
  };

  let runningIndex = -1;

  const active = query.trim().length > 0 || browsing !== null;
  const noMatches =
    !hideResults &&
    !browsing &&
    query.trim().length >= 2 &&
    !search.pending &&
    flatEntries.length === 0;
  // Where the search looked, so an empty or widened result says why.
  const scopePhrase =
    filters.stateScope === 'all'
      ? ''
      : filters.stateScope === 'federal'
        ? ' at the federal level'
        : ` in ${stateLabels[filters.stateScope] ?? filters.stateScope.toUpperCase()}`;
  // Nothing matched the filters, so the results come from a wider search:
  // say what was relaxed, and offer to make it the filter.
  const widened = (() => {
    const wider = search.widenedFilters;
    if (!wider || hideResults || browsing || flatEntries.length === 0) {
      return null;
    }
    const scopeChanged = wider.stateScope !== filters.stateScope;
    const contribChanged = wider.includeContrib && !filters.includeContrib;
    const missed = [
      scopeChanged ? scopePhrase.trim() : null,
      contribChanged ? 'among current-law parameters' : null,
    ]
      .filter(Boolean)
      .join(' or ');
    const shown = `${contribChanged ? 'contributed parameters' : 'matches'}${
      scopeChanged ? ' from all jurisdictions' : ''
    }`;
    return {
      filters: wider,
      message: `No matches ${missed}. Showing ${shown}.`,
      action:
        scopeChanged && contribChanged
          ? 'Use these filters'
          : scopeChanged
            ? 'Search all jurisdictions'
            : 'Include contributed',
    };
  })();
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        // Border and ring live in classes so focus can restyle them; an
        // inline border would pin its color.
        className="tw:border tw:border-border-light tw:shadow-sm tw:transition-shadow tw:focus-within:border-primary-500 tw:focus-within:ring-4 tw:focus-within:ring-primary-50"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.lg} ${spacing.xl}`,
          borderRadius: spacing.radius.feature,
          background: colors.background.primary,
        }}
      >
        <IconSearch size={20} color={colors.primary[500]} style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setBrowsing(null);
            setHighlighted(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search parameters"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={Boolean(browsing) || flatEntries.length > 0}
          aria-controls="parameter-search-results"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            background: 'transparent',
          }}
        />
      </div>

      {/* Filters sit under the bar: they refine a search, so they read
          after it rather than competing with it for first glance. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        {stateOptions.length > 0 && (
          <ScopePicker
            value={filters.stateScope}
            onChange={(stateScope) => {
              setFilters({ ...filters, stateScope });
              setHighlighted(0);
            }}
            states={stateOptions}
            triggerStyle={controlShell}
          />
        )}
        <div style={controlShell}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <input
              type="checkbox"
              checked={filters.includeContrib}
              onChange={(event) => {
                setFilters({ ...filters, includeContrib: event.target.checked });
                setHighlighted(0);
              }}
              aria-label="Include contributed parameters"
              style={{ accentColor: colors.primary[500], width: 13, height: 13, margin: 0 }}
            />
            Include contributed
          </label>
          {/* Outside the label: a control inside it would toggle the filter. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={CONTRIB_EXPLANATION}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'help',
                  color: colors.text.secondary,
                }}
              >
                <IconInfoCircle size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" style={{ maxWidth: 240 }}>
              {CONTRIB_EXPLANATION}
            </TooltipContent>
          </Tooltip>
        </div>
        {backgroundSearch && (
          <div
            role="status"
            style={{
              marginLeft: 'auto',
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            {!browsing &&
              query.trim().length >= 2 &&
              (search.pending ? (
                'Searching…'
              ) : flatEntries.length === 0 ? (
                // Announced here; the empty state below says it visibly.
                <span className="tw:sr-only">No matching parameters</span>
              ) : (
                ''
              ))}
          </div>
        )}
        {filterActions && (
          <div style={{ marginLeft: backgroundSearch ? undefined : 'auto' }}>{filterActions}</div>
        )}
      </div>

      {noMatches && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
            padding: `${spacing['2xl']} ${spacing.lg}`,
            border: `1px dashed ${colors.border.medium}`,
            borderRadius: spacing.radius.feature,
            textAlign: 'center',
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.secondary,
          }}
        >
          <span>
            No parameters match{' '}
            <strong style={{ color: colors.text.primary }}>“{query.trim()}”</strong>
            {scopePhrase}.
          </span>
          <span style={{ fontSize: typography.fontSize.xs }}>
            Nothing matches anywhere else either — check the spelling, or try fewer words.
          </span>
        </div>
      )}

      {widened && (
        <div
          role="note"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: `${spacing.xs} ${spacing.md}`,
            marginTop: spacing.md,
            padding: `${spacing.sm} ${spacing.md}`,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            background: colors.gray[50],
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.secondary,
          }}
        >
          <span>{widened.message}</span>
          <button
            type="button"
            onClick={() => {
              setFilters(widened.filters);
              setHighlighted(0);
            }}
            className="tw:cursor-pointer tw:underline-offset-2 tw:hover:underline"
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              fontWeight: typography.fontWeight.medium,
              color: colors.primary[600],
            }}
          >
            {widened.action}
          </button>
        </div>
      )}

      {!hideResults && (browsing || flatEntries.length > 0) && (
        <div
          id="parameter-search-results"
          role="listbox"
          aria-busy={!browsing && search.pending}
          inert={!browsing && search.stale ? true : undefined}
          style={{
            ...(resultsInFlow
              ? { position: 'relative' }
              : { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }),
            marginTop: spacing.md,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.feature,
            background: colors.background.primary,
            boxShadow: resultsInFlow ? 'none' : '0 8px 24px rgba(20, 32, 31, 0.12)',
            // In flow the page scrolls, so the list can take most of the
            // viewport; floating over other content it stays a dropdown.
            maxHeight: resultsInFlow ? '72vh' : 420,
            overflowY: 'auto',
          }}
        >
          {browsing && (
            <>
              <button
                type="button"
                onClick={() => {
                  setBrowsing(null);
                  setHighlighted(0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.lg}`,
                  border: 'none',
                  borderBottom: `1px solid ${colors.border.light}`,
                  background: colors.gray[50],
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.primary,
                  color: colors.text.secondary,
                  textAlign: 'left',
                }}
              >
                <IconArrowLeft size={13} style={{ flexShrink: 0 }} />
                Back to matches
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                  padding: `${spacing.sm} ${spacing.lg} 2px`,
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 0,
                    flexWrap: 'wrap',
                  }}
                >
                  <IconFolder size={14} style={{ flexShrink: 0, color: colors.primary[600] }} />
                  {crumbs.length > 0 ? (
                    crumbs.map((crumb, idx) => (
                      <span
                        key={crumb.path}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {idx > 0 && (
                          <IconChevronRight
                            size={11}
                            aria-hidden
                            style={{ color: colors.text.tertiary }}
                          />
                        )}
                        {idx < crumbs.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setBrowsing({ path: crumb.path, folder: crumb.label });
                              setHighlighted(0);
                            }}
                            onMouseEnter={() => hoverFolder(crumb.path)}
                            onMouseLeave={() => setHoveredFolder(null)}
                            onFocus={() => hoverFolder(crumb.path)}
                            onBlur={() => setHoveredFolder(null)}
                            title={`Open ${crumb.label}`}
                            style={{
                              padding: 0,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              font: 'inherit',
                              // Ancestors read as links: each one opens.
                              color:
                                hoveredFolder === crumb.path
                                  ? colors.primary[700]
                                  : colors.primary[600],
                              textDecoration: hoveredFolder === crumb.path ? 'underline' : 'none',
                              textUnderlineOffset: 2,
                            }}
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span style={{ color: colors.text.primary }}>{crumb.label}</span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {folderLabel}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: typography.fontWeight.normal, whiteSpace: 'nowrap' }}>
                  {folderView?.descendants.length ?? 0} parameter
                  {(folderView?.descendants.length ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
              {/* The full path once, instead of repeated under every row. */}
              <div
                style={{
                  padding: `0 ${spacing.lg} ${spacing.xs}`,
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {browsing.path}
              </div>
              {(folderView?.direct.length ?? 0) > 0 && <div style={sectionLabel}>Parameters</div>}
              {(folderView?.direct ?? []).map((entry, i) => (
                <button
                  key={entry.path}
                  type="button"
                  role="option"
                  aria-selected={i === highlighted}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => select(entry)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: `${spacing.xs} ${spacing.lg} ${spacing.xs} 40px`,
                    border: 'none',
                    cursor: 'pointer',
                    background: i === highlighted ? colors.primary[50] : 'transparent',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.primary,
                        color: colors.text.primary,
                        fontWeight: typography.fontWeight.medium,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* Relative to the folder: inside it, the shared
                          prefix is noise. */}
                      {capitalizeFirst(
                        currentLabel && entry.breadcrumb.startsWith(`${currentLabel} → `)
                          ? entry.breadcrumb.slice(currentLabel.length + 3)
                          : entry.label
                      )}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flexShrink: 0,
                        maxWidth: '45%',
                      }}
                    >
                      {currentValueFor?.(entry) && (
                        <span
                          title={currentValueFor(entry) ?? undefined}
                          style={{
                            fontSize: typography.fontSize.xs,
                            fontFamily: typography.fontFamily.primary,
                            color: colors.primary[700],
                            fontWeight: typography.fontWeight.medium,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {currentValueFor(entry)}
                        </span>
                      )}
                      <EntryBadges entry={entry} inDraft={inDraft?.(entry.path)} />
                    </span>
                  </div>
                </button>
              ))}
              {(folderView?.subfolders.length ?? 0) > 0 && <div style={sectionLabel}>Folders</div>}
              {(folderView?.subfolders ?? []).map((sub) => {
                const fromLookup = labelFor?.(sub.path);
                const name = fromLookup
                  ? capitalizeFirst(fromLookup)
                  : currentLabel && sub.sample.breadcrumb.startsWith(`${currentLabel} → `)
                    ? sub.sample.breadcrumb.slice(currentLabel.length + 3).split(' → ')[0]
                    : capitalizeFirst(
                        sub.path.slice(sub.path.lastIndexOf('.') + 1).replace(/_/g, ' ')
                      );
                const isHovered = hoveredFolder === sub.path;
                return (
                  <button
                    key={sub.path}
                    type="button"
                    onClick={() => {
                      setBrowsing({ path: sub.path, folder: name });
                      setHighlighted(0);
                    }}
                    onMouseEnter={() => hoverFolder(sub.path)}
                    onMouseLeave={() => setHoveredFolder(null)}
                    onFocus={() => hoverFolder(sub.path)}
                    onBlur={() => setHoveredFolder(null)}
                    aria-label={`Open ${name}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      width: '100%',
                      textAlign: 'left',
                      padding: `${spacing.xs} ${spacing.lg} ${spacing.xs} 40px`,
                      border: 'none',
                      cursor: 'pointer',
                      background: isHovered ? colors.primary[50] : 'transparent',
                      fontSize: typography.fontSize.sm,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.medium,
                      color: isHovered ? colors.primary[700] : colors.text.primary,
                    }}
                  >
                    <IconFolder size={14} style={{ flexShrink: 0, color: colors.primary[600] }} />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.normal,
                        color: colors.text.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sub.count} parameter{sub.count === 1 ? '' : 's'}
                    </span>
                    {/* The constant affordance: folders open, rows add. */}
                    <IconChevronRight
                      size={13}
                      style={{
                        flexShrink: 0,
                        color: colors.primary[600],
                        transform: isHovered ? 'translateX(2px)' : undefined,
                        transition: 'transform 120ms ease',
                      }}
                    />
                  </button>
                );
              })}
            </>
          )}
          {!browsing &&
            groups.map((group, groupIndex) => {
              const isFolder = group.entries.length > 1 && group.folder;
              return (
                <div key={group.folder || group.entries[0].path}>
                  {isFolder &&
                    (() => {
                      const folderPath = groupFolderPath(group.entries);
                      const headerStyle: React.CSSProperties = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.lg}`,
                        fontSize: typography.fontSize.xs,
                        fontFamily: typography.fontFamily.primary,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary,
                        textAlign: 'left',
                        background: colors.gray[50],
                        // The list's own border already tops the first band.
                        borderTop: groupIndex === 0 ? 'none' : `1px solid ${colors.border.light}`,
                      };
                      // Only a folder with a resolvable path can be
                      // browsed; otherwise the header stays a label.
                      if (!folderPath) {
                        return (
                          <div style={headerStyle}>
                            <IconFolder size={14} style={{ flexShrink: 0 }} />
                            <FolderName breadcrumb={group.folder} />
                          </div>
                        );
                      }
                      // Keyed by the group's breadcrumb, not the stripped
                      // folder path — bracket siblings share the path and
                      // would hover in lockstep.
                      const isHovered = hoveredFolder === group.folder;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setHighlighted(0);
                            if (onOpenFolder) {
                              onOpenFolder(folderPath);
                              return;
                            }
                            setBrowsing({ path: folderPath, folder: group.folder });
                          }}
                          onMouseEnter={() => hoverFolder(group.folder)}
                          onMouseLeave={() => setHoveredFolder(null)}
                          onFocus={() => hoverFolder(group.folder)}
                          onBlur={() => setHoveredFolder(null)}
                          aria-label={`Browse ${group.folder}`}
                          style={{
                            ...headerStyle,
                            border: 'none',
                            borderTop: headerStyle.borderTop,
                            cursor: 'pointer',
                            background: isHovered ? colors.primary[50] : colors.gray[50],
                          }}
                        >
                          <IconFolder
                            size={14}
                            style={{ flexShrink: 0, color: colors.primary[600] }}
                          />
                          <FolderName breadcrumb={group.folder} highlighted={isHovered} />
                          {/* Said in words, not just a chevron: a header
                              otherwise reads as a label, not a way in. */}
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              flexShrink: 0,
                              marginLeft: 'auto',
                              fontWeight: typography.fontWeight.medium,
                              color: isHovered ? colors.primary[700] : colors.primary[600],
                            }}
                          >
                            Open folder
                            <IconChevronRight
                              size={13}
                              style={{
                                transform: isHovered ? 'translateX(2px)' : undefined,
                                transition: 'transform 120ms ease',
                              }}
                            />
                          </span>
                        </button>
                      );
                    })()}
                  {group.entries.map((entry) => {
                    runningIndex += 1;
                    const i = runningIndex;
                    return (
                      <button
                        key={entry.path}
                        type="button"
                        role="option"
                        aria-selected={i === highlighted}
                        onMouseEnter={() => setHighlighted(i)}
                        onClick={() => select(entry)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: isFolder
                            ? `${spacing.xs} ${spacing.lg} ${spacing.xs} 40px`
                            : `${spacing.sm} ${spacing.lg}`,
                          border: 'none',
                          cursor: 'pointer',
                          background: i === highlighted ? colors.primary[50] : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{
                              fontSize: typography.fontSize.sm,
                              fontFamily: typography.fontFamily.primary,
                              color: colors.text.primary,
                              fontWeight: typography.fontWeight.medium,
                              // Without a zero min-width this column collapses to
                              // its longest word when a value runs long, stacking
                              // the label one word per line.
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {isFolder
                              ? capitalizeFirst(entry.label)
                              : entry.breadcrumb || entry.label}
                          </span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.sm,
                              flexShrink: 0,
                              // List-valued parameters (a dozen variable names)
                              // must not push the label out of its own row.
                              maxWidth: '45%',
                            }}
                          >
                            {currentValueFor?.(entry) && (
                              <span
                                title={currentValueFor(entry) ?? undefined}
                                style={{
                                  fontSize: typography.fontSize.xs,
                                  fontFamily: typography.fontFamily.primary,
                                  color: colors.primary[700],
                                  fontWeight: typography.fontWeight.medium,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {currentValueFor(entry)}
                              </span>
                            )}
                            <EntryBadges entry={entry} inDraft={inDraft?.(entry.path)} />
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: typography.fontSize.xs,
                            fontFamily: typography.fontFamily.mono,
                            color: colors.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.path}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
