import { IconBookmark, IconCode, IconSettings } from '@tabler/icons-react';
import { Group } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReportShareButton } from './ReportShareButton';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
  shareUrl?: string | null;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders report-header actions based on available capabilities.
 * Shared views can safely expose the same read-only actions as owned views,
 * with an extra save action to let the user persist their own copy locally.
 */
export function ReportActionButtons({
  isSharedView,
  onSave,
  onView,
  onReproduce,
  shareUrl,
}: ReportActionButtonsProps) {
  const viewLabel = isSharedView ? 'View report setup' : 'View/edit report';

  return (
    <Group gap="xs" className="tw:ml-1.5">
      {isSharedView && onSave && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Save report to my reports"
              onClick={onSave}
            >
              <IconBookmark size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save to my reports</TooltipContent>
        </Tooltip>
      )}
      {onView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={viewLabel} onClick={onView}>
              <IconSettings size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{viewLabel}</TooltipContent>
        </Tooltip>
      )}
      {onReproduce && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reproduce in Python"
              onClick={onReproduce}
            >
              <IconCode size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Reproduce in Python</TooltipContent>
        </Tooltip>
      )}
      <ReportShareButton shareUrl={shareUrl} />
    </Group>
  );
}
