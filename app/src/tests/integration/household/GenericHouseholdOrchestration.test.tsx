import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import { fetchReportById } from '@/api/report';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { fetchSimulationById } from '@/api/simulation';
import SPMMethodologyFootnote from '@/components/household/SPMMethodologyFootnote';
import { MOCK_USER_ID } from '@/constants';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import { CalcOrchestratorManager } from '@/libs/calculations/CalcOrchestratorManager';
import { HouseholdReportOrchestrator } from '@/libs/calculations/household/HouseholdReportOrchestrator';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import { useModifyReportSubmission } from '@/pages/reportBuilder/hooks/useModifyReportSubmission';
import { useReportSubmission } from '@/pages/reportBuilder/hooks/useReportSubmission';
import metadataReducer from '@/reducers/metadataReducer';
import {
  GENERIC_ECONOMY_OUTPUT,
  GENERIC_ENVELOPES,
  GENERIC_HOUSEHOLD_IDS,
  GENERIC_HOUSEHOLDS,
  GENERIC_OTHER_ERROR,
  GENERIC_POLICIES,
  GENERIC_POLICY_IDS,
  GENERIC_REPORT_ID,
  GENERIC_REPORT_STATE,
  GENERIC_SIMULATION_IDS,
  GENERIC_SPM_ERROR,
  GENERIC_USER_REPORT_ID,
  GenericOrchestrationHTTP,
} from '@/tests/fixtures/spm/genericOrchestrationMocks';
import { RESOLVED_CANONICAL_METADATA } from '@/tests/fixtures/spm/spmMocks';
import type { CalcStartConfig, CalcStatus } from '@/types/calculation';
import {
  convertPoliciesToV1Format,
  getHouseholdReproducibilityCode,
} from '@/utils/reproducibilityCode';

type SubmissionMode = 'create' | 'save as new' | 'replace';
const onSuccess = vi.fn();
function CreateForm() {
  const submission = useReportSubmission({
    reportState: GENERIC_REPORT_STATE,
    countryId: 'us',
    onSuccess,
  });
  return (
    <button
      type="button"
      disabled={!submission.isReportConfigured || submission.isSubmitting}
      onClick={() => void submission.handleSubmit()}
    >
      Submit report
    </button>
  );
}
function ModifyForm({ mode }: { mode: Exclude<SubmissionMode, 'create'> }) {
  const submission = useModifyReportSubmission({
    reportState: GENERIC_REPORT_STATE,
    countryId: 'us',
    existingUserReportId: GENERIC_USER_REPORT_ID,
    onSuccess,
  });
  return (
    <button
      type="button"
      disabled={
        submission.isReportSubmissionBlocked || submission.isReplacing || submission.isSavingNew
      }
      onClick={() =>
        void (mode === 'replace'
          ? submission.handleReplace()
          : submission.handleSaveAsNew('Corrected canonical report'))
      }
    >
      Submit report
    </button>
  );
}

let client: QueryClient;
let http: GenericOrchestrationHTTP;
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
async function submit(mode: SubmissionMode) {
  await new LocalStorageReportStore().createWithId({
    id: GENERIC_USER_REPORT_ID,
    userId: String(MOCK_USER_ID),
    reportId: '300',
    countryId: 'us',
    label: 'Original report',
  });
  const view = render(providers(mode === 'create' ? <CreateForm /> : <ModifyForm mode={mode} />));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit report' })).toBeEnabled());
  await userEvent.setup().click(screen.getByRole('button', { name: 'Submit report' }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  return view;
}
function expectActualHouseholdRequests() {
  expect([...http.calculationRequests].sort()).toEqual(
    GENERIC_HOUSEHOLD_IDS.map(
      (id, index) => `/us/household/${id}/policy/${GENERIC_POLICY_IDS[index]}`
    ).sort()
  );
}
async function hydrateAndVerifyReceipts() {
  const report = ReportAdapter.fromMetadata(await fetchReportById('us', GENERIC_REPORT_ID));
  expect(report.output).toEqual(
    Object.fromEntries(GENERIC_SIMULATION_IDS.map((id, index) => [id, GENERIC_ENVELOPES[index]]))
  );
  const simulations = await Promise.all(
    GENERIC_SIMULATION_IDS.map(async (id) =>
      SimulationAdapter.fromMetadata(await fetchSimulationById('us', id))
    )
  );
  simulations.forEach((simulation, index) => {
    expect(simulation.status).toBe('complete');
    expect(simulation.output).toEqual(GENERIC_ENVELOPES[index]);
    const output = simulation.output as HouseholdCalculationResult;
    const code = getHouseholdReproducibilityCode(
      'us',
      {
        role: index === 0 ? 'baseline' : 'reform',
        household: GENERIC_HOUSEHOLDS[index],
        policy: convertPoliciesToV1Format([GENERIC_POLICIES[index]]).baseline.data,
        spmConfig: output.spm_config,
        spmProvenance: output.spm_provenance,
        modelVersion: output.policyengine_bundle!.model_version,
        policyengineVersion: output.policyengine_bundle!.policyengine_version,
      },
      Number(report.year)
    ).join('\n');
    expect(code).toContain(output.spm_config!.forecast_content_sha256);
    expect(code).toContain(`policyengine-us==${output.policyengine_bundle!.model_version}`);
    expect(code).toContain(`reform=${index === 0 ? 'baseline' : 'reform'},`);
    expect(code).toContain('simulation.spm_provenance()');
  });
  const output = new HouseholdReportViewModel(report, simulations, [], []).getHouseholdOutputs();
  const view = render(<SPMMethodologyFootnote output={output} />);
  expect(
    screen.getByRole('region', { name: 'SPM point calculation methodology' })
  ).toHaveTextContent(GENERIC_ENVELOPES[0].spm_provenance!.forecast_sha256);
  expect(
    screen.getByRole('region', { name: 'SPM point calculation methodology' })
  ).toHaveTextContent(GENERIC_ENVELOPES[1].spm_provenance!.forecast_sha256);
  view.unmount();
}

beforeEach(() => {
  localStorage.clear();
  onSuccess.mockReset();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  http = new GenericOrchestrationHTTP();
  vi.stubGlobal('fetch', vi.fn(http.fetch));
});
afterEach(async () => {
  http.resolveAll();
  await Promise.resolve();
  client.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('real create and modify household calculation persistence', () => {
  test.each<SubmissionMode>(['create', 'save as new', 'replace'])(
    'given %s submission then each actual simulation persists its complete envelope and reproduces after reopening',
    async (mode) => {
      const view = await submit(mode);
      await waitFor(() => {
        expect(http.simulationPatches).toHaveLength(2);
        expect(http.report.status).toBe('complete');
      });
      expectActualHouseholdRequests();
      GENERIC_SIMULATION_IDS.forEach((id, index) => {
        const patch = http.simulationPatches.find((candidate) => String(candidate.id) === id)!;
        expect(patch.status).toBe('complete');
        expect(JSON.parse(patch.output!)).toEqual(GENERIC_ENVELOPES[index]);
      });
      if (mode === 'replace') {
        expect(
          (await new LocalStorageReportStore().findByUserReportId(GENERIC_USER_REPORT_ID))?.reportId
        ).toBe(GENERIC_REPORT_ID);
      }
      view.unmount();
      client.clear();
      await hydrateAndVerifyReceipts();
    }
  );

  test.each<SubmissionMode>(['create', 'save as new', 'replace'])(
    'given %s submission fails then terminal SPM details and parent failure survive reopening without report-output orchestration',
    async (mode) => {
      http.failure = { index: 1, ...GENERIC_SPM_ERROR };
      const view = await submit(mode);
      await waitFor(() => {
        expect(http.simulations.get('102')?.status).toBe('error');
        expect(http.simulations.get('101')?.status).toBe('complete');
        expect(http.report.status).toBe('error');
      });
      expectActualHouseholdRequests();
      expect(http.simulations.get('102')?.error_message).toBe(
        `[${GENERIC_SPM_ERROR.code}] ${GENERIC_SPM_ERROR.message}`
      );
      expect(
        client.getQueryData<CalcStatus>(calculationKeys.bySimulationId('102'))?.error
      ).toMatchObject({ ...GENERIC_SPM_ERROR, retryable: false });
      view.unmount();
      client.clear();
      const report = ReportAdapter.fromMetadata(await fetchReportById('us', GENERIC_REPORT_ID));
      const simulations = await Promise.all(
        GENERIC_SIMULATION_IDS.map(async (id) =>
          SimulationAdapter.fromMetadata(await fetchSimulationById('us', id))
        )
      );
      const vm = new HouseholdReportViewModel(report, simulations, [], []);
      expect(vm.getErrorMessage()).toContain(GENERIC_SPM_ERROR.code);
      expect(vm.getErrorMessage()).toContain(GENERIC_SPM_ERROR.message);
      expect(vm.hasCorrectiveSPMError()).toBe(true);
      expect(vm.shouldStartCalculations(HouseholdReportOrchestrator.getInstance(client))).toBe(
        false
      );
      expect(http.reportPatches.every((patch) => patch.status === 'error')).toBe(true);
    }
  );

  test('given a non-SPM error in the generic path then its original message is persisted too', async () => {
    http.failure = { index: 0, message: GENERIC_OTHER_ERROR };
    await submit('create');
    await waitFor(() => expect(http.report.status).toBe('error'));
    const simulation = SimulationAdapter.fromMetadata(await fetchSimulationById('us', '101'));
    expect(simulation.errorCode).toBe('HOUSEHOLD_CALC_FAILED');
    expect(simulation.errorMessage).toBe(GENERIC_OTHER_ERROR);
  });
});

describe('generic and report-output orchestration share ownership through persistence', () => {
  test.each([
    ['household first', 'household'],
    ['household first', 'economy'],
    ['economy first', 'household'],
    ['economy first', 'economy'],
  ] as const)(
    'given colliding numeric IDs with %s and %s completes first then report and simulation calculations remain independent',
    async (launchOrder, firstCompletion) => {
      http.seed();
      http.deferCalculations = true;
      http.deferEconomy = true;
      const manager = new CalcOrchestratorManager(client);
      const householdConfig = { ...http.genericConfigs[0], reportId: undefined };
      const economyConfig: CalcStartConfig = {
        calcId: '101',
        targetType: 'report',
        countryId: 'us',
        year: '2026',
        populations: {},
        simulations: {
          simulation1: {
            ...http.domainSimulations[0],
            populationType: 'geography',
            populationId: 'us',
          },
          simulation2: {
            ...http.domainSimulations[1],
            populationType: 'geography',
            populationId: 'us',
          },
        },
      };
      const tasks =
        launchOrder === 'household first'
          ? [manager.startCalculation(householdConfig), manager.startCalculation(economyConfig)]
          : [manager.startCalculation(economyConfig), manager.startCalculation(householdConfig)];
      await waitFor(() => {
        expect(http.calculationRequests).toEqual(['/us/household/201/policy/11']);
        expect(http.economyRequests).toHaveLength(1);
      });
      expect(manager.getDebugInfo().activeCount).toBe(2);
      if (firstCompletion === 'household') {
        http.resolveCalculation(0);
        await waitFor(() => expect(http.simulationPatches).toHaveLength(1));
        expect(http.reportPatches).toHaveLength(0);
        http.resolveEconomy();
      } else {
        http.resolveEconomy();
        await waitFor(() => expect(http.reportPatches).toHaveLength(1));
        expect(http.simulationPatches).toHaveLength(0);
        http.resolveCalculation(0);
      }
      await Promise.all(tasks);
      expect(http.simulationPatches).toHaveLength(1);
      expect(http.reportPatches).toHaveLength(1);
      expect(http.simulationPatches[0]).toMatchObject({ id: 101, status: 'complete' });
      expect(http.reportPatches[0]).toMatchObject({ id: 101, status: 'complete' });
      expect(
        client.getQueryData<CalcStatus>(calculationKeys.bySimulationId('101'))?.result
      ).toEqual(GENERIC_ENVELOPES[0]);
      expect(client.getQueryData<CalcStatus>(calculationKeys.byReportId('101'))?.result).toEqual(
        GENERIC_ECONOMY_OUTPUT
      );
      const household = SimulationAdapter.fromMetadata(await fetchSimulationById('us', '101'));
      expect(household.output).toEqual(GENERIC_ENVELOPES[0]);
      const report = ReportAdapter.fromMetadata(await fetchReportById('us', '101'));
      expect(report.output).toEqual(GENERIC_ECONOMY_OUTPUT);
      expect(manager.getDebugInfo().activeCount).toBe(0);
    }
  );

  test('given a hydrated failed sibling then a later successful calculation preserves its corrective parent error', async () => {
    http.seed();
    http.simulations.set('101', {
      ...http.simulations.get('101')!,
      status: 'error',
      error_message: `[${GENERIC_SPM_ERROR.code}] ${GENERIC_SPM_ERROR.message}`,
    });
    const storedFailure = SimulationAdapter.fromMetadata(await fetchSimulationById('us', '101'));
    client.setQueryData(reportKeys.byId(GENERIC_REPORT_ID), http.domainReport);
    client.setQueryData(simulationKeys.byId('101'), storedFailure);
    await new CalcOrchestratorManager(client).startCalculation(http.genericConfigs[1]);
    expect(http.report.status).toBe('error');
    expect(http.reportPatches.at(-1)?.error_message).toBe(
      `[${GENERIC_SPM_ERROR.code}] ${GENERIC_SPM_ERROR.message}`
    );
    expect(http.reportPatches.every((patch) => patch.status === 'error')).toBe(true);
    expect(http.calculationRequests).toEqual(['/us/household/202/policy/12']);
  });

  test('given the submitting provider unmounts during PATCH then the report-output owner joins without recalculating or overwriting', async () => {
    http.deferSimulationIds.add('101');
    const view = await submit('create');
    await waitFor(() => expect(http.simulationPatches).toHaveLength(2));
    expect(http.simulations.get('101')?.status).toBe('pending');
    view.unmount();
    const manager = new CalcOrchestratorManager(client);
    expect(manager.isRunning('101')).toBe(true);
    const reopened = HouseholdReportOrchestrator.getInstance(client).startReport(
      http.dedicatedConfig
    );
    await Promise.resolve();
    expect(http.calculationRequests).toHaveLength(2);
    expect(http.simulationPatches).toHaveLength(2);
    http.resolveSimulationWrite('101');
    await reopened;
    expect(http.report.status).toBe('complete');
    expect(http.simulationPatches).toHaveLength(2);
    expect(manager.getDebugInfo().activeCount).toBe(0);
    await hydrateAndVerifyReceipts();
  });

  test.each([
    ['generic first', 0],
    ['generic first', 1],
    ['report output first', 0],
    ['report output first', 1],
  ] as const)(
    'given %s with an SPM failure and simulation %i finishes first then both entrypoints retain one terminal error',
    async (launchOrder, firstCompletion) => {
      http.seed();
      http.deferCalculations = true;
      http.failure = { index: 1, ...GENERIC_SPM_ERROR };
      client.setQueryData(reportKeys.byId(GENERIC_REPORT_ID), http.domainReport);
      const manager = new CalcOrchestratorManager(client);
      const dedicated = HouseholdReportOrchestrator.getInstance(client);
      const startGeneric = () =>
        Promise.all(http.genericConfigs.map((config) => manager.startCalculation(config)));
      const operations =
        launchOrder === 'generic first'
          ? [startGeneric(), dedicated.startReport(http.dedicatedConfig)]
          : [dedicated.startReport(http.dedicatedConfig), startGeneric()];
      await waitFor(() => expect(http.calculationRequests).toHaveLength(2));
      http.resolveCalculation(firstCompletion);
      await waitFor(() => expect(http.simulationPatches).toHaveLength(1));
      http.resolveCalculation(1 - firstCompletion);
      await Promise.all(operations);
      expect(http.report.status).toBe('error');
      expect(http.reportPatches.every((patch) => patch.status === 'error')).toBe(true);
      expect(http.simulationPatches).toHaveLength(2);
      expect(http.simulations.get('102')?.error_message).toBe(
        `[${GENERIC_SPM_ERROR.code}] ${GENERIC_SPM_ERROR.message}`
      );
      expectActualHouseholdRequests();
      await dedicated.startReport(http.dedicatedConfig);
      await startGeneric();
      expect(http.calculationRequests).toHaveLength(2);
      expect(http.simulationPatches).toHaveLength(2);
    }
  );

  test('given one simulation write is delayed then completed calculation caches cannot complete the parent early', async () => {
    http.seed();
    http.deferSimulationIds.add('101');
    client.setQueryData(reportKeys.byId(GENERIC_REPORT_ID), http.domainReport);
    const manager = new CalcOrchestratorManager(client);
    const pending = Promise.all(
      http.genericConfigs.map((config) => manager.startCalculation(config))
    );
    await waitFor(() => {
      expect(http.simulationPatches).toHaveLength(2);
      expect(http.simulations.get('102')?.status).toBe('complete');
    });
    expect(http.simulations.get('101')?.status).toBe('pending');
    expect(http.reportPatches).toHaveLength(0);
    expect(http.report.status).toBe('pending');
    http.resolveSimulationWrite('101');
    await pending;
    expect(http.report.status).toBe('complete');
    await hydrateAndVerifyReceipts();
  });

  test.each([
    ['generic first', 0],
    ['generic first', 1],
    ['report output first', 0],
    ['report output first', 1],
  ] as const)(
    'given %s and simulation %i finishes first then competing entrypoints cannot duplicate or overwrite full results',
    async (launchOrder, firstCompletion) => {
      http.seed();
      http.deferCalculations = true;
      client.setQueryData(reportKeys.byId(GENERIC_REPORT_ID), http.domainReport);
      const manager = new CalcOrchestratorManager(client);
      const dedicated = HouseholdReportOrchestrator.getInstance(client);
      const startGeneric = () =>
        Promise.all(http.genericConfigs.map((config) => manager.startCalculation(config)));
      let generic: Promise<unknown>;
      let reportOutput: Promise<unknown>;
      if (launchOrder === 'generic first') {
        generic = startGeneric();
        reportOutput = dedicated.startReport(http.dedicatedConfig);
      } else {
        reportOutput = dedicated.startReport(http.dedicatedConfig);
        generic = startGeneric();
      }
      await waitFor(() => expect(http.calculationRequests).toHaveLength(2));
      http.resolveCalculation(firstCompletion);
      await waitFor(() => expect(http.simulationPatches).toHaveLength(1));
      expect(http.report.status).toBe('pending');
      http.resolveCalculation(1 - firstCompletion);
      await Promise.all([generic, reportOutput]);
      await waitFor(() => expect(http.report.status).toBe('complete'));
      expectActualHouseholdRequests();
      expect(http.simulationPatches).toHaveLength(2);
      expect(manager.getDebugInfo().activeCount).toBe(0);
      await dedicated.startReport(http.dedicatedConfig);
      await startGeneric();
      expect(http.calculationRequests).toHaveLength(2);
      expect(http.simulationPatches).toHaveLength(2);
      await hydrateAndVerifyReceipts();
    }
  );
});
