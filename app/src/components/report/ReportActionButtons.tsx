import { IconBookmark, IconCode, IconMessageCircle, IconSettings } from '@tabler/icons-react';
import { Group } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReportShareButton } from './ReportShareButton';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  shareUrl?: string;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
  onAskFollowUp?: () => void;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders different buttons based on view type:
 * - Normal view: Reproduce + View/edit + Share buttons
 * - Shared view: Save button with tooltip
 */
export function ReportActionButtons({
  isSharedView,
  shareUrl,
  onSave,
  onView,
  onReproduce,
  onAskFollowUp,
}: ReportActionButtonsProps) {
  return (
    <Group gap="xs" className="tw:ml-1.5">
      {isSharedView && (
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
            <Button variant="ghost" size="icon" aria-label="View/edit report" onClick={onView}>
              <IconSettings size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">View/edit report</TooltipContent>
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
      {onAskFollowUp && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ask a follow-up about this report"
              onClick={onAskFollowUp}
            >
              <IconMessageCircle size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Ask a follow-up</TooltipContent>
        </Tooltip>
      )}
      <ReportShareButton shareUrl={shareUrl} />
    </Group>
  );
}
