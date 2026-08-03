import { IconArrowRight } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry } from '@/libs/draftReform';
import { ParameterSearchEntry, selectParameterSearchEntries } from '@/libs/parameterSearch';
import { RootState } from '@/store';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/**
 * Build — the power-user entry point of the flagship shell.
 *
 * One step: search, click a result, and it lands in the draft rail
 * with its baseline — edit the value there. Current values show
 * directly in results, so there is no intermediate detail step.
 */
export default function BuildPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const entries = useSelector(selectParameterSearchEntries);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

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

        <button
          type="button"
          onClick={() => nav.push(`/${countryId}/policies/create`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.secondary,
            alignSelf: 'flex-start',
          }}
        >
          Prefer to browse the full policy tree? Open the parameter editor
          <IconArrowRight size={14} />
        </button>
      </Stack>
    </WorkspaceLayout>
  );
}
