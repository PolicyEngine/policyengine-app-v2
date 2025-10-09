import { useQueryClient } from '@tanstack/react-query';
import { EconomyReportOutput } from '@/api/economy';
import { CalculationMeta } from '@/api/reportCalculations';
import { MOCK_USER_ID } from '@/constants';
import { Household, HouseholdData } from '@/types/ingredients/Household';
import { useReportOutput } from './useReportOutput';
import { useUserReportByUserReportId } from './useUserReportAssociations';
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
 * Fetches UserReport first by its ID, then uses the base reportId for calculations
 *
 * @param userReportId - The ID of the UserReport to fetch
 * @returns Report data including status, output, and metadata
 */
export function useReportData(userReportId: string): ReportDataResult {
  const queryClient = useQueryClient();
  const userId = MOCK_USER_ID.toString();

  // Step 1: Fetch UserReport by its ID
  const {
    data: userReport,
    isLoading: userReportLoading,
    error: userReportError,
  } = useUserReportByUserReportId(userReportId);

  // Step 2: Extract base reportId from UserReport
  const baseReportId = userReport?.reportId;

  // Step 3: Fetch normalized report and real data using base reportId
  // These hooks must be called unconditionally to comply with Rules of Hooks
  const normalizedReport = useUserReportById(userId, baseReportId || '');
  const reportOutputResult = useReportOutput({ reportId: baseReportId || '' });

  // Step 4: Handle loading and error states
  if (userReportLoading) {
    return LOADING_PROPS;
  }

  if (!userReport || !baseReportId) {
    return {
      ...ERROR_PROPS,
      error: userReportError || ERROR_PROPS.error,
    };
  }

  // Step 5: Process the report output result
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
      countryId: metadata?.countryId || 'us',
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
    progress: progressInfo.progress,
    message: progressInfo.message,
    queuePosition: progressInfo.queuePosition,
    estimatedTimeRemaining: progressInfo.estimatedTimeRemaining,
  };
}
