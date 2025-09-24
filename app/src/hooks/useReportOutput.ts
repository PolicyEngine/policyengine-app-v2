import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MOCK_USER_ID } from '@/constants';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import { useUserReportById } from './useUserReports';

interface UseReportOutputParams {
  reportId: string;
}

interface UseReportOutputResult {
  status: 'pending' | 'complete' | 'error';
  data: any;
  isPending: boolean;
  error: any;
}

/**
 * Hook to get report calculation results.
 *
 * This hook follows a three-tier approach:
 * 1. Check TanStack Query cache for calculation results
 * 2. If not in cache, use the normalized report hook to get report data
 * 3. If report not found, return error
 *
 * Uses the canonical query options factory for consistent query configuration.
 */
export function useReportOutput({ reportId }: UseReportOutputParams): UseReportOutputResult {
  const queryClient = useQueryClient();
  const userId = MOCK_USER_ID; // TODO: Get from auth context

  // Always store reportId as string
  const reportIdStr = String(reportId);

  // Use the canonical query configuration
  const { data: cachedData, error: queryError, isLoading } = useQuery({
    ...calculationQueries.forReport(reportIdStr, undefined, queryClient),
    enabled: true, // Always enabled to allow polling
  });

  // Define standard return values
  const pendingResult: UseReportOutputResult = {
    status: 'pending',
    data: null,
    isPending: true,
    error: null,
  };

  const errorResult = (error: any): UseReportOutputResult => ({
    status: 'error',
    data: null,
    isPending: false,
    error,
  });

  const completeResult = (data: any): UseReportOutputResult => ({
    status: 'complete',
    data,
    isPending: false,
    error: null,
  });

  // Step 1: Check if we have calculation data
  if (cachedData) {
    // We have calculation data
    // Determine if it's household or economy based on data structure
    const isHouseholdCalc = !('status' in (cachedData as any));

    if (isHouseholdCalc) {
      // Household calculations return data directly without status
      // Check for error structure
      if (cachedData && typeof cachedData === 'object' && 'error' in (cachedData as any)) {
        return errorResult((cachedData as any).error || 'Household calculation failed');
      }
      // If we have data, it's complete
      return completeResult(cachedData);
    } else {
      // Economy calculations have status field
      const economyCalc = cachedData as any;
      if (economyCalc.status === 'complete') {
        return completeResult(economyCalc.result);
      } else if (economyCalc.status === 'pending') {
        return pendingResult;
      } else if (economyCalc.status === 'error') {
        return errorResult(economyCalc.error || 'Calculation failed');
      }
    }
  }

  // If there's an error from the query
  if (queryError) {
    return errorResult(queryError);
  }

  // If we're still loading
  if (isLoading) {
    return pendingResult;
  }

  // Step 2: If no calculation data and not loading, check the report
  const { report, error: reportError } = useUserReportById(userId, reportIdStr);

  if (!report) {
    // Step 3: Report not found, return error
    return errorResult(reportError || 'Report not found');
  }

  // Return based on the report's status
  if (!report.status) {
    console.error(`Report ${reportIdStr} has no status field`);
    return errorResult('Invalid report: missing status');
  }

  // Parse output if it exists
  const outputData = report.output
    ? (typeof report.output === 'string' ? JSON.parse(report.output) : report.output)
    : null;

  switch (report.status) {
    case 'complete':
      return completeResult(outputData);
    case 'pending':
      return pendingResult;
    case 'error':
      return errorResult('Report calculation failed');
    default:
      console.error(`Unknown report status: ${report.status}`);
      return errorResult(`Unknown status: ${report.status}`);
  }
}