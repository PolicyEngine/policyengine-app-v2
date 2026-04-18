import { useRef, type ReactNode } from 'react';
import { ChartDownloadMenu, type ChartCsvData } from '@/components/ChartDownloadMenu';
import { Group, Stack, Text } from '@/components/ui';
import { typography } from '@/designTokens';

interface ChartContainerProps {
  children: ReactNode;
  title: string;
  /** When set, renders a download button that exports the chart as SVG */
  downloadFilename?: string;
  /** Optional chart data for CSV export. When set alongside downloadFilename,
   * the download button becomes a dropdown with SVG + CSV options. */
  csvData?: ChartCsvData;
}

/**
 * A consistent container for charts with standard border, padding, and background styling.
 * Automatically renders a header with title and a download icon button (SVG only by default,
 * or a dropdown with SVG + CSV when csvData is provided).
 */
export function ChartContainer({
  children,
  title,
  downloadFilename,
  csvData,
}: ChartContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="start" wrap="nowrap">
        <Text size="lg" fw={typography.fontWeight.medium} className="tw:flex-1 tw:break-words">
          {title}
        </Text>
        {downloadFilename && (
          <ChartDownloadMenu
            containerRef={contentRef}
            svgFilename={downloadFilename}
            title={title}
            csvData={csvData}
          />
        )}
      </Group>

      <div
        ref={contentRef}
        className="tw:p-md tw:border tw:border-border-light tw:rounded-container tw:bg-white"
      >
        {children}
      </div>
    </Stack>
  );
}
