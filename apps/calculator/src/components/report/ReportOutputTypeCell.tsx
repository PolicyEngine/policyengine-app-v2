import React from 'react';
import { Group, Loader, Text } from '@mantine/core';
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
        <Group gap="xs">
          <Loader size="sm" color="teal" />
          <Text size="sm">{displayText}</Text>
        </Group>
      );
    }

    // Show status text
    const status = report?.status || 'initializing';
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return <Text size="sm">{formattedStatus}</Text>;
  }
);
