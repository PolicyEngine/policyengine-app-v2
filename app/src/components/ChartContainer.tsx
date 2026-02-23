import type { ReactNode } from 'react';
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
import { trackChartCsvDownloaded } from '@/utils/analytics';

interface ChartContainerProps {
  children: ReactNode;
  title: string;
  onDownloadCsv: () => void;
}

/**
 * A consistent container for charts with standard border, padding, and background styling.
 * Automatically renders a header with title and CSV download icon button.
 *
 * @param title - Chart title text
 * @param onDownloadCsv - Callback function for CSV download
 * @param children - Main content (description and chart) displayed inside the white card
 */
export function ChartContainer({ children, title, onDownloadCsv }: ChartContainerProps) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="lg" fw={500} className="tw:flex-1 tw:break-words">
          {title}
        </Text>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="tw:shrink-0"
              onClick={() => {
                trackChartCsvDownloaded();
                onDownloadCsv();
              }}
              aria-label="Download CSV"
            >
              <IconDownload size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Download CSV</TooltipContent>
        </Tooltip>
      </Group>

      <div className="tw:p-md tw:border tw:border-border-light tw:rounded-container tw:bg-white">
        {children}
      </div>
    </Stack>
  );
}
