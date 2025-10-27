import React from 'react';
import { Group, Loader, Text } from '@mantine/core';
import { useReportCalculationStatus } from '@/hooks/useCalcStatusSubscription';
import type { Report } from '@/types/ingredients/Report';

interface ReportOutputTypeCellProps {
  reportId: string;
  report?: Report;
}

/**
 * Cell component for displaying society-wide report output type with live calculation status
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

    console.log('[ReportOutputTypeCell] Render:', {
      reportId,
      isCalculating,
      progress,
      roundedProgress: progress ? Math.round(progress) : undefined,
      displayText,
      reportHasOutput: !!report?.output,
    });

    // Show calculating state with spinner and progress
    if (isCalculating) {
      console.log('[ReportOutputTypeCell] Displaying calculating state:', displayText);
      return (
        <Group gap="xs">
          <Loader size="sm" color="teal" />
          <Text size="sm">{displayText}</Text>
        </Group>
      );
    }

    // Show output type for society-wide reports
    const finalText = report?.output ? 'Society-wide' : 'Not generated';
    console.log('[ReportOutputTypeCell] Displaying complete state:', finalText);
    return <Text size="sm">{finalText}</Text>;
  }
);
