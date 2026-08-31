import { useMemo, useState } from 'react';
import {
  IconArrowLeft,
  IconChevronRight,
  IconFolder,
  IconInfoCircle,
  IconSearch,
} from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  groupSearchResults,
  listStateCodes,
  ParameterSearchEntry,
  ParameterSearchFilters,
  ParameterSearchIndex,
  searchParameters,
} from '@/libs/parameterSearch';

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
}

/**
 * The folder a leaf sits in: gov.irs.credits.ctc.amount →
 * gov.irs.credits.ctc.
 *
 * Bracket indices are not nodes in the policy tree — it stops at
 * `...eitc.max` and renders the brackets inside it — so a trailing
 * `[n]` is dropped. Pointing at `...max[0]` names a folder the tree
 * cannot reveal, and the reveal silently does nothing.
 */
function parentPath(path: string): string | null {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0) {
    return null;
  }
  return path.slice(0, lastDot).replace(/\[\d+\]$/, '');
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
  padding: `4px ${spacing.sm}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: 8,
  background: colors.background.primary,
  fontSize: typography.fontSize.xs,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.secondary,
  height: 30,
};

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

function EntryBadges({ entry }: { entry: ParameterSearchEntry }) {
  return (
    <span style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
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
  index: providedIndex,
  labelFor,
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
  const groups = useMemo(
    () => groupSearchResults(searchParameters(index, query, RESULT_LIMIT, filters)),
    [index, query, filters]
  );
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
    onSelect(entry);
    setQuery('');
    setBrowsing(null);
    setHighlighted(0);
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
    if (!flatEntries.length) {
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
      select(flatEntries[highlighted]);
    }
  };

  let runningIndex = -1;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        {stateOptions.length > 0 && (
          <label style={controlShell}>
            Scope
            <select
              value={filters.stateScope}
              onChange={(event) => setFilters({ ...filters, stateScope: event.target.value })}
              aria-label="State scope"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
                cursor: 'pointer',
              }}
            >
              <option value="all">All jurisdictions</option>
              <option value="federal">Federal only</option>
              <optgroup label="States">
                {stateOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        )}
        <div style={controlShell}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={filters.includeContrib}
              onChange={(event) => setFilters({ ...filters, includeContrib: event.target.checked })}
              aria-label="Include contributed parameters"
              style={{ accentColor: colors.primary[500], width: 13, height: 13, margin: 0 }}
            />
            Contributed
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
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.md} ${spacing.lg}`,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 10,
          background: colors.background.primary,
        }}
      >
        <IconSearch size={18} color={colors.text.secondary} style={{ flexShrink: 0 }} />
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
          role="combobox"
          aria-expanded={Boolean(browsing) || flatEntries.length > 0}
          aria-controls="parameter-search-results"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.primary,
            background: 'transparent',
          }}
        />
      </div>

      {(browsing || flatEntries.length > 0) && (
        <div
          id="parameter-search-results"
          role="listbox"
          style={{
            ...(resultsInFlow
              ? { position: 'relative' }
              : { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }),
            marginTop: spacing.xs,
            border: `1px solid ${colors.border.light}`,
            borderRadius: 10,
            background: colors.background.primary,
            boxShadow: resultsInFlow ? 'none' : '0 8px 24px rgba(20, 32, 31, 0.12)',
            maxHeight: 420,
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
                  <IconFolder size={13} style={{ flexShrink: 0 }} />
                  {crumbs.length > 0 ? (
                    crumbs.map((crumb, idx) => (
                      <span
                        key={crumb.path}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {idx > 0 && <span aria-hidden>→</span>}
                        {idx < crumbs.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setBrowsing({ path: crumb.path, folder: crumb.label });
                              setHighlighted(0);
                            }}
                            onMouseEnter={() => setHoveredFolder(crumb.path)}
                            onMouseLeave={() => setHoveredFolder(null)}
                            onFocus={() => setHoveredFolder(crumb.path)}
                            onBlur={() => setHoveredFolder(null)}
                            title={`Open ${crumb.label}`}
                            style={{
                              padding: 0,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              font: 'inherit',
                              color:
                                hoveredFolder === crumb.path
                                  ? colors.primary[700]
                                  : colors.text.secondary,
                              textDecoration: hoveredFolder === crumb.path ? 'underline' : 'none',
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
                      <EntryBadges entry={entry} />
                    </span>
                  </div>
                </button>
              ))}
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
                    onMouseEnter={() => setHoveredFolder(sub.path)}
                    onMouseLeave={() => setHoveredFolder(null)}
                    onFocus={() => setHoveredFolder(sub.path)}
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
                    <IconFolder size={14} style={{ flexShrink: 0, color: colors.text.secondary }} />
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
                      size={12}
                      style={{
                        flexShrink: 0,
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
            groups.map((group) => {
              const isFolder = group.entries.length > 1 && group.folder;
              return (
                <div key={group.folder || group.entries[0].path}>
                  {isFolder &&
                    (() => {
                      const folderPath = parentPath(group.entries[0].path);
                      const headerStyle: React.CSSProperties = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.lg} ${spacing.xs}`,
                        fontSize: typography.fontSize.xs,
                        fontFamily: typography.fontFamily.primary,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary,
                        textAlign: 'left',
                      };
                      // Only a folder with a resolvable path can be
                      // browsed; otherwise the header stays the label it was.
                      if (!folderPath) {
                        return (
                          <div style={headerStyle}>
                            <IconFolder size={13} />
                            {group.folder}
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
                            setBrowsing({ path: folderPath, folder: group.folder });
                            setHighlighted(0);
                          }}
                          onMouseEnter={() => setHoveredFolder(group.folder)}
                          onMouseLeave={() => setHoveredFolder(null)}
                          onFocus={() => setHoveredFolder(group.folder)}
                          onBlur={() => setHoveredFolder(null)}
                          title="Show everything in this folder"
                          aria-label={`Browse ${group.folder}`}
                          style={{
                            ...headerStyle,
                            border: 'none',
                            cursor: 'pointer',
                            color: isHovered ? colors.primary[700] : colors.text.secondary,
                            background: isHovered ? colors.primary[50] : 'transparent',
                          }}
                        >
                          <IconFolder size={13} />
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {group.folder}
                          </span>
                          {/* The constant affordance: folders open, rows add. */}
                          <IconChevronRight
                            size={12}
                            style={{
                              flexShrink: 0,
                              transform: isHovered ? 'translateX(2px)' : undefined,
                              transition: 'transform 120ms ease',
                            }}
                          />
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
                            <EntryBadges entry={entry} />
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
