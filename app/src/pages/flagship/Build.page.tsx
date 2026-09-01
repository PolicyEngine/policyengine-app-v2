import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import ParameterTreeBrowser from '@/components/flagship/ParameterTreeBrowser';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
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

/**
 * Build — the power-user entry point of the flagship shell.
 *
 * Search and the full policy tree sit side by side: search for speed,
 * browse for discovery. Either way one click adds the parameter to
 * the draft with its baseline — edit the value there.
 */
export default function BuildPage() {
  const countryId = useCurrentCountry();
  const entries = useSelector(selectParameterSearchEntries);
  const clusters = useSelector(selectConceptClusters);
  const stateLabels = useSelector(getStateLabels);
  // Store-memoized: survives navigation, so Build mounts don't rebuild it.
  const searchIndex = useSelector(selectParameterSearchIndex);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const parameterTree = useSelector((state: RootState) => state.metadata.parameterTree);
  const draft = useDraftReform();
  // Search is the surface; the tree is the fallback for when you do not
  // know what the thing is called, so it stays out of the way until asked for.
  const [showTree, setShowTree] = useState(false);

  // Store-memoized like the index: built once per metadata load, not
  // per navigation or render.
  const entriesByPath = useSelector(selectParameterEntriesByPath);
  const addablePaths = useSelector(selectAddableParameterPaths);
  const draftPaths = new Set(draft?.provisions.map((p) => p.path) ?? []);

  const addEntry = (entry: ParameterSearchEntry) => {
    addDraftProvision(
      countryId,
      provisionFromSearchEntry(entry, parameters?.[entry.path]?.values),
      'manual'
    );
  };

  return (
    <WorkspaceLayout>
      <Stack style={{ gap: spacing.lg }}>
        <Stack
          style={{
            gap: spacing.lg,
            // Closed, the search box sits in the middle of the workspace
            // instead of riding above a wall of agency names.
            minHeight: showTree ? undefined : '70vh',
            justifyContent: showTree ? undefined : 'center',
          }}
        >
          <Stack style={{ gap: spacing.xs, textAlign: 'center' }}>
            <Title order={1}>Build a reform</Title>
            <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              Search {entries.length > 0 ? entries.length.toLocaleString() : 'every'} parameter
              {entries.length > 0 ? 's' : ''} — click one to add it to your draft.
            </Text>
          </Stack>

          {entries.length > 0 ? (
            <ParameterSearchBox
              entries={entries}
              clusters={clusters}
              stateLabels={stateLabels}
              index={searchIndex}
              onSelect={addEntry}
              labelFor={(path) => parameters?.[path]?.label ?? null}
              // Always in flow on this page: a floating list would
              // cover the tree when it is open.
              resultsInFlow
              currentValueFor={(entry) => {
                const value = getCurrentValue(parameters?.[entry.path]?.values);
                return value === undefined ? null : formatValue(value, entry.unit);
              }}
            />
          ) : (
            // The index takes a moment on the US tree — say so with
            // something moving, so the wait reads as work rather than
            // an empty page.
            <Stack
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              }}
            >
              <Spinner size="sm" />
              <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                Loading the parameter index…
              </Text>
            </Stack>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="ghost"
              onClick={() => setShowTree((open) => !open)}
              aria-expanded={showTree}
              aria-controls="policy-tree"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.fontSize.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.secondary,
              }}
            >
              <IconChevronDown
                size={14}
                style={{
                  transform: showTree ? 'rotate(180deg)' : undefined,
                  transition: 'transform 160ms ease',
                }}
              />
              {showTree ? 'Hide the policy tree' : 'Or browse the policy tree'}
            </Button>
          </div>
        </Stack>

        {showTree && (
          <div id="policy-tree">
            <ParameterTreeBrowser
              tree={parameterTree}
              addablePaths={addablePaths}
              draftPaths={draftPaths}
              onSelectLeaf={(path) => {
                const entry = entriesByPath.get(path);
                if (entry) {
                  addEntry(entry);
                }
              }}
            />
          </div>
        )}
      </Stack>
    </WorkspaceLayout>
  );
}
