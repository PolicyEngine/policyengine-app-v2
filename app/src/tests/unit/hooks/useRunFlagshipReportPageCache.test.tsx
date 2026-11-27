import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isAccountId } from '@/api/v2Associations';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useFlagshipReport } from '@/hooks/useFlagshipReport';
import { savedReportQueryKeys, useSharedReport } from '@/hooks/useFlagshipStores';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { FlagshipRunRecords, RunFlagshipReportArgs } from '@/libs/flagship/runReport';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { RUN_PROVISIONS } from '@/tests/fixtures/hooks/useRunFlagshipReportMocks';
import {
  EARLIER_REPORT,
  EARLIER_ROW,
  policyAnswer,
  RUN_API_REPORT_ID,
  RUN_POLICY_IDS,
  RUN_ROW,
  RUN_ROW_ID,
  RUN_ROW_WITH_SAVED_BASELINE,
  RUN_SIMULATION_IDS,
  runRecords,
  SAVED_BASELINE_REFORM,
  sharedItemOf,
  SIMULATION_WITHOUT_POPULATION,
  simulationAnswer,
} from '@/tests/fixtures/hooks/useRunFlagshipReportPageCacheMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import { RUN_BASELINE_SIMULATION, RUN_REPORT } from '@/tests/fixtures/libs/flagship/runReportMocks';

const mockRunFlagshipReport = vi.fn();
const mockFetchReportById = vi.fn();
const mockFetchSimulationById = vi.fn();
const mockFetchPolicyById = vi.fn();
const mockFetchSharedReport = vi.fn();

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  runFlagshipReport: (...args: unknown[]) => mockRunFlagshipReport(...args),
}));

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: (...args: unknown[]) => mockFetchReportById(...args),
}));

vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: (...args: unknown[]) => mockFetchSimulationById(...args),
}));

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

vi.mock('@/api/sharedReport', () => ({
  fetchSharedReport: (...args: unknown[]) => mockFetchSharedReport(...args),
}));

/** Sign-in off: the run records in this browser, and its link is the v1 report's number. */
const signInOff = () => makeAuthValue({ status: 'disabled' });

/** A run that creates `records` and answers `link`. */
function runCreating(records: FlagshipRunRecords, link: string) {
  mockRunFlagshipReport.mockImplementation(async (args: RunFlagshipReportArgs) => {
    args.onRecordsCreated?.(records);
    return link;
  });
}

/**
 * What the report page reads for its link, as Report.page does: a saved
 * report's link (an account row's ID) names its v1 report through the
 * shared read; without accounts the link is the v1 report's number.
 */
function useReportPageReads(link: string) {
  const sharedLink = isAccountId(link);
  const shared = useSharedReport(sharedLink ? link : undefined);
  const flagship = useFlagshipReport((sharedLink ? shared.data?.record.apiReportId : link) ?? '');
  return { shared, flagship };
}

/** A session on one query cache: the run's hook, and the report page opened on a link. */
function session(auth: AuthContextValue, push = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <CountryProvider value="us">
          <AuthTestProvider value={auth}>
            <NavigationProvider value={{ push, replace: vi.fn(), back: vi.fn() }}>
              {children}
            </NavigationProvider>
          </AuthTestProvider>
        </CountryProvider>
      </ReduxProvider>
    </QueryClientProvider>
  );
  const runHook = renderHook(() => useRunFlagshipReport(), { wrapper });
  return {
    queryClient,
    runHook,
    openPage: (link: string) => renderHook(() => useReportPageReads(link), { wrapper }),
    /** Runs the reform, as "Save and run" does. */
    run: async (options: Parameters<typeof runHook.result.current.run>[5] = {}) => {
      await act(async () => {
        await runHook.result.current.run(
          'CTC expansion',
          'Hand-built draft',
          RUN_PROVISIONS,
          null,
          2026,
          options
        );
      });
    },
  };
}

/** The page's reads once the policies are checked: the calculation may then start. */
async function pageReadyToCalculate(page: ReturnType<ReturnType<typeof session>['openPage']>) {
  await waitFor(() => expect(page.result.current.flagship.policiesChecked).toBe(true));
  return page.result.current;
}

/** The page opened on `link` in a session that never ran it: every read goes to the API. */
async function readBack(link: string, auth: AuthContextValue) {
  return pageReadyToCalculate(session(auth).openPage(link));
}

describe('the report page a run opens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeductionMetadata();
    // The Public API answers a read with the record as its create answered it.
    mockFetchReportById.mockImplementation(async (_country: string, reportId: string) =>
      reportId === String(EARLIER_REPORT.id) ? EARLIER_REPORT : RUN_REPORT
    );
    mockFetchSimulationById.mockImplementation(async (_country: string, simulationId: string) =>
      simulationAnswer(simulationId)
    );
    mockFetchPolicyById.mockImplementation(async (_country: string, policyId: string) =>
      policyAnswer(policyId)
    );
    mockFetchSharedReport.mockResolvedValue(sharedItemOf(RUN_ROW));
  });

  describe('without accounts', () => {
    test('given a run then its page reads neither the report nor its simulations back', async () => {
      // Given
      runCreating(runRecords(null), RUN_API_REPORT_ID);
      const { run, openPage } = session(signInOff());

      // When
      await run();
      await pageReadyToCalculate(openPage(RUN_API_REPORT_ID));

      // Then
      expect(mockFetchReportById).not.toHaveBeenCalled();
      expect(mockFetchSimulationById).not.toHaveBeenCalled();
    });

    test('given a run then its page has the report and simulations as reading them back gives them', async () => {
      // Given
      runCreating(runRecords(null), RUN_API_REPORT_ID);
      const expected = await readBack(RUN_API_REPORT_ID, signInOff());
      const { run, openPage } = session(signInOff());

      // When
      await run();
      const page = await pageReadyToCalculate(openPage(RUN_API_REPORT_ID));

      // Then
      expect(page.flagship.report).toEqual(expected.flagship.report);
      expect(page.flagship.simulations).toEqual(expected.flagship.simulations);
    });

    test('given a run then its page still reads its policies, for the parameters they set that the model no longer has', async () => {
      // Given
      runCreating(runRecords(null), RUN_API_REPORT_ID);
      const { run, openPage } = session(signInOff());

      // When
      await run();
      await pageReadyToCalculate(openPage(RUN_API_REPORT_ID));

      // Then
      for (const policyId of RUN_POLICY_IDS) {
        expect(mockFetchPolicyById).toHaveBeenCalledWith('us', policyId);
      }
    });

    test('given a saved report run again then its page reads neither the report nor its simulations back', async () => {
      // Given
      runCreating(runRecords(null), RUN_API_REPORT_ID);
      const { run, openPage } = session(signInOff());

      // When
      await run({ savedReportId: 'lfr-earlier' });
      await pageReadyToCalculate(openPage(RUN_API_REPORT_ID));

      // Then
      expect(mockFetchReportById).not.toHaveBeenCalled();
      expect(mockFetchSimulationById).not.toHaveBeenCalled();
    });

    test('given a simulation the page could not read then the run still opens its report', async () => {
      // Given
      runCreating(
        runRecords(null, [RUN_BASELINE_SIMULATION, SIMULATION_WITHOUT_POPULATION]),
        RUN_API_REPORT_ID
      );
      const push = vi.fn();
      const { run, runHook } = session(signInOff(), push);

      // When
      await run();

      // Then
      expect(push).toHaveBeenCalledWith(`/us/report/${RUN_API_REPORT_ID}`);
      expect(runHook.result.current.error).toBeNull();
    });

    test('given a simulation the page could not read then its page reads the report and its simulations itself', async () => {
      // Given
      runCreating(
        runRecords(null, [RUN_BASELINE_SIMULATION, SIMULATION_WITHOUT_POPULATION]),
        RUN_API_REPORT_ID
      );
      const { run, openPage } = session(signInOff());

      // When
      await run();
      await pageReadyToCalculate(openPage(RUN_API_REPORT_ID));

      // Then
      expect(mockFetchReportById).toHaveBeenCalledWith('us', RUN_API_REPORT_ID);
      for (const simulationId of RUN_SIMULATION_IDS) {
        expect(mockFetchSimulationById).toHaveBeenCalledWith('us', simulationId);
      }
    });
  });

  describe('with accounts', () => {
    test('given a run then its page reads none of the saved report, the report or its simulations back', async () => {
      // Given
      runCreating(runRecords(RUN_ROW), RUN_ROW_ID);
      const { run, openPage } = session(signedInAuthValue());

      // When
      await run();
      await pageReadyToCalculate(openPage(RUN_ROW_ID));

      // Then
      expect(mockFetchSharedReport).not.toHaveBeenCalled();
      expect(mockFetchReportById).not.toHaveBeenCalled();
      expect(mockFetchSimulationById).not.toHaveBeenCalled();
    });

    test('given a run then its page has the saved report as its shared read gives it', async () => {
      // Given
      runCreating(runRecords(RUN_ROW), RUN_ROW_ID);
      const expected = await readBack(RUN_ROW_ID, signedInAuthValue());
      const { run, openPage } = session(signedInAuthValue());

      // When
      await run();
      const page = await pageReadyToCalculate(openPage(RUN_ROW_ID));

      // Then
      expect(page.shared.data).toEqual(expected.shared.data);
    });

    test('given a saved report run again from elsewhere then its page reads none of the saved report, the report or its simulations back', async () => {
      // Given: its page was open earlier, on the run before
      runCreating(runRecords(RUN_ROW), RUN_ROW_ID);
      const { run, openPage, queryClient } = session(signedInAuthValue());
      queryClient.setQueryData([...savedReportQueryKeys.shared, 'us', RUN_ROW_ID], {
        record: { apiReportId: String(EARLIER_REPORT.id) },
        baselineReform: null,
      });

      // When
      await run({ savedReportId: RUN_ROW_ID });
      const page = await pageReadyToCalculate(openPage(RUN_ROW_ID));

      // Then
      expect(page.flagship.report?.id).toBe(RUN_API_REPORT_ID);
      expect(mockFetchSharedReport).not.toHaveBeenCalled();
      expect(mockFetchReportById).not.toHaveBeenCalled();
      expect(mockFetchSimulationById).not.toHaveBeenCalled();
    });

    test('given a saved report run again on its own page then the page shows the new run before its saved report is read again', async () => {
      // Given: the page shows the saved report's run before
      mockFetchSharedReport.mockResolvedValueOnce(sharedItemOf(EARLIER_ROW));
      const { run, openPage } = session(signedInAuthValue());
      const page = openPage(RUN_ROW_ID);
      await waitFor(() =>
        expect(page.result.current.flagship.report?.id).toBe(String(EARLIER_REPORT.id))
      );
      // Read again once the run moves the saved report on, it has not answered yet.
      let answerSharedRead!: (item: unknown) => void;
      mockFetchSharedReport.mockReturnValueOnce(
        new Promise((resolve) => {
          answerSharedRead = resolve;
        })
      );
      runCreating(runRecords(RUN_ROW), RUN_ROW_ID);

      // When
      await run({ savedReportId: RUN_ROW_ID, currentLink: RUN_ROW_ID });

      // Then
      await waitFor(() => expect(page.result.current.flagship.report?.id).toBe(RUN_API_REPORT_ID));
      expect(mockFetchReportById).not.toHaveBeenCalledWith('us', RUN_API_REPORT_ID);
      for (const simulationId of RUN_SIMULATION_IDS) {
        expect(mockFetchSimulationById).not.toHaveBeenCalledWith('us', simulationId);
      }
      await act(async () => answerSharedRead(sharedItemOf(RUN_ROW)));
    });

    test('given a report compared with a saved reform then its page reads the saved report, which names that reform', async () => {
      // Given
      mockFetchSharedReport.mockResolvedValue(
        sharedItemOf(RUN_ROW_WITH_SAVED_BASELINE, SAVED_BASELINE_REFORM)
      );
      runCreating(runRecords(RUN_ROW_WITH_SAVED_BASELINE), RUN_ROW_ID);
      const { run, openPage } = session(signedInAuthValue());

      // When
      await run();
      const page = await pageReadyToCalculate(openPage(RUN_ROW_ID));

      // Then
      expect(page.shared.data?.baselineReform).toEqual(SAVED_BASELINE_REFORM);
      expect(mockFetchSharedReport).toHaveBeenCalledTimes(1);
    });

    test('given a report compared with a saved reform then its page reads neither the report nor its simulations back', async () => {
      // Given
      mockFetchSharedReport.mockResolvedValue(
        sharedItemOf(RUN_ROW_WITH_SAVED_BASELINE, SAVED_BASELINE_REFORM)
      );
      runCreating(runRecords(RUN_ROW_WITH_SAVED_BASELINE), RUN_ROW_ID);
      const { run, openPage } = session(signedInAuthValue());

      // When
      await run();
      await pageReadyToCalculate(openPage(RUN_ROW_ID));

      // Then
      expect(mockFetchReportById).not.toHaveBeenCalled();
      expect(mockFetchSimulationById).not.toHaveBeenCalled();
    });
  });
});
