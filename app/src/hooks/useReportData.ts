import { useQueryClient } from '@tanstack/react-query';
import { EconomyReportOutput } from '@/api/economy';
import { CalculationMeta } from '@/api/reportCalculations';
import { Household, HouseholdData } from '@/types/ingredients/Household';
import { useReportOutput } from './useReportOutput';
import { useUserReportById } from './useUserReports';

/**
 * Type discriminator for output types
 */
export type ReportOutputType = 'household' | 'economy';

/**
 * Return type for useReportData hook
 */
export interface ReportDataResult {
  status: 'pending' | 'complete' | 'error';
  output: EconomyReportOutput | Household | null | undefined;
  outputType: ReportOutputType | undefined;
  error: Error | null | undefined;
  normalizedReport: { report: any };
  userReport: any;
  progress: number | undefined;
  message: string | undefined;
  queuePosition: number | undefined;
  estimatedTimeRemaining: number | undefined;
}

/**
 * Constant return values for common states
 */
const ERROR_PROPS: ReportDataResult = {
  status: 'error',
  output: null,
  outputType: undefined,
  error: new Error('Report not found'),
  normalizedReport: { report: undefined },
  userReport: undefined,
  progress: undefined,
  message: undefined,
  queuePosition: undefined,
  estimatedTimeRemaining: undefined,
};

const LOADING_PROPS: ReportDataResult = {
  status: 'pending',
  output: null,
  outputType: undefined,
  error: undefined,
  normalizedReport: { report: undefined },
  userReport: undefined,
  progress: undefined,
  message: 'Loading report...',
  queuePosition: undefined,
  estimatedTimeRemaining: undefined,
};

/**
 * Progress information for pending reports
 */
interface ProgressInfo {
  progress: number | undefined;
  message: string | undefined;
  queuePosition: number | undefined;
  estimatedTimeRemaining: number | undefined;
}

/**
 * Extract progress information from pending report result
 */
function getProgressInfo(result: any): ProgressInfo {
  return {
    progress: result.progress,
    message: result.message,
    queuePosition: result.queuePosition,
    estimatedTimeRemaining: result.estimatedTimeRemaining,
  };
}

/**
 * Hook to fetch and manage report output data
 * Uses the new unified useUserReportById hook that fetches everything from userReportId
 *
 * @param userReportId - The ID of the UserReport to fetch
 * @returns Report data including status, output, and metadata
 */
export function useReportData(userReportId: string): ReportDataResult {
  const queryClient = useQueryClient();

  // Step 1: Fetch complete normalized report structure (includes UserReport, base Report, etc.)
  const normalizedReport = useUserReportById(userReportId);

  // Extract data from normalized report
  const {
    userReport,
    report,
    isLoading: normalizedLoading,
    error: normalizedError,
  } = normalizedReport;
  const baseReportId = report?.id;

  // Step 2: Fetch report output using base reportId
  // This hook must be called unconditionally to comply with Rules of Hooks
  const reportOutputResult = useReportOutput({
    reportId: baseReportId || '',
    enabled: !!baseReportId, // Only enable when we have a valid base report ID
  });

  // Step 3: Handle loading and error states
  if (normalizedLoading) {
    return LOADING_PROPS;
  }

  if (!userReport || !baseReportId) {
    return {
      ...ERROR_PROPS,
      error: normalizedError || ERROR_PROPS.error,
    };
  }

  // Step 4: Process the report output result
  const { status, data, error } = reportOutputResult;

  // Extract progress information if status is pending
  const progressInfo: ProgressInfo =
    status === 'pending'
      ? getProgressInfo(reportOutputResult)
      : {
          progress: undefined,
          message: undefined,
          queuePosition: undefined,
          estimatedTimeRemaining: undefined,
        };

  // Determine output type from cached metadata
  const metadata = queryClient.getQueryData<CalculationMeta>(['calculation-meta', baseReportId]);
  const outputType: ReportOutputType | undefined = metadata?.type;

  // Wrap household data in Household structure
  // The API returns raw HouseholdData, but components expect the Household wrapper
  let output: EconomyReportOutput | Household | null | undefined = data;

  if (outputType === 'household' && data) {
    const wrappedOutput: Household = {
      id: baseReportId,
      countryId: metadata?.countryId!,
      householdData: data as HouseholdData,
    };
    output = wrappedOutput;
  }

  return {
    status,
    output,
    outputType,
    error,
    normalizedReport,
    userReport,
    progress: progressInfo.progress,
    message: progressInfo.message,
    queuePosition: progressInfo.queuePosition,
    estimatedTimeRemaining: progressInfo.estimatedTimeRemaining,
  };
}
