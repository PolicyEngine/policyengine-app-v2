import React from 'react';
import { Group, Loader, Text } from '@mantine/core';
import { colors } from '@/designTokens';
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
    // Subscribe to CalcStatus for this report's simulations
    const { isCalculating, progress } = useMultiSimulationCalcStatus(simulationIds);

    // Show calculating state with spinner and progress
    if (isCalculating) {
      return (
        <Group gap="xs">
          <Loader size="sm" color={colors.button.primaryBg} />
          <Text size="sm">{progress ? `${Math.round(progress)}%` : ''}</Text>
        </Group>
      );
    }

    // Show status text
    const status = report?.status || 'initializing';
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return <Text size="sm">{formattedStatus}</Text>;
  }
);
