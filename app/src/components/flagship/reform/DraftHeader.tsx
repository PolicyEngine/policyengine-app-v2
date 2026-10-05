import { IconChartBar } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import { Button } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  clearDraftReform,
  DraftReform,
  draftToReform,
  draftYear,
  provisionsForYear,
  setDraftLabel,
  setDraftYear,
} from '@/libs/draftReform';
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * How the draft came about, for the report's own record. This is
 * provenance the report carries, not a label the page needs to wear.
 */
const SOURCE_NOTES: Record<string, string> = {
  manual: 'Hand-built',
  chat: 'Drafted from your question',
  bill: 'Drafted from a bill',
  tool: 'Drafted from a tool',
};

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: `0 ${spacing.sm}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
  background: colors.background.primary,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.primary,
};

/**
 * The reform's title bar: its name, the run's year and population, and
 * the verbs — save it, throw it away, or run the report. One row, so
 * the reform below has the page.
 */
export default function DraftHeader({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const taxYears = useSelector(getTaxYears);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawAt = (path: string, at: number) => {
    const values = parameters?.[path]?.values;
    return values ? new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) : undefined;
  };
  const year = draftYear(draft);
  const yearOptions = taxYears.length > 0 ? taxYears.map((t) => Number(t.value)) : [year];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const store = getReformStore();
      const payload = draftToReform(draft, MOCK_USER_ID);
      if (draft.editingReformId) {
        return store.update(draft.editingReformId, {
          label: payload.label,
          parameters: payload.parameters,
          provenance: payload.provenance,
        });
      }
      return store.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reforms'] });
      clearDraftReform();
      nav.push(`/${draft.countryId}/reforms?filter=yours`);
    },
  });

  const empty = draft.provisions.length === 0;

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.md,
        }}
      >
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <input
            value={draft.label}
            onChange={(event) => setDraftLabel(event.target.value)}
            placeholder="Untitled reform"
            aria-label="Reform name"
            className="tw:w-full tw:rounded-md tw:border tw:border-transparent tw:bg-transparent tw:hover:border-border-light tw:focus:border-primary-500 tw:focus:bg-white tw:focus:outline-none"
            style={{
              marginLeft: `-${spacing.sm}`,
              padding: `2px ${spacing.sm}`,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: colors.text.primary,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
          <select
            aria-label="Year"
            value={year}
            onChange={(event) => setDraftYear(Number(event.target.value))}
            style={selectStyle}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select aria-label="Population" value="national" style={selectStyle} onChange={() => {}}>
            <option value="national">Nationwide</option>
            {/* Household analysis arrives with the run bridge. */}
            <option value="household" disabled>
              A household (soon)
            </option>
          </select>
          <Button variant="ghost" onClick={() => clearDraftReform()}>
            Discard
          </Button>
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate()}
            disabled={empty || saveMutation.isPending}
          >
            {draft.editingReformId ? 'Save changes' : 'Save'}
          </Button>
          <Button
            onClick={() =>
              runReport.run(
                draft.label || 'Draft reform',
                SOURCE_NOTES[draft.source] ?? 'Draft reform',
                // Described as they stand in the year the report simulates.
                provisionsForYear(draft.provisions, year, currentLawAt),
                undefined,
                year
              )
            }
            disabled={empty || runReport.isRunning}
          >
            <IconChartBar size={16} />
            {runReport.isRunning ? 'Starting report…' : `Run ${year} report`}
          </Button>
        </div>
      </div>

      {(runReport.error || saveMutation.isError) && (
        <p
          role="alert"
          style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
        >
          {runReport.error ?? 'Could not save the reform. Try again.'}
        </p>
      )}
    </header>
  );
}
