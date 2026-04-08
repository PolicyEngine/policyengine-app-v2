import { useContext, useEffect, useRef } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { markReportCompleted } from '@/api/report';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import { calculationKeys, reportKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type {
  BudgetWindowAnnualImpact,
  BudgetWindowReportOutput,
} from '@/types/report/BudgetWindowReportOutput';
import { parseReportTiming } from '@/utils/reportTiming';
import {
  extractBudgetWindowAnnualImpact,
  isBudgetWindowReportOutput,
  sumBudgetWindowAnnualImpacts,
} from '../budget-window/budgetWindowUtils';

const POLL_INTERVAL_MS = 1000;

interface UseBudgetWindowCalculationParams {
  enabled: boolean;
  report?: Report;
  simulations?: Simulation[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useBudgetWindowCalculation({
  enabled,
  report,
  simulations,
}: UseBudgetWindowCalculationParams): void {
  const queryClient = useContext(QueryClientContext);
  const runIdRef = useRef(0);
  const reportId = report?.id;
  const reportYear = report?.year;
  const reportCountryId = report?.countryId;
  const reportOutput = report?.output;
  const simulationIdsKey = report?.simulationIds?.join('|') || '';
  const reportApiVersion = report?.apiVersion ?? null;
  const baselinePolicyId = simulations?.[0]?.policyId;
  const reformPolicyId = simulations?.[1]?.policyId || baselinePolicyId;
  const region = simulations?.[0]?.populationId || reportCountryId;

  useEffect(() => {
    if (
      !enabled ||
      !queryClient ||
      !report ||
      !reportId ||
      !reportYear ||
      !reportCountryId ||
      !baselinePolicyId
    ) {
      return;
    }

    const queryKey = calculationKeys.byReportId(reportId);
    const existing = queryClient.getQueryData<CalcStatus>(queryKey);

    if (existing?.status === 'complete') {
      return;
    }

    if (isBudgetWindowReportOutput(reportOutput)) {
      queryClient.setQueryData<CalcStatus>(queryKey, {
        status: 'complete',
        result: reportOutput,
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });
      return;
    }

    runIdRef.current += 1;
    const currentRunId = runIdRef.current;
    const timing = parseReportTiming(reportYear, reportCountryId);
    const years = Array.from({ length: timing.windowSize }, (_, index) =>
      String(Number.parseInt(timing.startYear, 10) + index)
    );
    const effectiveReformPolicyId = reformPolicyId || baselinePolicyId;
    const effectiveRegion = region || reportCountryId;

    const metadata = {
      calcId: reportId,
      calcType: 'societyWide' as const,
      targetType: 'report' as const,
      startedAt: Date.now(),
    };

    const setStatus = (status: CalcStatus) => {
      if (runIdRef.current !== currentRunId) {
        return;
      }

      queryClient.setQueryData<CalcStatus>(queryKey, status);
    };

    void (async () => {
      try {
        const annualImpacts: BudgetWindowAnnualImpact[] = [];

        for (let index = 0; index < years.length; index += 1) {
          const year = years[index];
          const stepNumber = index + 1;

          setStatus({
            status: 'pending',
            progress: Math.round((index / years.length) * 100),
            message: `Scoring ${year} (${stepNumber} of ${years.length})...`,
            metadata,
          });

          while (true) {
            const response = await fetchSocietyWideCalculation(
              reportCountryId,
              effectiveReformPolicyId,
              baselinePolicyId,
              {
                region: effectiveRegion,
                time_period: year,
              }
            );

            if (runIdRef.current !== currentRunId) {
              return;
            }

            if (response.status === 'ok' && response.result) {
              annualImpacts.push(extractBudgetWindowAnnualImpact(year, response.result));
              break;
            }

            if (response.status === 'error') {
              throw new Error(response.error || `Budget-window calculation failed for ${year}`);
            }

            setStatus({
              status: 'pending',
              progress: Math.round(((index + 0.5) / years.length) * 100),
              message: `Scoring ${year} (${stepNumber} of ${years.length})...`,
              queuePosition: response.queue_position,
              metadata,
            });

            await sleep(POLL_INTERVAL_MS);
          }
        }

        const result: BudgetWindowReportOutput = {
          kind: 'budgetWindow',
          startYear: timing.startYear,
          endYear: timing.endYear,
          windowSize: timing.windowSize,
          annualImpacts,
          totals: sumBudgetWindowAnnualImpacts(annualImpacts),
        };
        const simulationIds = simulationIdsKey ? simulationIdsKey.split('|') : [];

        const completedReport: Report = {
          id: reportId,
          countryId: reportCountryId,
          year: reportYear,
          apiVersion: reportApiVersion,
          simulationIds,
          status: 'complete',
          output: result,
        };

        await markReportCompleted(reportCountryId, reportId, completedReport);

        if (runIdRef.current !== currentRunId) {
          return;
        }

        queryClient.setQueryData(reportKeys.byId(reportId), completedReport);
        setStatus({
          status: 'complete',
          result,
          metadata,
        });
      } catch (error) {
        if (runIdRef.current !== currentRunId) {
          return;
        }

        setStatus({
          status: 'error',
          error: {
            code: 'BUDGET_WINDOW_CALC_ERROR',
            message: error instanceof Error ? error.message : 'Budget-window calculation failed',
            retryable: true,
          },
          metadata,
        });
      }
    })();

    return () => {
      if (runIdRef.current === currentRunId) {
        runIdRef.current += 1;
      }
    };
  }, [
    baselinePolicyId,
    enabled,
    queryClient,
    reformPolicyId,
    region,
    reportApiVersion,
    reportCountryId,
    reportId,
    reportOutput,
    reportYear,
    simulationIdsKey,
  ]);
}
