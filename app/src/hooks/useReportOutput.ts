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
  console.log('[useReportOutput] Called with reportId:', reportId);
  const queryClient = useQueryClient();
  const userId = MOCK_USER_ID; // TODO: Get from auth context

  // Always store reportId as string
  const reportIdStr = String(reportId);
  console.log('[useReportOutput] Converted reportIdStr:', reportIdStr);

  // Use the canonical query configuration
  console.log('[useReportOutput] Calling useQuery with canonical configuration');
  const { data: cachedData, error: queryError, isLoading } = useQuery({
    ...calculationQueries.forReport(reportIdStr, undefined, queryClient),
    enabled: true, // Always enabled to allow polling
  });
  console.log('[useReportOutput] Query results:');
  console.log('  - cachedData:', cachedData);
  console.log('  - queryError:', queryError);
  console.log('  - isLoading:', isLoading);

  // Call useUserReportById unconditionally to maintain hooks order
  const { report, error: reportError } = useUserReportById(userId, reportIdStr);
  console.log('[useReportOutput] Report lookup result:');
  console.log('  - report:', report);
  console.log('  - reportError:', reportError);

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
    console.log('[useReportOutput] Step 1: Have cached calculation data');
    // We have calculation data
    // Determine if it's household or economy based on data structure
    const isHouseholdCalc = !('status' in (cachedData as any));
    console.log('[useReportOutput] Is household calculation?', isHouseholdCalc);

    if (isHouseholdCalc) {
      console.log('[useReportOutput] Processing household calculation result');
      // Household calculations return data directly without status
      // Check for error structure
      if (cachedData && typeof cachedData === 'object' && 'error' in (cachedData as any)) {
        console.log('[useReportOutput] Household calculation has error:', (cachedData as any).error);
        return errorResult((cachedData as any).error || 'Household calculation failed');
      }
      // If we have data, it's complete
      console.log('[useReportOutput] Household calculation complete, returning data');
      return completeResult(cachedData);
    } else {
      // Economy calculations have status field
      const economyCalc = cachedData as any;
      console.log('[useReportOutput] Processing economy calculation with status:', economyCalc.status);
      if (economyCalc.status === 'ok') {
        console.log('[useReportOutput] Economy calculation ok, returning result');
        return completeResult(economyCalc.result);
      } else if (economyCalc.status === 'computing') {
        console.log('[useReportOutput] Economy calculation computing, returning pending result');
        return pendingResult;
      } else if (economyCalc.status === 'error') {
        console.log('[useReportOutput] Economy calculation error:', economyCalc.error);
        return errorResult(economyCalc.error || 'Calculation failed');
      }
    }
  }

  // If there's an error from the query
  if (queryError) {
    console.log('[useReportOutput] Query error:', queryError);
    return errorResult(queryError);
  }

  // If we're still loading
  if (isLoading) {
    console.log('[useReportOutput] Still loading initial data');
    return pendingResult;
  }

  // Step 2: If no calculation data and not loading, check the report
  console.log('[useReportOutput] Step 2: No cached data, checking report');

  if (!report) {
    // Step 3: Report not found, return error
    console.log('[useReportOutput] Step 3: Report not found, returning error');
    return errorResult(reportError || 'Report not found');
  }

  // Return based on the report's status
  if (!report.status) {
    console.error(`[useReportOutput] Report ${reportIdStr} has no status field`);
    return errorResult('Invalid report: missing status');
  }

  console.log('[useReportOutput] Report has status:', report.status);
  // Output is already parsed in the Report type
  const outputData = report.output;
  console.log('[useReportOutput] Report output data:', outputData);

  switch (report.status) {
    case 'complete':
      console.log('[useReportOutput] Report status is complete, returning output data');
      return completeResult(outputData);
    case 'pending':
      console.log('[useReportOutput] Report status is pending');
      return pendingResult;
    case 'error':
      console.log('[useReportOutput] Report status is error');
      return errorResult('Report calculation failed');
    default:
      console.error(`[useReportOutput] Unknown report status: ${report.status}`);
      return errorResult(`Unknown status: ${report.status}`);
  }
}