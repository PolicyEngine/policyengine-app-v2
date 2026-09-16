import { QueryClient } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import { markReportError } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { HouseholdReportOrchestrator } from '@/libs/calculations/household/HouseholdReportOrchestrator';
import { calculationKeys } from '@/libs/queryKeys';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import {
  CORRECTIVE_SPM_ERRORS,
  FAILED_SPM_REPORT,
  failedSimulationMetadata,
  OTHER_CALCULATION_ERROR,
} from '@/tests/fixtures/spm/reportErrorMocks';
import type { CalcStatus } from '@/types/calculation';
import type { SimulationSetOutputPayload } from '@/types/payloads';

vi.mock('@/api/report', () => ({
  markReportCompleted: vi.fn(),
  markReportError: vi.fn(),
}));

// Reopening the report should only render the stored simulations. The calculation
// below uses the real orchestrator, calculator, HTTP API, and persistence adapter.
vi.mock('@/pages/report-output/useHouseholdCalculations', () => ({
  useHouseholdCalculations: vi.fn(),
}));
vi.mock('@/hooks/household', () => ({
  useSimulationProgressDisplay: () => ({
    displayProgress: 0,
    hasCalcStatus: false,
    message: null,
  }),
}));

describe('Saved household report SPM errors', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (HouseholdReportOrchestrator as unknown as { instance: null }).instance = null;
  });

  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
    (HouseholdReportOrchestrator as unknown as { instance: null }).instance = null;
  });

  test.each(CORRECTIVE_SPM_ERRORS)(
    'given $code then persistence and reopening retain the corrective message, other failures, and household recovery',
    async (apiError) => {
      const saved = new Map<string, SimulationSetOutputPayload>();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);
          if (url.endsWith('/household/201/policy/1')) {
            return new Response(JSON.stringify({ errors: [apiError] }), { status: 400 });
          }
          if (url.endsWith('/household/202/policy/2')) {
            return new Response(JSON.stringify({ message: OTHER_CALCULATION_ERROR }), {
              status: 503,
            });
          }
          if (init?.method === 'PATCH' && url.endsWith('/simulation')) {
            const payload = JSON.parse(String(init.body)) as SimulationSetOutputPayload;
            saved.set(String(payload.id), payload);
            return new Response(
              JSON.stringify({ status: 'ok', result: failedSimulationMetadata(payload) })
            );
          }
          const id = url.split('/').at(-1)!;
          if (init?.method === 'GET' && saved.has(id)) {
            return new Response(
              JSON.stringify({ status: 'ok', result: failedSimulationMetadata(saved.get(id)!) })
            );
          }
          throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`);
        })
      );

      const orchestrator = HouseholdReportOrchestrator.getInstance(queryClient);
      await orchestrator.startReport({
        reportId: FAILED_SPM_REPORT.id!,
        countryId: 'us',
        report: { ...FAILED_SPM_REPORT, status: 'pending' },
        simulationConfigs: [
          { simulationId: '101', populationId: '201', policyId: '1' },
          { simulationId: '102', populationId: '202', policyId: '2' },
        ],
      });
      await waitFor(() => {
        expect(saved.size).toBe(2);
        expect(markReportError).toHaveBeenCalled();
      });

      expect(saved.get('101')).toEqual({
        id: 101,
        status: 'error',
        output: null,
        error_message: `[${apiError.code}] ${apiError.message}`,
      });
      expect(
        queryClient.getQueryData<CalcStatus>(calculationKeys.bySimulationId('101'))?.error
      ).toEqual({ ...apiError, retryable: false });
      expect(
        queryClient.getQueryData<CalcStatus>(calculationKeys.bySimulationId('102'))?.error
      ).toEqual({
        code: 'HOUSEHOLD_CALC_FAILED',
        message: OTHER_CALCULATION_ERROR,
        retryable: true,
      });

      // Simulate reopening after transient calculation state has been discarded.
      queryClient.clear();
      const simulations = await Promise.all(
        FAILED_SPM_REPORT.simulationIds.map(async (id) =>
          SimulationAdapter.fromMetadata(await fetchSimulationById('us', id))
        )
      );
      expect(simulations[0]).toMatchObject({
        errorCode: apiError.code,
        errorMessage: apiError.message,
        status: 'error',
      });

      const onEditHousehold = vi.fn();
      render(
        <HouseholdReportOutput
          report={FAILED_SPM_REPORT}
          simulations={simulations}
          isLoading={false}
          error={null}
          onEditHousehold={onEditHousehold}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(apiError.code);
      expect(alert).toHaveTextContent(apiError.message);
      expect(alert).toHaveTextContent(OTHER_CALCULATION_ERROR);
      expect(screen.getByText(/Open report setup, choose Edit report/)).toBeVisible();
      if (apiError.code === 'SPM_YEAR_UNAVAILABLE') {
        expect(screen.getByText(/select a year supported by the SPM artifact/)).toBeVisible();
        expect(
          screen.queryByRole('button', { name: 'Choose SPM settings again' })
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Edit household inputs' })
        ).not.toBeInTheDocument();
      }
      await userEvent.setup().click(
        screen.getByRole('button', {
          name:
            apiError.code === 'SPM_YEAR_UNAVAILABLE' ? 'Edit report year' : 'Edit household inputs',
        })
      );
      expect(onEditHousehold).toHaveBeenCalledOnce();
    }
  );
});
