import { useEffect } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { fetchSimulationById } from '@/api/simulation';
import { MOCK_USER_ID } from '@/constants';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import { useUserReportById } from '@/hooks/useUserReports';
import { Household } from '@/models/Household';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import { ReportMetaPanel } from '@/pages/reportBuilder/components/ReportMetaPanel';
import { useModifyReportSubmission } from '@/pages/reportBuilder/hooks/useModifyReportSubmission';
import { useReportBuilderState } from '@/pages/reportBuilder/hooks/useReportBuilderState';
import { useReportSubmission } from '@/pages/reportBuilder/hooks/useReportSubmission';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import metadataReducer from '@/reducers/metadataReducer';
import {
  GENERIC_HOUSEHOLD_IDS,
  GENERIC_POLICY_IDS,
  GENERIC_REPORT_ID,
  GENERIC_SIMULATION_IDS,
  GENERIC_USER_REPORT_ID,
} from '@/tests/fixtures/spm/genericOrchestrationMocks';
import {
  CORRECTED_HOUSEHOLD_IDS,
  CORRECTED_HOUSEHOLD_PAYLOADS,
  ORIGINAL_HOUSEHOLDS,
  ORIGINAL_REPORT_ID,
  ORIGINAL_YEAR,
  ReportYearRecoveryHTTP,
  SUPPORTED_YEAR,
  YEAR_ERROR,
  YEAR_SAVE_ERROR,
} from '@/tests/fixtures/spm/reportYearRecoveryMocks';
import { RESOLVED_CANONICAL_METADATA } from '@/tests/fixtures/spm/spmMocks';

type SubmissionMode = 'create' | 'replace' | 'save as new';
const onSuccess = vi.fn();
const onDraft = vi.fn<(state: ReportBuilderState) => void>();

function SubmissionAction({
  disabled,
  error,
  onSubmit,
}: {
  disabled: boolean;
  error: Error | null;
  onSubmit: () => Promise<void>;
}) {
  return (
    <>
      {error && <p role="alert">{error.message}</p>}
      <button type="button" disabled={disabled} onClick={() => void onSubmit()}>
        Update report
      </button>
    </>
  );
}
function CreateReportAction({ reportState }: { reportState: ReportBuilderState }) {
  const submission = useReportSubmission({ reportState, countryId: 'us', onSuccess });
  return (
    <SubmissionAction
      disabled={!submission.isReportConfigured || submission.isSubmitting}
      error={submission.submissionError}
      onSubmit={submission.handleSubmit}
    />
  );
}
function ModifyReportAction({
  reportState,
  mode,
}: {
  reportState: ReportBuilderState;
  mode: Exclude<SubmissionMode, 'create'>;
}) {
  const submission = useModifyReportSubmission({
    reportState,
    countryId: 'us',
    existingUserReportId: GENERIC_USER_REPORT_ID,
    onSuccess,
  });
  return (
    <SubmissionAction
      disabled={
        submission.isReportSubmissionBlocked || submission.isReplacing || submission.isSavingNew
      }
      error={submission.submissionError}
      onSubmit={() =>
        mode === 'replace'
          ? submission.handleReplace()
          : submission.handleSaveAsNew('Corrected report year')
      }
    />
  );
}
function YearRecoveryEditor({ mode }: { mode: SubmissionMode }) {
  const { reportState, setReportState, originalState, error } =
    useReportBuilderState(GENERIC_USER_REPORT_ID);
  useEffect(() => {
    if (reportState) {
      onDraft(reportState);
    }
  }, [reportState]);
  if (error) {
    return <p role="alert">{error.message}</p>;
  }
  if (!reportState) {
    return <p>Loading report inputs</p>;
  }
  return (
    <>
      <ReportMetaPanel
        reportState={reportState}
        setReportState={setReportState as React.Dispatch<React.SetStateAction<ReportBuilderState>>}
      />
      <button type="button" onClick={() => setReportState(originalState)}>
        Cancel changes
      </button>
      {mode === 'create' ? (
        <CreateReportAction reportState={reportState} />
      ) : (
        <ModifyReportAction reportState={reportState} mode={mode} />
      )}
    </>
  );
}

function ReopenedReport({ userReportId }: { userReportId: string }) {
  const data = useUserReportById(userReportId);
  return <HouseholdReportOutput {...data} subpage="reproduce" />;
}

let client: QueryClient;
let http: ReportYearRecoveryHTTP;
function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
function providers(children: React.ReactNode) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata: RESOLVED_CANONICAL_METADATA },
  });
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <CalcOrchestratorProvider>{children}</CalcOrchestratorProvider>
      </QueryClientProvider>
    </Provider>
  );
}
function currentDraft() {
  return onDraft.mock.lastCall![0];
}
async function selectYear(year: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: 'Report year' }));
  await user.click(await screen.findByRole('option', { name: year }));
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Report year' })).toHaveTextContent(year)
  );
}
async function openEditor(
  mode: SubmissionMode = 'replace',
  expectedYear = ORIGINAL_YEAR,
  waitForSubmission = true
) {
  const view = render(providers(<YearRecoveryEditor mode={mode} />));
  expect(await screen.findByRole('combobox', { name: 'Report year' })).toHaveTextContent(
    expectedYear
  );
  if (waitForSubmission) {
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Update report' })).toBeEnabled()
    );
  }
  return view;
}

beforeEach(async () => {
  localStorage.clear();
  onSuccess.mockReset();
  onDraft.mockReset();
  client = newClient();
  http = new ReportYearRecoveryHTTP();
  vi.stubGlobal('fetch', vi.fn(http.fetch));
  // jsdom omits pointer capture used by the actual Radix Select trigger.
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    setPointerCapture: { configurable: true, value: () => {} },
    releasePointerCapture: { configurable: true, value: () => {} },
  });
  await new LocalStorageReportStore().createWithId({
    id: GENERIC_USER_REPORT_ID,
    userId: String(MOCK_USER_ID),
    reportId: ORIGINAL_REPORT_ID,
    countryId: 'us',
    label: 'Report with unavailable SPM year',
  });
});
afterEach(() => {
  http.resolveAll();
  client.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
  ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture'].forEach((key) => {
    Reflect.deleteProperty(HTMLElement.prototype, key);
  });
});

describe('actual report year selector corrects saved SPM inputs before calculation', () => {
  test.each<SubmissionMode>(['create', 'replace', 'save as new'])(
    'given %s recovery then independent immutable households calculate the chosen year and reopen successfully',
    async (mode) => {
      const originalSavedInputs = structuredClone([...http.households]);
      const originalPolicies = structuredClone(http.policies);
      const originalReport = structuredClone(http.originalReport);
      const originalSimulations = structuredClone(http.originalSimulations);
      const failedViewModel = new HouseholdReportViewModel(
        ReportAdapter.fromMetadata(http.originalReport),
        http.originalSimulations.map((simulation) => SimulationAdapter.fromMetadata(simulation)),
        [],
        []
      );
      expect(failedViewModel.getErrorMessage()).toContain(YEAR_ERROR.code);
      const view = await openEditor(mode);
      const originalDraft = currentDraft();
      await selectYear(SUPPORTED_YEAR);

      expect(http.writes).toEqual([]);
      expect(currentDraft().year).toBe(SUPPORTED_YEAR);
      expect(currentDraft().simulations.map((simulation) => simulation.policy)).toEqual(
        originalDraft.simulations.map((simulation) => simulation.policy)
      );
      currentDraft().simulations.forEach((simulation, index) => {
        expect(simulation.population.household!.toV1CreationPayload()).toEqual(
          CORRECTED_HOUSEHOLD_PAYLOADS[index]
        );
        expect(simulation.population.household).not.toBe(
          originalDraft.simulations[index].population.household
        );
        expect(
          originalDraft.simulations[index].population.household!.toV1CreationPayload()
        ).toEqual(ORIGINAL_HOUSEHOLDS[index].toV1CreationPayload());
      });

      await userEvent.setup().click(screen.getByRole('button', { name: 'Update report' }));
      await waitFor(() => expect(http.report.status).toBe('complete'));
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(http.householdPosts).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS);
      expect([...http.calculationRequests].sort()).toEqual(
        CORRECTED_HOUSEHOLD_IDS.map(
          (id, index) => `/us/household/${id}/policy/${GENERIC_POLICY_IDS[index]}`
        ).sort()
      );
      expect(http.report.year).toBe(SUPPORTED_YEAR);
      expect(http.writes.filter((write) => write.includes('/policy'))).toEqual([]);
      expect(http.policies).toEqual(originalPolicies);
      expect(http.originalReport).toEqual(originalReport);
      expect(http.originalSimulations).toEqual(originalSimulations);
      originalSavedInputs.forEach(([id, metadata]) =>
        expect(http.households.get(id)).toEqual(metadata)
      );

      const savedUserReportId = onSuccess.mock.lastCall![0] as string;
      const oldAssociation = await new LocalStorageReportStore().findByUserReportId(
        GENERIC_USER_REPORT_ID
      );
      expect(oldAssociation?.reportId).toBe(
        mode === 'replace' ? GENERIC_REPORT_ID : ORIGINAL_REPORT_ID
      );
      const savedAssociation = await new LocalStorageReportStore().findByUserReportId(
        savedUserReportId
      );
      expect(savedAssociation?.reportId).toBe(GENERIC_REPORT_ID);
      view.unmount();
      client.clear();
      client = newClient();

      const reopenedReport = ReportAdapter.fromMetadata(
        await fetchReportById('us', GENERIC_REPORT_ID)
      );
      expect(reopenedReport.status).toBe('complete');
      for (const [index, id] of GENERIC_SIMULATION_IDS.entries()) {
        const simulation = SimulationAdapter.fromMetadata(await fetchSimulationById('us', id));
        expect(simulation).toMatchObject({
          status: 'complete',
          populationId: CORRECTED_HOUSEHOLD_IDS[index],
          policyId: GENERIC_POLICY_IDS[index],
        });
        const storedHousehold = Household.fromV1Metadata(
          await fetchHouseholdById('us', simulation.populationId!)
        );
        expect(storedHousehold.year).toBe(Number(SUPPORTED_YEAR));
        expect(storedHousehold.toV1CreationPayload()).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS[index]);
        const envelope = simulation.output as HouseholdCalculationResult;
        expect(envelope.result.people.you.age).toEqual({
          [SUPPORTED_YEAR]: index === 0 ? 40 : 41,
        });
        expect(envelope.spm_config).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS[index].spm);
        expect(envelope.spm_provenance?.years).toEqual({
          [SUPPORTED_YEAR]: { source: 'forecast' },
        });
        expect(await fetchPolicyById('us', simulation.policyId!)).toEqual(originalPolicies[index]);
      }
      render(providers(<ReopenedReport userReportId={savedUserReportId} />));
      await screen.findByRole('heading', { name: 'Reproduce these results' });
      ['Baseline simulation', 'Reform simulation'].forEach((name, index) => {
        const section = screen.getByRole('region', { name });
        const code = section.querySelector('code')!.textContent!;
        expect(within(section).getByRole('button', { name: /Copy/ })).toBeEnabled();
        expect(code).toContain(`simulation.calculate("household_net_income", ${SUPPORTED_YEAR})`);
        expect(code).toContain(CORRECTED_HOUSEHOLD_PAYLOADS[index].spm!.forecast_content_sha256);
        expect(code).toContain(index === 0 ? '41000' : '62000');
        expect(code).toContain('2026-01-01.2100-12-31');
        if (index === 1) {
          expect(code).toContain('06037');
        }
      });
      expect(http.calculationRequests).toHaveLength(2);
    }
  );

  test.each<SubmissionMode>(['create', 'replace'])(
    'given %s recovery already displays a supported report year then explicit input correction saves that year and reopens',
    async (mode) => {
      http.originalReport.year = SUPPORTED_YEAR;
      const originalSavedInputs = structuredClone([...http.households]);
      const view = await openEditor(mode, SUPPORTED_YEAR, false);
      expect(
        currentDraft().simulations.map((simulation) => simulation.population.household!.year)
      ).toEqual([Number(ORIGINAL_YEAR), Number(ORIGINAL_YEAR)]);
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: `Use household inputs in ${SUPPORTED_YEAR}` }));
      expect(http.writes).toEqual([]);
      expect(currentDraft().year).toBe(SUPPORTED_YEAR);
      expect(
        currentDraft().simulations.map((simulation) =>
          simulation.population.household!.toV1CreationPayload()
        )
      ).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Update report' })).toBeEnabled()
      );
      await userEvent.setup().click(screen.getByRole('button', { name: 'Update report' }));
      await waitFor(() => expect(http.report.status).toBe('complete'));
      expect(http.householdPosts).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS);
      expect([...http.calculationRequests].sort()).toEqual(
        CORRECTED_HOUSEHOLD_IDS.map(
          (id, index) => `/us/household/${id}/policy/${GENERIC_POLICY_IDS[index]}`
        ).sort()
      );
      originalSavedInputs.forEach(([id, metadata]) =>
        expect(http.households.get(id)).toEqual(metadata)
      );
      expect(onSuccess).toHaveBeenCalledOnce();
      const savedUserReportId = onSuccess.mock.lastCall![0] as string;
      view.unmount();
      client.clear();
      client = newClient();
      render(providers(<ReopenedReport userReportId={savedUserReportId} />));
      await screen.findByRole('heading', { name: 'Reproduce these results' });
      ['Baseline simulation', 'Reform simulation'].forEach((name) => {
        const section = screen.getByRole('region', { name });
        expect(within(section).getByRole('button', { name: /Copy/ })).toBeEnabled();
        expect(section.querySelector('code')).toHaveTextContent(
          `simulation.calculate("household_net_income", ${SUPPORTED_YEAR})`
        );
      });
      expect(http.calculationRequests).toHaveLength(2);
    }
  );

  test.each<SubmissionMode>(['create', 'replace'])(
    'given %s has mismatched saved inputs without a creation marker then direct submission stops before any HTTP write',
    async (mode) => {
      http.originalReport.year = SUPPORTED_YEAR;
      http.originalSimulations.forEach((simulation) => {
        simulation.population_id = GENERIC_HOUSEHOLD_IDS[0];
      });
      await openEditor(mode, SUPPORTED_YEAR);
      currentDraft().simulations.forEach((simulation) => {
        expect(simulation.population.householdNeedsCreation).toBeUndefined();
        expect(simulation.population.household!.year).toBe(Number(ORIGINAL_YEAR));
      });
      await userEvent.setup().click(screen.getByRole('button', { name: 'Update report' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/year|period/i);
      expect(http.writes).toEqual([]);
      expect(http.calculationRequests).toEqual([]);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(
        (await new LocalStorageReportStore().findByUserReportId(GENERIC_USER_REPORT_ID))?.reportId
      ).toBe(ORIGINAL_REPORT_ID);
    }
  );

  test.each<SubmissionMode>(['create', 'replace', 'save as new'])(
    'given %s uses a shared county household then changing year creates one replacement and both policy calculations reopen',
    async (mode) => {
      http.originalSimulations.forEach((simulation) => {
        simulation.population_id = GENERIC_HOUSEHOLD_IDS[1];
      });
      const originalSavedInputs = structuredClone([...http.households]);
      const view = await openEditor(mode);
      await selectYear(SUPPORTED_YEAR);
      expect(http.writes).toEqual([]);
      const drafts = currentDraft().simulations.map(
        (simulation) => simulation.population.household!
      );
      expect(drafts[0].toV1CreationPayload()).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS[1]);
      expect(drafts[1].toV1CreationPayload()).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS[1]);
      await userEvent.setup().click(screen.getByRole('button', { name: 'Update report' }));
      await waitFor(() => expect(http.report.status).toBe('complete'));
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(http.householdPosts).toEqual([CORRECTED_HOUSEHOLD_PAYLOADS[1]]);
      expect(http.writes.filter((write) => write === 'POST /us/household')).toHaveLength(1);
      expect([...http.calculationRequests].sort()).toEqual(
        GENERIC_POLICY_IDS.map(
          (id) => `/us/household/${CORRECTED_HOUSEHOLD_IDS[0]}/policy/${id}`
        ).sort()
      );
      for (const [index, id] of GENERIC_SIMULATION_IDS.entries()) {
        const simulation = SimulationAdapter.fromMetadata(await fetchSimulationById('us', id));
        expect(simulation).toMatchObject({
          status: 'complete',
          populationId: CORRECTED_HOUSEHOLD_IDS[0],
          policyId: GENERIC_POLICY_IDS[index],
        });
        const envelope = simulation.output as HouseholdCalculationResult;
        expect(envelope.spm_config).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS[1].spm);
        expect(envelope.result.people.you.employment_income).toEqual({ [SUPPORTED_YEAR]: 62000 });
        expect(envelope.result.households!.household.county_fips).toEqual({
          [SUPPORTED_YEAR]: '06037',
        });
      }
      originalSavedInputs.forEach(([id, metadata]) =>
        expect(http.households.get(id)).toEqual(metadata)
      );
      const savedUserReportId = onSuccess.mock.lastCall![0] as string;
      view.unmount();
      client.clear();
      client = newClient();
      render(providers(<ReopenedReport userReportId={savedUserReportId} />));
      await screen.findByRole('heading', { name: 'Reproduce these results' });
      ['Baseline simulation', 'Reform simulation'].forEach((name) => {
        const section = screen.getByRole('region', { name });
        expect(within(section).getByRole('button', { name: /Copy/ })).toBeEnabled();
        expect(section.querySelector('code')).toHaveTextContent('06037');
        expect(section.querySelector('code')).toHaveTextContent(
          `simulation.calculate("household_net_income", ${SUPPORTED_YEAR})`
        );
      });
      expect(http.calculationRequests).toHaveLength(2);
      expect(http.householdPosts).toHaveLength(1);
    }
  );

  test('given a corrected year is cancelled then the saved report and independent input drafts remain unchanged without writes', async () => {
    await openEditor();
    const original = currentDraft();
    await selectYear(SUPPORTED_YEAR);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel changes' }));
    expect(currentDraft()).toEqual(original);
    currentDraft().simulations.forEach((simulation) => {
      expect(simulation.population.household).toBeInstanceOf(Household);
    });
    expect(screen.getByRole('combobox', { name: 'Report year' })).toHaveTextContent(ORIGINAL_YEAR);
    expect(http.writes).toEqual([]);
    expect(http.calculationRequests).toEqual([]);
    expect([...http.households.keys()]).toEqual(GENERIC_HOUSEHOLD_IDS);
  });

  test('given corrected household creation fails then the selected year and drafts survive and the original report association is retained', async () => {
    http.failHouseholdPost = 0;
    await openEditor();
    await selectYear(SUPPORTED_YEAR);
    const correctedDraft = currentDraft();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Update report' }));
    await waitFor(() => expect(http.householdPosts).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Update report' })).toBeEnabled()
    );
    expect(screen.getByRole('alert')).toHaveTextContent(YEAR_SAVE_ERROR.message);
    expect(currentDraft()).toBe(correctedDraft);
    expect(
      currentDraft().simulations.map((simulation) =>
        simulation.population.household!.toV1CreationPayload()
      )
    ).toEqual(CORRECTED_HOUSEHOLD_PAYLOADS);
    expect(http.calculationRequests).toEqual([]);
    expect(http.writes).toEqual(['POST /us/household']);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(
      (await new LocalStorageReportStore().findByUserReportId(GENERIC_USER_REPORT_ID))?.reportId
    ).toBe(ORIGINAL_REPORT_ID);
    expect([...http.households.keys()]).toEqual(GENERIC_HOUSEHOLD_IDS);
  });
});
