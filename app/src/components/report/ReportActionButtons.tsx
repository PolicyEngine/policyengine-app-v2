import { IconBookmark, IconPencil, IconSettings, IconShare } from '@tabler/icons-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onModify?: () => void;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders different buttons based on view type:
 * - Normal view: Share + Edit buttons
 * - Shared view: Save button with tooltip
 */
export function ReportActionButtons({
  isSharedView,
  onShare,
  onSave,
  onEdit,
  onModify,
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
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Rename report" onClick={onEdit}>
            <IconPencil size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Rename report</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Modify report" onClick={onModify}>
            <IconSettings size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Modify report</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Share report" onClick={onShare}>
            <IconShare size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Share report</TooltipContent>
      </Tooltip>
    </>
  );
}
