import React from 'react';
import { Spinner } from '@/components/ui';
import { useMultiSimulationCalcStatus } from '@/hooks/useCalcStatusSubscription';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

interface MultiSimReportOutputTypeCellProps {
  simulationIds: string[];
  simulations?: Simulation[];
  report?: Report;
}

/**
 * Cell component for displaying report status with live calculation spinner
 * For household reports (multiple simulations)
 *
 * This component subscribes to CalcStatus updates for the report's simulations
 * and re-renders only when its own CalcStatus changes, not when other reports update.
 *
 * Memoized to prevent unnecessary re-renders when parent component updates.
 */
export const MultiSimOutputTypeCell = React.memo(
  ({ simulationIds, simulations: _simulations, report }: MultiSimReportOutputTypeCellProps) => {
    const { isCalculating, progress } = useMultiSimulationCalcStatus(simulationIds);

    if (isCalculating) {
      return (
        <div className="tw:flex tw:items-center tw:gap-xs">
          <Spinner className="tw:h-4 tw:w-4" />
          <span className="tw:text-sm">{progress ? `${Math.round(progress)}%` : ''}</span>
        </div>
      );
    }

    const status = report?.status || 'initializing';
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className="tw:text-sm">{formattedStatus}</span>;
  }
);
MultiSimOutputTypeCell.displayName = 'MultiSimOutputTypeCell';
