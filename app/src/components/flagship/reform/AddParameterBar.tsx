import { useEffect, useRef, useState } from 'react';
import { IconListTree, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import PolicyBrowser from '@/components/flagship/policyBrowser/PolicyBrowser';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDraftReform } from '@/libs/draftReform';
import { getStateLabels } from '@/libs/metadataUtils';
import {
  ParameterSearchEntry,
  selectAddableParameterPaths,
  selectConceptClusters,
  selectParameterEntriesByPath,
  selectParameterSearchEntries,
  selectParameterSearchIndex,
} from '@/libs/parameterSearch';
import { RootState } from '@/store';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  us: 'Add a parameter — search by name, e.g. child tax credit',
  uk: 'Add a parameter — search by name, e.g. personal allowance',
};

interface AddParameterBarProps {
  onPick: (entry: ParameterSearchEntry) => void;
  autoFocus?: boolean;
}

/**
 * The one way to add to a reform: type to search, or open the policy
 * tree to browse. Results and the tree drop down over the page and get
 * out of the way the moment a parameter is picked — the reform below
 * stays the page.
 */
export default function AddParameterBar({ onPick, autoFocus = false }: AddParameterBarProps) {
  const countryId = useCurrentCountry();
  const entries = useSelector(selectParameterSearchEntries);
  const clusters = useSelector(selectConceptClusters);
  const stateLabels = useSelector(getStateLabels);
  // Store-memoized: survives navigation, so mounts don't rebuild it.
  const searchIndex = useSelector(selectParameterSearchIndex);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const parameterTree = useSelector((state: RootState) => state.metadata.parameterTree);
  const entriesByPath = useSelector(selectParameterEntriesByPath);
  const addablePaths = useSelector(selectAddableParameterPaths);
  const draft = useDraftReform();
  const draftPaths = new Set(
    draft?.countryId === countryId ? draft.provisions.map((p) => p.path) : []
  );

  const containerRef = useRef<HTMLDivElement>(null);
  // Results show while the bar is in use; a click elsewhere puts them away.
  const [active, setActive] = useState(autoFocus);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browsePath, setBrowsePath] = useState<string | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setActive(false);
        setBrowseOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBrowseOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const valueFor = (path: string) => {
    const value = getCurrentValue(parameters?.[path]?.values);
    return value === undefined ? null : formatValue(value, entriesByPath.get(path)?.unit ?? null);
  };

  const pick = (entry: ParameterSearchEntry) => {
    onPick(entry);
    setActive(false);
    setBrowseOpen(false);
  };

  if (entries.length === 0) {
    // The index takes a moment on the US tree — say so with something
    // moving, in the bar's own footprint so the page does not jump.
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          padding: `${spacing.lg} ${spacing.xl}`,
          border: `1px dashed ${colors.border.medium}`,
          borderRadius: spacing.radius.feature,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        <Spinner size="sm" />
        Loading the parameter index…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onFocus={() => setActive(true)}
      // Typing or clicking in a bar that kept focus brings results back too.
      onInputCapture={() => setActive(true)}
      onMouseDownCapture={() => setActive(true)}
      onBlur={(event) => {
        // Tabbing out puts the results away; clicks are handled above.
        const next = event.relatedTarget as Node | null;
        if (next && !containerRef.current?.contains(next)) {
          setActive(false);
        }
      }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <ParameterSearchBox
        entries={entries}
        clusters={clusters}
        stateLabels={stateLabels}
        index={searchIndex}
        onSelect={pick}
        labelFor={(path) => parameters?.[path]?.label ?? null}
        backgroundSearch
        autoFocus={autoFocus}
        placeholder={SEARCH_PLACEHOLDERS[countryId]}
        hideResults={!active || browseOpen}
        inDraft={(path) => draftPaths.has(path)}
        onOpenFolder={(path) => {
          setBrowsePath(path);
          setBrowseOpen(true);
        }}
        currentValueFor={(entry) => valueFor(entry.path)}
        filterActions={
          <button
            type="button"
            onClick={() => setBrowseOpen((open) => !open)}
            aria-expanded={browseOpen}
            className="tw:cursor-pointer tw:border tw:border-border-light tw:bg-white tw:hover:border-border-medium"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              height: 30,
              padding: `0 ${spacing.sm}`,
              borderRadius: spacing.radius.container,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.primary,
              color: browseOpen ? colors.primary[700] : colors.text.secondary,
            }}
          >
            <IconListTree size={14} aria-hidden />
            Browse the policy tree
          </button>
        }
      />

      {browseOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing.sm,
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.feature,
            background: colors.gray[50],
            boxShadow: `0 ${spacing.sm} ${spacing['2xl']} ${colors.shadow.medium}`,
          }}
        >
          <button
            type="button"
            onClick={() => setBrowseOpen(false)}
            aria-label="Close the policy tree"
            className="tw:cursor-pointer tw:text-gray-500 tw:hover:bg-gray-100"
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              display: 'inline-flex',
              padding: spacing.xs,
              border: 'none',
              borderRadius: spacing.radius.container,
              background: 'transparent',
            }}
          >
            <IconX size={16} />
          </button>
          <PolicyBrowser
            tree={parameterTree}
            addablePaths={addablePaths}
            draftPaths={draftPaths}
            path={browsePath}
            onNavigate={setBrowsePath}
            onAdd={(path) => {
              const entry = entriesByPath.get(path);
              if (entry) {
                pick(entry);
              }
            }}
            valueFor={valueFor}
          />
        </div>
      )}
    </div>
  );
}
