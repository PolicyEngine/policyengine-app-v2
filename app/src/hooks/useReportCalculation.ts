import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEconomyCalculation } from './useEconomyCalculation';
import { useHouseholdCalculation } from './useHouseholdCalculation';
import { markReportCompleted, markReportError } from '@/api/report';
import { Report } from '@/types/ingredients/Report';
import { Household } from '@/types/ingredients/Household';
import { EconomyReportOutput, EconomyCalculationParams } from '@/api/economy';
import { countryIds } from '@/libs/countries';

export type ReportType = 'society' | 'household';

export interface CalculationProgress {
  status: 'pending' | 'running' | 'completed' | 'error';
  queuePosition?: number;
  estimatedTime?: number;
  progress?: number;
  error?: string;
}

interface BaseReportCalculationOptions {
  reportType: ReportType;
  countryId: (typeof countryIds)[number];
  reportId?: string;
  enabled?: boolean;
  onSuccess?: (data: EconomyReportOutput | Household) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: CalculationProgress) => void;
}

interface SocietyWideOptions extends BaseReportCalculationOptions {
  reportType: 'society';
  reformPolicyId: string;
  baselinePolicyId: string;
  economyParams?: EconomyCalculationParams;
}

interface HouseholdOptions extends BaseReportCalculationOptions {
  reportType: 'household';
  householdId: string;
  baselinePolicyId: string;
  reformPolicyId?: string; // Optional for baseline-only reports
}

export type UseReportCalculationOptions = SocietyWideOptions | HouseholdOptions;

/**
 * Unified hook for managing both society-wide and household report calculations.
 *
 * This hook orchestrates the appropriate calculation type based on reportType,
 * handles progress tracking, and updates report status on completion/error.
 *
 * @example
 * // Society-wide calculation
 * const calculation = useReportCalculation({
 *   reportType: 'society',
 *   countryId: 'us',
 *   reformPolicyId: 'reform-123',
 *   baselinePolicyId: 'baseline-456',
 *   reportId: 'report-789',
 *   onSuccess: (data) => console.log('Completed', data),
 *   onError: (error) => console.error('Failed', error),
 *   onProgress: (progress) => console.log('Progress', progress)
 * });
 *
 * @example
 * // Household calculation
 * const calculation = useReportCalculation({
 *   reportType: 'household',
 *   countryId: 'us',
 *   householdId: 'household-123',
 *   baselinePolicyId: 'baseline-456',
 *   reformPolicyId: 'reform-789', // Optional
 *   reportId: 'report-abc',
 *   onSuccess: (data) => console.log('Completed', data),
 *   onError: (error) => console.error('Failed', error),
 *   onProgress: (progress) => console.log('Progress', progress)
 * });
 */
export function useReportCalculation(options: UseReportCalculationOptions) {
  const { countryId, reportId, enabled = true, onSuccess, onError, onProgress } = options;

  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress>({
    status: 'pending'
  });
  const [hasCompletedCalculation, setHasCompletedCalculation] = useState(false);
  const hasHandledCompletionRef = useRef(false);

  // Handle report status update
  const updateReportStatus = useCallback(async (
    status: 'complete' | 'error',
    output: EconomyReportOutput | Household | null
  ) => {
    if (!reportId) return;

    try {
      const report: Report = {
        reportId,
        countryId: countryId as (typeof countryIds)[number],
        status,
        output: output as any, // Type will be resolved based on context
        simulationIds: [],
        apiVersion: null,
      };

      if (status === 'complete') {
        await markReportCompleted(countryId as (typeof countryIds)[number], reportId, report);
      } else {
        await markReportError(countryId as (typeof countryIds)[number], reportId, report);
      }
    } catch (error) {
      console.error(`Failed to update report ${status} status:`, error);
    }
  }, [countryId, reportId]);

  // Society-wide calculation
  const economyCalculation = useEconomyCalculation({
    countryId,
    reformPolicyId: options.reportType === 'society' ? options.reformPolicyId : '',
    baselinePolicyId: options.reportType === 'society' ? options.baselinePolicyId : '',
    params: options.reportType === 'society' ? options.economyParams : undefined,
    enabled: enabled && options.reportType === 'society' && !hasCompletedCalculation,
    onSuccess: useCallback(async (data: EconomyReportOutput) => {
      if (!hasHandledCompletionRef.current) {
        hasHandledCompletionRef.current = true;
        setCalculationProgress({ status: 'completed', progress: 100 });
        await updateReportStatus('complete', data);
        setHasCompletedCalculation(true);
        onSuccess?.(data);
      }
    }, [updateReportStatus, onSuccess]),
    onError: useCallback(async (error: Error) => {
      setCalculationProgress({ status: 'error', error: error.message });
      await updateReportStatus('error', null);
      onError?.(error);
    }, [updateReportStatus, onError]),
    onQueueUpdate: useCallback((position: number, averageTime?: number) => {
      // Progress calculation matching ReportCalculationFrame logic
      let calculatedProgress: number;
      if (position === 0) {
        const baseProgress = 20;
        const processingProgress = 70;
        calculatedProgress = averageTime && averageTime > 0
          ? baseProgress + Math.min(processingProgress, (processingProgress / 2))
          : 40;
      } else if (position <= 3) {
        calculatedProgress = 20 - (position * 2);
      } else {
        calculatedProgress = Math.max(5, 14 - position);
      }

      const progress: CalculationProgress = {
        status: 'running',
        queuePosition: position,
        estimatedTime: averageTime,
        progress: calculatedProgress
      };
      setCalculationProgress(progress);
      onProgress?.(progress);
    }, [onProgress])
  });

  // Household calculations (baseline and potentially reform)
  const isHouseholdCalculation = options.reportType === 'household';
  const householdId = isHouseholdCalculation ? options.householdId : '';
  const baselinePolicyId = options.baselinePolicyId;
  const reformPolicyId = isHouseholdCalculation ? options.reformPolicyId : undefined;
  const isBaselineOnly = !reformPolicyId || reformPolicyId === baselinePolicyId;

  const baselineHouseholdCalc = useHouseholdCalculation({
    countryId,
    householdId,
    policyId: baselinePolicyId,
    enabled: enabled && isHouseholdCalculation && !!householdId && !hasCompletedCalculation,
    onSuccess: useCallback(() => {
      // Progress update will be handled in effect below
    }, []),
    onError: useCallback(async (error: Error) => {
      setCalculationProgress({ status: 'error', error: error.message });
      await updateReportStatus('error', null);
      onError?.(error);
    }, [updateReportStatus, onError])
  });

  const reformHouseholdCalc = useHouseholdCalculation({
    countryId,
    householdId,
    policyId: reformPolicyId || '',
    enabled: enabled && isHouseholdCalculation && !!householdId && !isBaselineOnly && !hasCompletedCalculation,
    onSuccess: useCallback(() => {
      // Progress update will be handled in effect below
    }, []),
    onError: useCallback(async (error: Error) => {
      setCalculationProgress({ status: 'error', error: error.message });
      await updateReportStatus('error', null);
      onError?.(error);
    }, [updateReportStatus, onError])
  });

  // Handle household calculation completion
  useEffect(() => {
    if (isHouseholdCalculation && !hasCompletedCalculation && !hasHandledCompletionRef.current) {
      const baselineComplete = baselineHouseholdCalc.data && !baselineHouseholdCalc.isLoading;
      const reformComplete = isBaselineOnly ||
        (reformHouseholdCalc.data && !reformHouseholdCalc.isLoading);

      if (baselineComplete && reformComplete) {
        hasHandledCompletionRef.current = true;
        setCalculationProgress({ status: 'completed', progress: 100 });

        // Return the appropriate household data
        const householdOutput: Household = isBaselineOnly
          ? baselineHouseholdCalc.data
          : (reformHouseholdCalc.data || baselineHouseholdCalc.data);

        updateReportStatus('complete', householdOutput).then(() => {
          setHasCompletedCalculation(true);
          onSuccess?.(householdOutput);
        });
      } else if (baselineComplete) {
        // Update progress for partial completion
        const progress = isBaselineOnly ? 100 : 50;
        const progressUpdate: CalculationProgress = {
          status: 'running',
          progress
        };
        setCalculationProgress(progressUpdate);
        onProgress?.(progressUpdate);
      } else if (baselineHouseholdCalc.isLoading || reformHouseholdCalc.isLoading) {
        // Initial loading state
        const progressUpdate: CalculationProgress = {
          status: 'running',
          progress: 10
        };
        setCalculationProgress(progressUpdate);
        onProgress?.(progressUpdate);
      }
    }
  }, [
    isHouseholdCalculation,
    baselineHouseholdCalc.data,
    baselineHouseholdCalc.isLoading,
    reformHouseholdCalc.data,
    reformHouseholdCalc.isLoading,
    isBaselineOnly,
    hasCompletedCalculation,
    updateReportStatus,
    onSuccess,
    onProgress
  ]);

  // Retry function
  const retry = useCallback(() => {
    setCalculationProgress({ status: 'pending' });
    setHasCompletedCalculation(false);
    hasHandledCompletionRef.current = false;

    if (options.reportType === 'society') {
      economyCalculation.retry();
    } else {
      baselineHouseholdCalc.retry();
      if (!isBaselineOnly) {
        reformHouseholdCalc.retry();
      }
    }
  }, [options.reportType, economyCalculation, baselineHouseholdCalc, reformHouseholdCalc, isBaselineOnly]);

  // Determine overall loading state
  const isLoading = useMemo(() => {
    if (options.reportType === 'society') {
      return economyCalculation.isLoading || economyCalculation.isPending;
    }
    return baselineHouseholdCalc.isLoading ||
           (!isBaselineOnly && reformHouseholdCalc.isLoading);
  }, [
    options.reportType,
    economyCalculation.isLoading,
    economyCalculation.isPending,
    baselineHouseholdCalc.isLoading,
    reformHouseholdCalc.isLoading,
    isBaselineOnly
  ]);

  // Get the result data
  const result = useMemo(() => {
    if (options.reportType === 'society') {
      return economyCalculation.result;
    }
    if (isBaselineOnly) {
      return baselineHouseholdCalc.household;
    }
    // For household comparison, return the reform result if available
    return reformHouseholdCalc.household || baselineHouseholdCalc.household;
  }, [
    options.reportType,
    economyCalculation.result,
    baselineHouseholdCalc.household,
    reformHouseholdCalc.household,
    isBaselineOnly
  ]);

  return {
    // Progress state
    calculationProgress,
    isLoading,
    isCompleted: calculationProgress.status === 'completed',
    isErrored: calculationProgress.status === 'error',

    // Result data
    result,

    // Specific calculation data (for advanced use cases)
    economyCalculation: options.reportType === 'society' ? economyCalculation : null,
    baselineHouseholdCalc: options.reportType === 'household' ? baselineHouseholdCalc : null,
    reformHouseholdCalc: options.reportType === 'household' && !isBaselineOnly ? reformHouseholdCalc : null,

    // Actions
    retry,

    // Metadata
    reportType: options.reportType,
    isBaselineOnly
  };
}