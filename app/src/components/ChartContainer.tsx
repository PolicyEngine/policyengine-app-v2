import { useRef, type ReactNode } from 'react';
import { IconDownload } from '@tabler/icons-react';
import {
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { typography } from '@/designTokens';
import { trackChartCsvDownloaded } from '@/utils/analytics';
import { downloadChartAsSvg, downloadCsv } from '@/utils/chartUtils';

interface ChartContainerProps {
  children: ReactNode;
  title: string;
  /** When set, renders a download button that exports the chart as SVG */
  downloadFilename?: string;
  /** CSV rows to export when the CSV download button is used */
  csvData?: string[][];
  /** When set with csvData, renders a download button that exports chart data as CSV */
  csvFilename?: string;
}

/**
 * A consistent container for charts with standard border, padding, and background styling.
 * Automatically renders a header with title and SVG download icon button.
 *
 * @param title - Chart title text
 * @param downloadFilename - SVG filename (enables download button when set)
 * @param children - Main content (description and chart) displayed inside the white card
 */
export function ChartContainer({
  children,
  title,
  downloadFilename,
  csvData,
  csvFilename,
}: ChartContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasCsvDownload = !!csvFilename && !!csvData;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="start" wrap="nowrap">
        <Text size="lg" fw={typography.fontWeight.medium} className="tw:flex-1 tw:break-words">
          {title}
        </Text>
        {(downloadFilename || hasCsvDownload) && (
          <Group gap="xs" wrap="nowrap" className="tw:shrink-0">
            {hasCsvDownload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="tw:shrink-0"
                    onClick={() => {
                      trackChartCsvDownloaded();
                      downloadCsv(csvData!, csvFilename!);
                    }}
                    aria-label="Download CSV"
                  >
                    <IconDownload size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Download CSV</TooltipContent>
              </Tooltip>
            )}
            {downloadFilename && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="tw:shrink-0"
                    onClick={() => {
                      if (contentRef.current) {
                        downloadChartAsSvg(contentRef.current, {
                          title,
                          filename: downloadFilename,
                        });
                      }
                    }}
                    aria-label="Download as SVG"
                  >
                    <IconDownload size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Download as SVG</TooltipContent>
              </Tooltip>
            )}
          </Group>
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
