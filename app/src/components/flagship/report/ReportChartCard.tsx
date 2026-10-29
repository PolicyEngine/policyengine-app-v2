import { useId, useRef, useState, type ReactNode } from 'react';
import { IconArrowsMaximize, IconDownload } from '@tabler/icons-react';
import {
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { spacing, typography } from '@/designTokens';
import { trackChartCsvDownloaded, trackChartSvgDownload } from '@/utils/analytics';
import { downloadChartAsSvg, downloadCsv, type CsvData } from '@/utils/chartUtils';

interface ReportChartCardProps {
  title: string;
  /** Chart shown in the card. */
  children: ReactNode;
  /** Optional full-detail chart shown in the expansion dialog instead of `children`. */
  focusedContent?: ReactNode;
  focusedChartHeight?: number;
  /** Controls (e.g. SegmentedControl) rendered above the chart. */
  controls?: ReactNode;
  /** Span every grid column. */
  fullWidth?: boolean;
  /** SVG download filename; renders a download button when set. */
  downloadFilename?: string;
  csvData?: CsvData;
  /** CSV download filename; renders a CSV download button when csvData is provided. */
  csvFilename?: string;
  /**
   * Why the CSV cannot be downloaded yet (its labels are loading, or failed
   * to): the button shows, disabled, with this as its tooltip.
   */
  csvUnavailableReason?: string;
}

/**
 * Always-open chart card for the flagship report's economic impacts grid.
 * An expand button opens the chart, or its full-detail variant, in a dialog.
 */
export default function ReportChartCard({
  title,
  children,
  focusedContent,
  focusedChartHeight = 440,
  controls,
  fullWidth = false,
  downloadFilename,
  csvData,
  csvFilename,
  csvUnavailableReason,
}: ReportChartCardProps) {
  const [focused, setFocused] = useState(false);
  const chart = (enlarged: boolean) => (
    <ChartFrame
      title={title}
      downloadFilename={downloadFilename}
      csvFilename={csvFilename}
      csvData={csvData}
      csvUnavailableReason={csvUnavailableReason}
      headerActions={
        !enlarged && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Expand ${title}`}
                onClick={() => setFocused(true)}
              >
                <IconArrowsMaximize size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand chart</TooltipContent>
          </Tooltip>
        )
      }
    >
      {controls && (
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}
        >
          {controls}
        </div>
      )}
      {enlarged ? (
        <div style={{ height: `min(55dvh, ${focusedChartHeight}px)`, minWidth: 0 }}>
          {focusedContent ?? children}
        </div>
      ) : (
        // In the grid, the chart grows into the height its row leaves beyond
        // this minimum, so cards side by side end at the same height. It sits
        // in an absolutely positioned box so its measured size never adds to
        // the row's height, which would keep the row tall after a resize.
        <div
          style={{
            position: 'relative',
            flex: '1 1 auto',
            minHeight: fullWidth ? '280px' : 'clamp(210px, calc((100vh - 620px) / 2), 280px)',
            minWidth: 0,
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
            {children}
          </div>
        </div>
      )}
    </ChartFrame>
  );
  return (
    <section
      style={{
        minWidth: 0,
        gridColumn: fullWidth ? '1 / -1' : undefined,
        // The grid stretches each card to its row's height; the frame fills it.
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {chart(false)}
      <Dialog open={focused} onOpenChange={setFocused}>
        <DialogContent
          className="report-chart-dialog"
          aria-describedby={undefined}
          style={{
            width: `calc(100vw - ${spacing['4xl']})`,
            maxWidth: spacing.layout.container,
            maxHeight: 'calc(100dvh - 48px)',
            overflowY: 'auto',
          }}
        >
          <DialogTitle className="tw:sr-only">{title}</DialogTitle>
          <div style={{ paddingTop: spacing.lg }}>{chart(true)}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Title row with download actions above a bordered chart body. */
function ChartFrame({
  children,
  headerActions,
  title,
  downloadFilename,
  csvData,
  csvFilename,
  csvUnavailableReason,
}: {
  children: ReactNode;
  headerActions?: ReactNode;
  title: string;
  downloadFilename?: string;
  csvData?: CsvData;
  csvFilename?: string;
  csvUnavailableReason?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const csvReasonId = useId();
  const csvUnavailable = !!csvFilename && !!csvUnavailableReason;
  const hasCsvDownload = !!csvFilename && (!!csvData || csvUnavailable);

  return (
    // Fills the card, so the bordered body below can take the rest of its height.
    <Stack gap="sm" className="tw:flex-1">
      <Group justify="space-between" align="start" wrap="nowrap">
        <Text size="lg" fw={typography.fontWeight.medium} className="tw:flex-1 tw:break-words">
          {title}
        </Text>
        <Group gap="xs" wrap="nowrap" className="tw:shrink-0">
          {headerActions}
          {hasCsvDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* While unavailable it stays focusable (aria-disabled, not disabled), so its
                    tooltip opens, and the reason is also its description. */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="tw:shrink-0"
                  aria-disabled={csvUnavailable || undefined}
                  aria-describedby={csvUnavailable ? csvReasonId : undefined}
                  onClick={() => {
                    if (csvUnavailable) {
                      return;
                    }
                    trackChartCsvDownloaded();
                    downloadCsv(csvData!, csvFilename!);
                  }}
                  aria-label="Download CSV"
                >
                  <IconDownload size={18} />
                  {csvUnavailable && (
                    <span id={csvReasonId} className="tw:sr-only">
                      {csvUnavailableReason}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {csvUnavailable ? csvUnavailableReason : 'Download CSV'}
              </TooltipContent>
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
                      trackChartSvgDownload();
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
      </Group>

      <div
        ref={contentRef}
        className="tw:flex tw:flex-1 tw:flex-col tw:p-md tw:border tw:border-border-light tw:rounded-container tw:bg-white"
      >
        {children}
      </div>
    </Stack>
  );
}
