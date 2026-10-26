import { useEffect, useMemo, useState } from 'react';
import { useStore } from 'react-redux';
import AddParameterBar from '@/components/flagship/reform/AddParameterBar';
import DraftHeader, { DraftRunBar } from '@/components/flagship/reform/DraftHeader';
import DraftTable from '@/components/flagship/reform/DraftTable';
import ParametersStatus from '@/components/flagship/reform/ParametersStatus';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Title } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEnsureV3Parameters, useLoadV3Parameters } from '@/hooks/useV3Parameters';
import { useV3SearchCatalog } from '@/hooks/useV3SearchCatalog';
import {
  addDraftProvision,
  provisionFromSearchEntry,
  resumeDraftFor,
  useDraftReform,
} from '@/libs/draftReform';
import { focusProvision } from '@/libs/flagship/draftEditorFocus';
import { draftParameterNames, groupMemberPaths } from '@/libs/flagship/v3ParameterNames';
import { ParameterSearchEntry } from '@/libs/parameterSearch';
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
  const store = useStore<RootState>();
  const draft = useDraftReform();
  // Each country keeps its own draft: one set aside while another
  // country's was built comes back on its own country's page.
  useEffect(() => {
    resumeDraftFor(countryId);
  }, [countryId]);
  const current = draft && draft.countryId === countryId ? draft : null;
  // Until the index is in, the add bar has nothing to search and the
  // table can't group breakdowns (their members would show apart, then
  // merge), so the page waits on one loader rather than two. On the v2
  // routes it waits for the draft's parameters too (with their groups and
  // the indexes a value can grow with), which load in one request.
  const catalog = useV3SearchCatalog();
  const provisions = current?.provisions;
  const draftNames = useMemo(
    () => (provisions ? draftParameterNames(provisions, catalog.addablePaths, countryId) : []),
    [provisions, catalog.addablePaths, countryId]
  );
  const draftParameters = useEnsureV3Parameters(draftNames);
  const loader =
    catalog.status !== 'ready'
      ? catalog
      : draftParameters.status !== 'ready'
        ? draftParameters
        : null;
  const loadParameters = useLoadV3Parameters();
  const [pickError, setPickError] = useState<string | null>(null);

  // A picked parameter joins the draft at current law, so on the v2
  // routes its values (and its group's) load first; on v1 they are in.
  const pick = (entry: ParameterSearchEntry) => {
    const add = () => {
      setPickError(null);
      addDraftProvision(
        countryId,
        provisionFromSearchEntry(entry, store.getState().metadata.parameters?.[entry.path]?.values),
        'manual'
      );
      focusProvision(entry.path);
    };
    const pending = loadParameters(groupMemberPaths(entry.path, catalog.addablePaths));
    if (pending) {
      pending.then(add, () => setPickError('Could not load that parameter. Try picking it again.'));
    } else {
      add();
    }
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
            {loader ? (
              <ParametersStatus
                paths={current.provisions.map((provision) => provision.path)}
                loader={loader}
              />
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
        {pickError && (
          <p role="alert" style={{ margin: 0, textAlign: 'center' }}>
            {pickError}
          </p>
        )}
      </div>
    </WorkspaceLayout>
  );
}
