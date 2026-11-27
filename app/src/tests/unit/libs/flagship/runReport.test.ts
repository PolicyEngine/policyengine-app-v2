import type { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import {
  LocalStorageFlagshipReportStore,
  type FlagshipReportRecord,
  type FlagshipReportStore,
} from '@/api/flagshipReportStore';
import { LocalStorageReformStore } from '@/api/reformStore';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import type { ResultPersister } from '@/libs/calculations/ResultPersister';
import type { CountryId } from '@/libs/countries';
import {
  createReportRecords,
  forgetAccountReportMeta,
  readReportMeta,
  REPORT_META_KEY,
  reportMetaFromRecord,
  runFlagshipReport,
  type ReportRecordsRunner,
} from '@/libs/flagship/runReport';
import {
  CALIFORNIA_BASELINE_SIMULATION_ID,
  CALIFORNIA_RECORDS_REQUEST,
  CALIFORNIA_REFORM_SIMULATION_ID,
  CALIFORNIA_REGION,
  RUN_BASELINE_SIMULATION,
  RUN_REFORM_SIMULATION,
  RUN_REPORT,
  RUN_SAVED_REPORT,
  SAVED_REFORM_POLICY_ID,
  SAVED_REFORM_V2_POLICY_ID,
  STATE_RECORDS_BASELINE_POLICY_ID,
  STATE_RECORDS_REFORM_POLICY_ID,
  STATE_RECORDS_YEAR,
  STORED_CALIFORNIA_REPORT,
} from '@/tests/fixtures/libs/flagship/runReportMocks';
import type { CalcParams, CalcStartConfig } from '@/types/calculation';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReport = vi.fn();
const mockFetchBudgetWindow = vi.fn();
const mockFetchSocietyWide = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReport: (...args: any[]) => mockCreateReport(...args),
}));
vi.mock('@/api/budgetWindow', () => ({
  fetchBudgetWindow: (...args: any[]) => mockFetchBudgetWindow(...args),
}));
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: (...args: any[]) => mockFetchSocietyWide(...args),
}));

/** The localStorage keys the legacy calculator keeps its saved work under. */
const LEGACY_KEYS = [
  'user-policy-associations',
  'user-population-households',
  'user-simulation-associations',
  'user-report-associations',
];

const REFORM_ROW_ID = '55555555-5555-4555-8555-555555555555';
/** The account row a signed-in run writes; its ID is the report's link. */
const REPORT_ROW_ID = '44444444-4444-4444-8444-444444444444';

const PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2500,
};

/**
 * Holds the run's two simulation requests unanswered until `answer` is
 * called, so a test can look at what the run sent before its records exist.
 */
function holdSimulationRequests(): { answer: () => void } {
  let answerBaseline!: (value: unknown) => void;
  let answerReform!: (value: unknown) => void;
  mockCreateSimulation.mockReset();
  mockCreateSimulation
    .mockReturnValueOnce(
      new Promise((resolve) => {
        answerBaseline = resolve;
      })
    )
    .mockReturnValueOnce(
      new Promise((resolve) => {
        answerReform = resolve;
      })
    );
  return {
    answer: () => {
      answerBaseline({ result: { simulation_id: '101' } });
      answerReform({ result: { simulation_id: '102' } });
    },
  };
}

/** CalcOrchestrator's private step that turns a page's start config into the request's parameters. */
interface CalcParamsBuilder {
  buildParams: (config: CalcStartConfig) => CalcParams;
}

/**
 * Sends the economy request the report page sends for the records a run
 * created, as the Public API stores them: Report.page's start config,
 * made into parameters by CalcOrchestrator and sent by
 * SocietyWideCalcStrategy.
 */
async function sendReportPageEconomyRequest(): Promise<void> {
  const [baselineSimulation, reformSimulation] = mockCreateSimulation.mock.calls.map(
    ([countryId, payload], index) =>
      SimulationAdapter.fromMetadata({
        id: 101 + index,
        country_id: countryId,
        api_version: '1.0.0',
        population_id: payload.population_id,
        population_type: payload.population_type,
        policy_id: String(payload.policy_id),
        status: 'pending',
      } as SimulationMetadata)
  );
  const [reportCountryId, reportPayload] = mockCreateReport.mock.calls[0];
  const report = ReportAdapter.fromMetadata({
    id: 55,
    country_id: reportCountryId,
    simulation_1_id: String(reportPayload.simulation_1_id),
    simulation_2_id: String(reportPayload.simulation_2_id),
    year: reportPayload.year,
    api_version: '1.0.0',
    status: 'pending',
    output: null,
  } as ReportMetadata);
  // As Report.page's calcConfigs builds it.
  const config = {
    calcId: report.id,
    targetType: 'report',
    countryId: report.countryId as CountryId,
    year: report.year,
    simulations: { simulation1: baselineSimulation, simulation2: reformSimulation },
    estimateByRegion: true,
    recordReportErrors: true,
    populations: {
      household1: null,
      household2: null,
      geography1: {
        id: `${report.countryId}-${baselineSimulation.populationId}`,
        countryId: report.countryId,
        scope: 'national',
        geographyId: baselineSimulation.populationId || '',
      },
      geography2: null,
    },
  } as CalcStartConfig;
  const orchestrator = new CalcOrchestrator(
    {} as QueryClient,
    {} as ResultPersister
  ) as unknown as CalcParamsBuilder;
  await new SocietyWideCalcStrategy().execute(orchestrator.buildParams(config), {
    calcId: report.id!,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  });
}

describe('runFlagshipReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Account runs keep their details in memory for the page session.
    forgetAccountReportMeta();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: '77' } });
    mockCreateSimulation
      .mockResolvedValueOnce({ result: { simulation_id: '101' } })
      .mockResolvedValueOnce({ result: { simulation_id: '102' } });
    mockCreateReport.mockResolvedValue({ id: 55, country_id: 'us', year: '2026' });
  });

  test('starts both simulations before either finishes and waits for both before creating the report', async () => {
    let resolveBaseline!: (value: any) => void;
    let resolveReform!: (value: any) => void;
    mockCreateSimulation.mockReset();
    mockCreateSimulation
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveBaseline = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveReform = resolve;
        })
      );
    const pending = runFlagshipReport({
      countryId: 'us',
      title: 'CTC',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
    });
    await vi.waitFor(() => expect(mockCreateSimulation).toHaveBeenCalledTimes(2));
    expect(mockCreateReport).not.toHaveBeenCalled();
    resolveReform({ result: { simulation_id: '102' } });
    await Promise.resolve();
    expect(mockCreateReport).not.toHaveBeenCalled();
    resolveBaseline({ result: { simulation_id: '101' } });
    await expect(pending).resolves.toBe('55');
  });

  test('given provisions then policy, both simulations, and report are created in order', async () => {
    const userReportId = await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    expect(userReportId).toBe('55');
    // The base policy carries only the changes; the title stays on the record.
    expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
      data: {
        'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 2500 },
      },
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: 'us',
      population_type: 'geography',
      policy_id: 2,
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
      population_id: 'us',
      population_type: 'geography',
      policy_id: 77,
    });
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: 101,
      simulation_2_id: 102,
      year: '2026',
    });
  });

  test('given a state or district then both simulations run on it', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      region: 'congressional_district/CA-01',
    });

    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: 'congressional_district/CA-01',
      population_type: 'geography',
      policy_id: 2,
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
      population_id: 'congressional_district/CA-01',
      population_type: 'geography',
      policy_id: 77,
    });
  });

  test('given a run then its calculation starts at once, as the report page asks for it', async () => {
    mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });

    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      year: 2027,
      region: 'state/de',
    });

    expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '2', {
      region: 'state/de',
      time_period: '2027',
    });
  });

  test('given a nationwide run then the calculation asks for the country', async () => {
    mockFetchSocietyWide.mockRejectedValue(new Error('offline'));

    // A failed first request doesn't fail the run: the report page asks again.
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2026,
      })
    ).resolves.toBe('55');
    expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '2', {
      region: 'us',
      time_period: '2026',
    });
  });

  test('given a budget window with the run then it starts at once and the report knows it', async () => {
    mockFetchBudgetWindow.mockResolvedValue({ status: 'computing', result: null });

    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      year: 2026,
      region: 'state/de',
      windowYears: 10,
    });

    // Submitted with the report, on its reform, baseline and population.
    expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '77', '2', {
      region: 'state/de',
      startYear: 2026,
      windowSize: 10,
    });
    expect(readReportMeta('55')?.budgetWindow).toEqual({ startYear: 2026, windowSize: 10 });
  });

  test('given one year then no window starts', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      windowYears: 1,
    });

    expect(mockFetchBudgetWindow).not.toHaveBeenCalled();
    expect(readReportMeta('55')?.budgetWindow).toBeUndefined();
  });

  describe('given both policies exist then the calculation does not wait for the records', () => {
    test('then the economy request goes out before the simulations are created and the run does not wait for it', async () => {
      // Given: an economy request that is never answered
      mockFetchSocietyWide.mockReturnValueOnce(new Promise(() => {}));
      const simulationRequests = holdSimulationRequests();

      // When
      const pendingRun = runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2027,
        region: 'state/de',
      });
      await vi.waitFor(() => expect(mockCreateSimulation).toHaveBeenCalledTimes(2));

      // Then: sent once the policies exist, while the simulations are still unanswered
      expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '2', {
        region: 'state/de',
        time_period: '2027',
      });
      expect(mockFetchSocietyWide.mock.invocationCallOrder[0]).toBeLessThan(
        mockCreateSimulation.mock.invocationCallOrder[0]
      );
      expect(mockCreateReport).not.toHaveBeenCalled();
      simulationRequests.answer();
      await expect(pendingRun).resolves.toBe('55');
      // The run asks once: the report page checks on that job.
      expect(mockFetchSocietyWide).toHaveBeenCalledTimes(1);
    });

    test('then a budget window asked for with the run goes out before the simulations are created and the run does not wait for it', async () => {
      // Given: economy and budget-window requests that are never answered
      mockFetchSocietyWide.mockReturnValueOnce(new Promise(() => {}));
      mockFetchBudgetWindow.mockReturnValueOnce(new Promise(() => {}));
      const simulationRequests = holdSimulationRequests();

      // When
      const pendingRun = runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2026,
        region: 'state/de',
        windowYears: 10,
      });
      await vi.waitFor(() => expect(mockCreateSimulation).toHaveBeenCalledTimes(2));

      // Then
      expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '77', '2', {
        region: 'state/de',
        startYear: 2026,
        windowSize: 10,
      });
      expect(mockFetchBudgetWindow.mock.invocationCallOrder[0]).toBeLessThan(
        mockCreateSimulation.mock.invocationCallOrder[0]
      );
      simulationRequests.answer();
      await expect(pendingRun).resolves.toBe('55');
      expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['rejects', () => Promise.reject(new Error('offline'))],
      [
        'throws before it is sent',
        () => {
          throw new Error('offline');
        },
      ],
    ])('given each calculation request %s then the run still succeeds', async (_case, failure) => {
      // Given
      mockFetchSocietyWide.mockImplementationOnce(failure);
      mockFetchBudgetWindow.mockImplementationOnce(failure);

      // When / Then: the report page asks again, and shows any error there
      await expect(
        runFlagshipReport({
          countryId: 'us',
          title: 'CTC expansion',
          sourceNote: '',
          provisions: [PROVISION],
          currentLawId: 2,
          windowYears: 10,
        })
      ).resolves.toBe('55');
      expect(mockFetchSocietyWide).toHaveBeenCalledTimes(1);
      expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1);
    });

    test('given the records fail then both requests were sent, the run fails with the records’ error, and no rejection goes unhandled', async () => {
      // Given
      mockCreateReport.mockRejectedValueOnce(new Error('Report could not be created'));
      mockFetchSocietyWide.mockRejectedValueOnce(new Error('offline'));
      mockFetchBudgetWindow.mockRejectedValueOnce(new Error('offline'));
      const unhandledRejections: unknown[] = [];
      const recordUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason);
      };
      process.on('unhandledRejection', recordUnhandledRejection);

      try {
        // When / Then
        await expect(
          runFlagshipReport({
            countryId: 'us',
            title: 'CTC expansion',
            sourceNote: '',
            provisions: [PROVISION],
            currentLawId: 2,
            windowYears: 10,
          })
        ).rejects.toThrow('Report could not be created');
        // Node reports an unhandled rejection once the microtasks have run.
        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        process.off('unhandledRejection', recordUnhandledRejection);
      }

      expect(mockFetchSocietyWide).toHaveBeenCalledTimes(1);
      expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1);
      expect(unhandledRejections).toEqual([]);
    });

    test.each([
      ['the whole country', undefined],
      ['a state', 'state/de'],
      ['a congressional district', 'congressional_district/CA-01'],
    ])(
      'given a run for %s then the report page sends the same economy request',
      async (_case, region) => {
        // Given
        mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });
        await runFlagshipReport({
          countryId: 'us',
          title: 'CTC expansion',
          sourceNote: '',
          provisions: [PROVISION],
          currentLawId: 2,
          year: 2027,
          region,
        });

        // When
        await sendReportPageEconomyRequest();

        // Then: the same reform, baseline, region and year, so the page's
        // request finds the job the run's request queued
        expect(mockFetchSocietyWide).toHaveBeenCalledTimes(2);
        const [runRequest, reportPageRequest] = mockFetchSocietyWide.mock.calls;
        expect(reportPageRequest).toEqual(runRequest);
      }
    );
  });

  test('given a run then provenance is stashed under the API report id', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    const meta = readReportMeta('55');
    expect(meta?.title).toBe('CTC expansion');
    expect(meta?.sourceNote).toBe('Federal · Introduced');
    expect(meta?.provisions).toEqual([PROVISION]);
  });

  describe('given a saved reform to compare with', () => {
    const SAVED_BASELINE = {
      reformId: 'rf-plan-b',
      label: 'Plan B',
      parameters: [
        {
          name: 'gov.irs.credits.ctc.amount.base[0].amount',
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
        },
      ],
    };

    /** Plan B's change, as its unlabelled baseline policy carries it. */
    const PLAN_B_DATA = {
      'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 3000 },
    };

    beforeEach(() => {
      // The reform and the baseline each become their own policy, told
      // apart by what they change: neither carries a name.
      mockCreatePolicy.mockImplementation(
        async (_country: string, payload: { data: Record<string, unknown> }) => ({
          result: {
            policy_id: JSON.stringify(payload.data) === JSON.stringify(PLAN_B_DATA) ? '88' : '77',
          },
        })
      );
      mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });
      mockFetchBudgetWindow.mockResolvedValue({ status: 'computing', result: null });
    });

    test('then its parameters become the baseline policy', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
      });

      expect(mockCreatePolicy).toHaveBeenCalledWith('us', { data: PLAN_B_DATA });
      // Names live on the user's records, never on the base policies.
      for (const [, payload] of mockCreatePolicy.mock.calls) {
        expect(payload).not.toHaveProperty('label');
      }
    });

    test('then the baseline simulation, the calculation and the window all use it', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2026,
        windowYears: 10,
        baseline: SAVED_BASELINE,
      });

      expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
        population_id: 'us',
        population_type: 'geography',
        policy_id: 88,
      });
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
        population_id: 'us',
        population_type: 'geography',
        policy_id: 77,
      });
      // The economy asks for the reform over the chosen baseline: /economy/77/over/88.
      expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '88', {
        region: 'us',
        time_period: '2026',
      });
      expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '77', '88', {
        region: 'us',
        startYear: 2026,
        windowSize: 10,
      });
    });

    test('then the account record links the compared reform, without its name', async () => {
      const accountStore = {
        create: vi.fn().mockResolvedValue({ id: 'row-1' }),
      } as unknown as FlagshipReportStore;

      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
        accountReportStore: accountStore,
      });

      expect(accountStore.create).toHaveBeenCalledWith(
        expect.objectContaining({ baselineReformId: 'rf-plan-b' })
      );
      expect(JSON.stringify(vi.mocked(accountStore.create).mock.calls[0][0])).not.toContain(
        'Plan B'
      );
    });

    test('then the report meta records it by id and name', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
      });

      expect(readReportMeta('55')?.baseline).toEqual({
        reformId: 'rf-plan-b',
        policyId: '88',
        label: 'Plan B',
      });
    });

    test('given its policy already then the run reuses it without making one', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
      });

      expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        1,
        'us',
        expect.objectContaining({ policy_id: 88 })
      );
      expect(readReportMeta('55')?.baseline).toEqual({
        reformId: 'rf-plan-b',
        policyId: '88',
        label: 'Plan B',
      });
    });
  });

  describe('given the saved reform the run comes from already has its v1 policy', () => {
    beforeEach(() => {
      mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });
    });

    test('then the run creates no reform policy and runs that one', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        reformPolicyId: SAVED_REFORM_POLICY_ID,
      });

      expect(mockCreatePolicy).not.toHaveBeenCalled();
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
        population_id: 'us',
        population_type: 'geography',
        policy_id: Number(SAVED_REFORM_POLICY_ID),
      });
      expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', SAVED_REFORM_POLICY_ID, '2', {
        region: 'us',
        time_period: '2026',
      });
    });

    test('then a baseline from a saved reform’s parameters is the only policy created', async () => {
      const planBData = {
        'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 3000 },
      };
      mockCreatePolicy.mockResolvedValue({ result: { policy_id: '88' } });

      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        reformPolicyId: SAVED_REFORM_POLICY_ID,
        baseline: {
          reformId: 'rf-plan-b',
          label: 'Plan B',
          parameters: [
            {
              name: 'gov.irs.credits.ctc.amount.base[0].amount',
              values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
            },
          ],
        },
      });

      expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
      expect(mockCreatePolicy).toHaveBeenCalledWith('us', { data: planBData });
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        1,
        'us',
        expect.objectContaining({ policy_id: 88 })
      );
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        2,
        'us',
        expect.objectContaining({ policy_id: Number(SAVED_REFORM_POLICY_ID) })
      );
    });

    test.each([
      ['no policy', undefined],
      ['a null policy', null],
      ['an empty policy ID', ''],
      ['a v2 policy UUID', SAVED_REFORM_V2_POLICY_ID],
    ])('given %s then the run creates the reform policy as before', async (_case, policyId) => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        reformPolicyId: policyId,
      });

      expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        2,
        'us',
        expect.objectContaining({ policy_id: 77 })
      );
    });

    test('given a reform saved in this browser and then run then one reform policy is requested', async () => {
      // The save's policy has its own ID, so a run that made the policy
      // again would simulate a different one.
      mockCreatePolicy.mockResolvedValueOnce({ result: { policy_id: SAVED_REFORM_POLICY_ID } });
      const savedReform = await new LocalStorageReformStore().create({
        countryId: 'us',
        label: 'CTC expansion',
        parameters: [
          {
            name: PROVISION.path,
            values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: PROVISION.value }],
          },
        ],
        baseline: 'current-law',
        provenance: { source: 'manual' },
      });

      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        reformId: savedReform.id,
        reformPolicyId: savedReform.policyId,
      });

      expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        2,
        'us',
        expect.objectContaining({ policy_id: Number(SAVED_REFORM_POLICY_ID) })
      );
    });
  });

  test('given no baseline then the report compares with current law and records none', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(
      1,
      'us',
      expect.objectContaining({ policy_id: 2 })
    );
    expect(readReportMeta('55')).not.toHaveProperty('baseline');
  });

  test('given a baseline with nothing in it then the report compares with current law', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      baseline: { reformId: 'rf-empty', label: 'Empty', parameters: [] },
    });

    expect(mockCreateSimulation).toHaveBeenNthCalledWith(
      1,
      'us',
      expect.objectContaining({ policy_id: 2 })
    );
    expect(readReportMeta('55')).not.toHaveProperty('baseline');
  });

  test('given no provisions then it refuses to run', async () => {
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'Empty',
        sourceNote: 'Draft',
        provisions: [],
        currentLawId: 2,
      })
    ).rejects.toThrow(/no provisions/);
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  test('given a signed-out run then only the v3 keys are written, never the legacy ones', async () => {
    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      reformId: 'rf-local1',
    });

    // Then
    const records = JSON.parse(localStorage.getItem('pe-flagship-reports') ?? '[]');
    expect(records).toEqual([
      expect.objectContaining({
        apiReportId: '55',
        title: 'CTC expansion',
        reformId: 'rf-local1',
      }),
    ]);
    expect(localStorage.getItem(REPORT_META_KEY)).not.toBeNull();
    for (const legacyKey of LEGACY_KEYS) {
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
  });

  test('given a signed-in run then exactly one account association is written', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
    } as unknown as FlagshipReportStore;

    // When
    const reportId = await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      reformId: REFORM_ROW_ID,
      year: 2027,
      accountReportStore: accountStore,
    });

    // Then: the account row's ID is the report's link, which anyone can open
    expect(reportId).toBe(REPORT_ROW_ID);
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: 101,
      simulation_2_id: 102,
      year: '2027',
    });
    expect(accountStore.create).toHaveBeenCalledTimes(1);
    expect(accountStore.create).toHaveBeenCalledWith({
      countryId: 'us',
      apiReportId: '55',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      year: '2027',
      reformId: REFORM_ROW_ID,
      budgetWindowYears: null,
      baselineReformId: null,
    });
    expect(localStorage.getItem('pe-flagship-reports')).toBeNull();
    for (const legacyKey of LEGACY_KEYS) {
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
    expect(readReportMeta(REPORT_ROW_ID)?.title).toBe('CTC expansion');
  });

  test('given a run with a budget window then the account record keeps the window', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      windowYears: 10,
      accountReportStore: accountStore,
    });

    // Then: a reload on any device reads it back from the record
    expect(accountStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ budgetWindowYears: 10 })
    );
  });

  test('given a signed-in run then its provenance stays out of localStorage and goes on sign-out', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      accountReportStore: accountStore,
    });

    // Then: the next person on this browser cannot find it
    expect(localStorage.getItem(REPORT_META_KEY)).toBeNull();
    expect(readReportMeta(REPORT_ROW_ID)?.title).toBe('CTC expansion');
    forgetAccountReportMeta();
    expect(readReportMeta(REPORT_ROW_ID)).toBeNull();
  });

  test('given the account association fails then the signed-in run fails', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockRejectedValue(new Error('Saved work is temporarily unavailable.')),
    } as unknown as FlagshipReportStore;

    // When / Then
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        accountReportStore: accountStore,
      })
    ).rejects.toThrow('Saved work is temporarily unavailable.');
  });

  describe('given a saved report to move onto the new run', () => {
    test('then the account row is repointed, not created, and keeps its link', async () => {
      // Given
      const accountStore = {
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
      } as unknown as FlagshipReportStore;

      // When
      const link = await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: 'Hand-built',
        provisions: [PROVISION],
        currentLawId: 2,
        reformId: REFORM_ROW_ID,
        year: 2027,
        accountReportStore: accountStore,
        savedReportId: REPORT_ROW_ID,
      });

      // Then
      expect(link).toBe(REPORT_ROW_ID);
      expect(accountStore.create).not.toHaveBeenCalled();
      expect(accountStore.update).toHaveBeenCalledWith(REPORT_ROW_ID, {
        apiReportId: '55',
        provisions: [PROVISION],
        year: '2027',
      });
      expect(readReportMeta(REPORT_ROW_ID)?.provisions).toEqual([PROVISION]);
    });

    test('then a failed account update fails the run', async () => {
      // Given
      const accountStore = {
        create: vi.fn(),
        update: vi.fn().mockRejectedValue(new Error('Saved work is temporarily unavailable.')),
      } as unknown as FlagshipReportStore;

      // When / Then
      await expect(
        runFlagshipReport({
          countryId: 'us',
          title: 'CTC expansion',
          sourceNote: '',
          provisions: [PROVISION],
          currentLawId: 2,
          accountReportStore: accountStore,
          savedReportId: REPORT_ROW_ID,
        })
      ).rejects.toThrow('Saved work is temporarily unavailable.');
      expect(accountStore.create).not.toHaveBeenCalled();
    });

    test('then the browser record is repointed, and the link is the new v1 report', async () => {
      // Given
      const saved = await new LocalStorageFlagshipReportStore().create({
        countryId: 'us',
        apiReportId: '40',
        title: 'CTC expansion',
        sourceNote: 'Hand-built',
        provisions: [PROVISION],
        year: '2026',
        reformId: 'rf-local1',
      });

      // When
      const link = await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: 'Hand-built',
        provisions: [PROVISION],
        currentLawId: 2,
        reformId: 'rf-local1',
        year: 2026,
        savedReportId: saved.id,
      });

      // Then
      expect(link).toBe('55');
      const records = await new LocalStorageFlagshipReportStore().findMine();
      // The same record, dated by the new run and with no pin from the old one.
      expect(records).toEqual([
        { ...saved, apiReportId: '55', createdAt: expect.any(String), validation: null },
      ]);
      expect(records[0].createdAt >= saved.createdAt).toBe(true);
    });

    test('then a browser record that is gone fails the run', async () => {
      await expect(
        runFlagshipReport({
          countryId: 'us',
          title: 'CTC expansion',
          sourceNote: '',
          provisions: [PROVISION],
          currentLawId: 2,
          savedReportId: 'lfr-missing',
        })
      ).rejects.toThrow('Report not found');
    });
  });
});

describe('runFlagshipReport hands on the records it created', () => {
  const RUN = {
    countryId: 'us' as const,
    title: 'CTC expansion',
    sourceNote: '',
    provisions: [PROVISION],
    currentLawId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    forgetAccountReportMeta();
    // Responses queued by earlier runs are not this one's.
    mockCreateSimulation.mockReset();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: '77' } });
    // The Public API answers each create with the record as stored.
    mockCreateSimulation
      .mockResolvedValueOnce({
        result: { simulation_id: '101' },
        simulation: RUN_BASELINE_SIMULATION,
      })
      .mockResolvedValueOnce({
        result: { simulation_id: '102' },
        simulation: RUN_REFORM_SIMULATION,
      });
    mockCreateReport.mockResolvedValue(RUN_REPORT);
  });

  test('given a run then it hands on its report and simulations as the Public API answered their creation', async () => {
    // Given
    const onRecordsCreated = vi.fn();

    // When
    await runFlagshipReport({ ...RUN, onRecordsCreated });

    // Then
    expect(onRecordsCreated).toHaveBeenCalledWith({
      report: RUN_REPORT,
      simulations: [RUN_BASELINE_SIMULATION, RUN_REFORM_SIMULATION],
      savedReport: null,
    });
  });

  test('given a signed-in run then it hands on the saved report as the account answered its write', async () => {
    // Given
    const onRecordsCreated = vi.fn();
    const accountStore = {
      create: vi.fn().mockResolvedValue(RUN_SAVED_REPORT),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({ ...RUN, accountReportStore: accountStore, onRecordsCreated });

    // Then
    expect(onRecordsCreated).toHaveBeenCalledWith(
      expect.objectContaining({ savedReport: RUN_SAVED_REPORT })
    );
  });

  test('given a saved report run again then it hands on the row as the account answered its repointing', async () => {
    // Given
    const onRecordsCreated = vi.fn();
    const accountStore = {
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(RUN_SAVED_REPORT),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({
      ...RUN,
      accountReportStore: accountStore,
      savedReportId: RUN_SAVED_REPORT.id,
      onRecordsCreated,
    });

    // Then
    expect(onRecordsCreated).toHaveBeenCalledWith(
      expect.objectContaining({ savedReport: RUN_SAVED_REPORT })
    );
  });

  test('given the account write fails then nothing is handed on', async () => {
    // Given
    const onRecordsCreated = vi.fn();
    const accountStore = {
      create: vi.fn().mockRejectedValue(new Error('Saved work is temporarily unavailable.')),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({ ...RUN, accountReportStore: accountStore, onRecordsCreated }).catch(
      () => undefined
    );

    // Then
    expect(onRecordsCreated).not.toHaveBeenCalled();
  });
});

describe('createReportRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Responses queued by earlier runs are not this one's.
    mockCreateSimulation.mockReset();
    mockCreateSimulation
      .mockResolvedValueOnce({ result: { simulation_id: CALIFORNIA_BASELINE_SIMULATION_ID } })
      .mockResolvedValueOnce({ result: { simulation_id: CALIFORNIA_REFORM_SIMULATION_ID } });
    mockCreateReport.mockResolvedValue(STORED_CALIFORNIA_REPORT);
  });

  test('given a state then both simulations run on it with each policy and the base report pairs them for the year', async () => {
    // When
    await createReportRecords('us', CALIFORNIA_RECORDS_REQUEST);

    // Then
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: CALIFORNIA_REGION,
      population_type: 'geography',
      policy_id: STATE_RECORDS_BASELINE_POLICY_ID,
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
      population_id: CALIFORNIA_REGION,
      population_type: 'geography',
      policy_id: STATE_RECORDS_REFORM_POLICY_ID,
    });
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: Number(CALIFORNIA_BASELINE_SIMULATION_ID),
      simulation_2_id: Number(CALIFORNIA_REFORM_SIMULATION_ID),
      year: String(STATE_RECORDS_YEAR),
    });
  });

  test('given a stored report then it comes back with its status and output', async () => {
    // When
    const { report } = await createReportRecords('us', CALIFORNIA_RECORDS_REQUEST);

    // Then
    expect(report).toEqual(STORED_CALIFORNIA_REPORT);
  });

  test('given the simulations then they come back, the baseline first, as the Public API answered their creation', async () => {
    // Given
    mockCreateSimulation.mockReset();
    mockCreateSimulation
      .mockResolvedValueOnce({
        result: { simulation_id: '101' },
        simulation: RUN_BASELINE_SIMULATION,
      })
      .mockResolvedValueOnce({
        result: { simulation_id: '102' },
        simulation: RUN_REFORM_SIMULATION,
      });

    // When
    const { simulations } = await createReportRecords('us', CALIFORNIA_RECORDS_REQUEST);

    // Then
    expect(simulations).toEqual([RUN_BASELINE_SIMULATION, RUN_REFORM_SIMULATION]);
  });

  test('given a runner then each request goes through it', async () => {
    // Given
    let requestsThroughRunner = 0;
    const runner: ReportRecordsRunner = (request) => {
      requestsThroughRunner += 1;
      return request();
    };

    // When
    await createReportRecords('us', CALIFORNIA_RECORDS_REQUEST, runner);

    // Then
    expect(requestsThroughRunner).toBe(3);
    expect(mockCreateSimulation).toHaveBeenCalledTimes(2);
    expect(mockCreateReport).toHaveBeenCalledTimes(1);
  });

  test('given no region then the records are for the whole country', async () => {
    // When
    await createReportRecords('us', { ...CALIFORNIA_RECORDS_REQUEST, region: undefined });

    // Then
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: 'us',
      population_type: 'geography',
      policy_id: STATE_RECORDS_BASELINE_POLICY_ID,
    });
  });
});

describe('reportMetaFromRecord', () => {
  const accountRecord: FlagshipReportRecord = {
    id: 'row-1',
    countryId: 'us',
    apiReportId: '55',
    title: 'CTC expansion',
    sourceNote: 'Hand-built draft',
    provisions: [PROVISION],
    createdAt: '2026-10-14T00:00:00Z',
    budgetWindowYears: 10,
  };

  test('given the compared reform, named by the caller, then the details carry it', () => {
    const baseline = { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' };

    expect(
      reportMetaFromRecord({ ...accountRecord, baselineReformId: 'rf-plan-b' }, '2027', baseline)
        ?.baseline
    ).toEqual(baseline);
    expect(reportMetaFromRecord(accountRecord, '2027')).not.toHaveProperty('baseline');
  });

  test('given a record with a budget window then the window starts in the report year', () => {
    expect(reportMetaFromRecord(accountRecord, '2027')).toEqual({
      title: 'CTC expansion',
      sourceNote: 'Hand-built draft',
      provisions: [PROVISION],
      createdAt: '2026-10-14T00:00:00Z',
      budgetWindow: { startYear: 2027, windowSize: 10 },
    });
  });

  test('given no window, or no report year yet, then the details carry no window', () => {
    expect(
      reportMetaFromRecord({ ...accountRecord, budgetWindowYears: null }, '2027')
    ).not.toHaveProperty('budgetWindow');
    expect(reportMetaFromRecord(accountRecord, undefined)).not.toHaveProperty('budgetWindow');
  });

  test('given no record, or one without provisions, then there are no details', () => {
    expect(reportMetaFromRecord(null, '2027')).toBeNull();
    expect(reportMetaFromRecord({ ...accountRecord, provisions: [] }, '2027')).toBeNull();
  });
});
