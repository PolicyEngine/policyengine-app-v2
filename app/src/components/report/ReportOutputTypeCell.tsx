import React from 'react';
import { Spinner } from '@/components/ui';
import { useReportCalculationStatus } from '@/hooks/useCalcStatusSubscription';
import type { Report } from '@/types/ingredients/Report';

interface ReportOutputTypeCellProps {
  reportId: string;
  report?: Report;
}

/**
 * Cell component for displaying society-wide report status with live calculation spinner
 *
 * This component subscribes to CalcStatus updates for the report
 * and re-renders only when its own CalcStatus changes, not when other reports update.
 *
 * Memoized to prevent unnecessary re-renders when parent component updates.
 */
export const ReportOutputTypeCell = React.memo(
  ({ reportId, report }: ReportOutputTypeCellProps) => {
    // Subscribe to CalcStatus for this report
    const { isCalculating, progress } = useReportCalculationStatus(reportId);

    const displayText = progress ? `${Math.round(progress)}%` : '';

    // Show calculating state with spinner and progress
    if (isCalculating) {
      return (
        <div className="tw:flex tw:items-center tw:gap-xs">
          <Spinner className="tw:h-4 tw:w-4" />
          <span className="tw:text-sm">{displayText}</span>
        </div>
      );
    }

    // Show status text
    const status = report?.status || 'initializing';
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className="tw:text-sm">{formattedStatus}</span>;
  }
);
