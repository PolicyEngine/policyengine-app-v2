import { IconBookmark, IconCode, IconReload, IconSettings } from '@tabler/icons-react';
import { ShareButton } from '@/components/common/ActionButtons';
import { Group } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  isRerunning?: boolean;
  onRerun?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders different buttons based on view type:
 * - Normal view: Rerun + Reproduce + View/edit + Share buttons
 * - Shared view: Save button with tooltip
 */
export function ReportActionButtons({
  isSharedView,
  isRerunning = false,
  onRerun,
  onShare,
  onSave,
  onView,
  onReproduce,
}: ReportActionButtonsProps) {
  if (isSharedView) {
    return (
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
        <TooltipContent side="right">Save to my reports</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Group gap="xs" className="tw:ml-1.5">
      {onRerun && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Rerun report"
              onClick={onRerun}
              disabled={isRerunning}
            >
              <IconReload size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Rerun report</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="View/edit report" onClick={onView}>
            <IconSettings size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">View/edit report</TooltipContent>
      </Tooltip>
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
      <ShareButton onClick={onShare} />
    </Group>
  );
}
