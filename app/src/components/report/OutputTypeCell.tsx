import React from 'react';
import { Group, Loader, Text } from '@mantine/core';
import { useMultiSimulationCalcStatus } from '@/hooks/useCalcStatusSubscription';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

interface OutputTypeCellProps {
  simulationIds: string[];
  isHouseholdReport: boolean;
  simulations?: Simulation[];
  report?: Report;
}

/**
 * Cell component for displaying report output type with live calculation status
 *
 * This component subscribes to CalcStatus updates for the report's simulations
 * and re-renders only when its own CalcStatus changes, not when other reports update.
 *
 * Memoized to prevent unnecessary re-renders when parent component updates.
 */
export const OutputTypeCell = React.memo(
  ({ simulationIds, isHouseholdReport, simulations, report }: OutputTypeCellProps) => {
    // Subscribe to CalcStatus for this report's simulations
    const { isCalculating, progress } = useMultiSimulationCalcStatus(simulationIds);

    console.log('[OutputTypeCell] Render:', {
      simulationIds,
      isCalculating,
      progress,
      isHouseholdReport,
    });

    // Show calculating state with spinner and progress
    if (isCalculating) {
      return (
        <Group gap="xs">
          <Loader size="sm" color="teal" />
          <Text size="sm">{progress ? `${Math.round(progress)}%` : ''}</Text>
        </Group>
      );
    }

    // Show output type for household reports
    if (isHouseholdReport) {
      // Check if any simulation has output
      const hasOutput = simulations?.some((sim) => sim.output);
      return <Text size="sm">{hasOutput ? 'Household' : 'Not generated'}</Text>;
    }

    // Show output type for economy reports
    return <Text size="sm">{report?.output ? 'Society-wide' : 'Not generated'}</Text>;
  }
);
