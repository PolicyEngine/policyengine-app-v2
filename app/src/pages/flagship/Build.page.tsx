import { useSelector } from 'react-redux';
import AddParameterBar from '@/components/flagship/reform/AddParameterBar';
import DraftHeader, { DraftRunBar } from '@/components/flagship/reform/DraftHeader';
import DraftTable from '@/components/flagship/reform/DraftTable';
import ParametersStatus from '@/components/flagship/reform/ParametersStatus';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Title } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, provisionFromSearchEntry, useDraftReform } from '@/libs/draftReform';
import { focusProvision } from '@/libs/flagship/draftEditorFocus';
import { ParameterSearchEntry, selectParameterSearchEntries } from '@/libs/parameterSearch';
import { RootState } from '@/store';

/**
 * Build — the reform is the page.
 *
 * Its name sits at the top; the reform itself is a table, each
 * parameter's new value typed in place and opened up for year-by-year
 * and breakdown values. The table's last row adds another parameter
 * (search, or browse the policy tree); an empty draft asks for the first
 * in the middle of the page. Picking a parameter lands on its value, so
 * finding and setting it are one motion. The year, who the report runs
 * on and the run come last, in a bar that stays in view under the reform.
 */
export default function BuildPage() {
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const draft = useDraftReform();
  const current = draft && draft.countryId === countryId ? draft : null;
  // Until the index is in, the add bar has nothing to search and the
  // table can't group breakdowns (their members would show apart, then
  // merge), so the page waits on one loader rather than two.
  const loading = useSelector(selectParameterSearchEntries).length === 0;

  const pick = (entry: ParameterSearchEntry) => {
    addDraftProvision(
      countryId,
      provisionFromSearchEntry(entry, parameters?.[entry.path]?.values),
      'manual'
    );
    focusProvision(entry.path);
  };

  return (
    <WorkspaceLayout wide>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xl,
          width: '100%',
          maxWidth: 880,
          margin: '0 auto',
          // An empty page centers its one question; a reform starts at the top.
          paddingTop: current ? spacing.lg : '16vh',
          paddingBottom: spacing['4xl'],
        }}
      >
        {current ? (
          <>
            <DraftHeader draft={current} />
            {loading ? (
              <ParametersStatus paths={current.provisions.map((provision) => provision.path)} />
            ) : (
              // The next parameter is added at the foot of the reform, where
              // the last one ends: a reform takes as many as it needs.
              <DraftTable draft={current} addRow={<AddParameterBar onPick={pick} inTable />} />
            )}
            <DraftRunBar draft={current} />
          </>
        ) : (
          <>
            <Title order={1} style={{ letterSpacing: '-0.02em', textAlign: 'center' }}>
              Build a reform
            </Title>
            <AddParameterBar onPick={pick} autoFocus />
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
