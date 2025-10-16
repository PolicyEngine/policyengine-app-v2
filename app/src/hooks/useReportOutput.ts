import { useCalculationStatus } from '@/hooks/useCalculationStatus';

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
 * Uses the new calculation status system via useCalculationStatus.
 */
export function useReportOutput({
  reportId,
  enabled = true,
}: UseReportOutputParams): UseReportOutputResult {
  // Use new calculation status hook for reports
  const calcStatus = useCalculationStatus(enabled ? reportId : '', 'report');

  // Map to old interface for backward compatibility
  if (calcStatus.isComputing) {
    return {
      status: 'pending',
      data: null,
      isPending: true,
      error: null,
      progress: calcStatus.progress,
      message: calcStatus.message,
      queuePosition: calcStatus.queuePosition,
      estimatedTimeRemaining: calcStatus.estimatedTimeRemaining,
    };
  }

  if (calcStatus.isComplete) {
    return {
      status: 'complete',
      data: calcStatus.result,
      isPending: false,
      error: null,
    };
  }

  if (calcStatus.isError) {
    return {
      status: 'error',
      data: null,
      isPending: false,
      error: calcStatus.error,
    };
  }

  // Idle or loading state
  if (calcStatus.isLoading || calcStatus.status === 'idle') {
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
