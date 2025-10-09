import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import { RootState } from '@/store';

export interface UseReportOutputParams {
  reportId: string;
  enabled?: boolean;
}

export interface PendingResult {
  status: 'pending';
  data: null;
  isPending: true;
  error: null;
  progress?: number;
  message?: string;
  queuePosition?: number;
  estimatedTimeRemaining?: number;
}

export interface CompleteResult {
  status: 'complete';
  data: any;
  isPending: false;
  error: null;
}

export interface ErrorResult {
  status: 'error';
  data: null;
  isPending: false;
  error: any;
}

export type UseReportOutputResult = PendingResult | CompleteResult | ErrorResult;

/**
 * Hook to get report calculation results.
 * Uses the unified calculation system that works for both household and economy calculations.
 */
export function useReportOutput({
  reportId,
  enabled = true,
}: UseReportOutputParams): UseReportOutputResult {
  const queryClient = useQueryClient();
  const countryId = useSelector((state: RootState) => state.metadata.currentCountry || 'us');

  // Use unified query that works for both calculation types
  const { data, error, isLoading } = useQuery({
    ...calculationQueries.forReport(reportId, undefined, queryClient, countryId),
    enabled,
  });

  // Simplified status handling - both types return same format
  if (data) {
    if (data.status === 'computing') {
      return {
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        progress: data.progress,
        message: data.message,
        queuePosition: data.queuePosition,
        estimatedTimeRemaining: data.estimatedTimeRemaining,
      };
    }

    if (data.status === 'ok') {
      return {
        status: 'complete',
        data: data.result,
        isPending: false,
        error: null,
      };
    }

    if (data.status === 'error') {
      return {
        status: 'error',
        data: null,
        isPending: false,
        error: data.error,
      };
    }
  }

  if (error) {
    return {
      status: 'error',
      data: null,
      isPending: false,
      error,
    };
  }

  if (isLoading) {
    return {
      status: 'pending',
      data: null,
      isPending: true,
      error: null,
    };
  }

  // Fallback
  return {
    status: 'error',
    data: null,
    isPending: false,
    error: 'Unable to fetch calculation',
  };
}
