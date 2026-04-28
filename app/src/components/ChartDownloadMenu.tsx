import { IconDownload } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { trackChartCsvDownloaded, trackChartSvgDownloaded } from '@/utils/analytics';
import { downloadChartAsSvg, downloadCsv } from '@/utils/chartUtils';

export type ChartCsvData = string[][] | (() => string[][]);

interface ChartDownloadMenuProps {
  /** Ref to the element containing the chart SVG(s) to export. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** SVG filename (e.g. "winners-losers-income-decile.svg"). */
  svgFilename: string;
  /** Title written into the SVG header. */
  title?: string;
  /** Subtitle written into the SVG header. */
  subtitle?: string;
  /** Optional CSV data. When provided, the button becomes a dropdown with SVG + CSV options. */
  csvData?: ChartCsvData;
  /** Icon size for the trigger (default 18). */
  iconSize?: number;
  /** Button size variant. */
  buttonSize?: 'icon' | 'icon-xs';
}

function deriveCsvFilename(svgFilename: string): string {
  return svgFilename.replace(/\.svg$/i, '.csv');
}

function resolveCsvData(csvData: ChartCsvData): string[][] {
  return typeof csvData === 'function' ? csvData() : csvData;
}

/**
 * Download trigger for charts. Renders a single SVG-download button when no
 * CSV data is provided, or a dropdown menu with "Download as SVG" and
 * "Download data (CSV)" when csvData is supplied.
 */
export function ChartDownloadMenu({
  containerRef,
  svgFilename,
  title,
  subtitle,
  csvData,
  iconSize = 18,
  buttonSize = 'icon',
}: ChartDownloadMenuProps) {
  const handleSvgDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    trackChartSvgDownloaded();
    if (containerRef.current) {
      downloadChartAsSvg(containerRef.current, {
        title,
        subtitle,
        filename: svgFilename,
      });
    }
  };

  const handleCsvDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!csvData) {
      return;
    }
    trackChartCsvDownloaded();
    const rows = resolveCsvData(csvData);
    if (rows.length === 0) {
      return;
    }
    downloadCsv(rows, deriveCsvFilename(svgFilename));
  };

  if (!csvData) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            className="tw:shrink-0"
            onClick={handleSvgDownload}
            aria-label="Download as SVG"
          >
            <IconDownload size={iconSize} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Download as SVG</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={buttonSize}
              className="tw:shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label="Download chart"
            >
              <IconDownload size={iconSize} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Download</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => handleSvgDownload()}>Download as SVG</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleCsvDownload()}>
          Download data (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
