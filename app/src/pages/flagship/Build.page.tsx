import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import ParameterTreeBrowser from '@/components/flagship/ParameterTreeBrowser';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
import {
  ParameterSearchEntry,
  selectConceptClusters,
  selectParameterSearchEntries,
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
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const parameterTree = useSelector((state: RootState) => state.metadata.parameterTree);
  const draft = useDraftReform();

  const entriesByPath = useMemo(
    () => new Map(entries.map((entry) => [entry.path, entry])),
    [entries]
  );
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
        <Stack style={{ gap: spacing.xs }}>
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
            onSelect={addEntry}
            currentValueFor={(entry) => {
              const value = getCurrentValue(parameters?.[entry.path]?.values);
              return value === undefined ? null : formatValue(value, entry.unit);
            }}
          />
        ) : (
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Loading the parameter index…
          </Text>
        )}

        <Stack style={{ gap: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Or browse the policy tree
          </Text>
          <ParameterTreeBrowser
            tree={parameterTree}
            addablePaths={new Set(entriesByPath.keys())}
            draftPaths={draftPaths}
            onSelectLeaf={(path) => {
              const entry = entriesByPath.get(path);
              if (entry) {
                addEntry(entry);
              }
            }}
          />
        </Stack>
      </Stack>
    </WorkspaceLayout>
  );
}
