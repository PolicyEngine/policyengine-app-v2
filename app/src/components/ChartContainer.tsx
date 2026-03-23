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
import { downloadChartAsSvg } from '@/utils/chartUtils';

interface ChartContainerProps {
  children: ReactNode;
  title: string;
  /** When set, renders a download button that exports the chart as SVG */
  downloadFilename?: string;
}

/**
 * A consistent container for charts with standard border, padding, and background styling.
 * Automatically renders a header with title and SVG download icon button.
 *
 * @param title - Chart title text
 * @param downloadFilename - SVG filename (enables download button when set)
 * @param children - Main content (description and chart) displayed inside the white card
 */
export function ChartContainer({ children, title, downloadFilename }: ChartContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="start" wrap="nowrap">
        <Text size="lg" fw={typography.fontWeight.medium} className="tw:flex-1 tw:break-words">
          {title}
        </Text>
        {downloadFilename && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="tw:shrink-0"
                onClick={() => {
                  trackChartCsvDownloaded();
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

      <div
        ref={contentRef}
        className="tw:p-md tw:border tw:border-border-light tw:rounded-container tw:bg-white"
      >
        {children}
      </div>
    </Stack>
  );
}
