import { IconBookmark, IconPencil, IconShare } from '@tabler/icons-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
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
      <Button variant="ghost" size="icon" aria-label="Edit report name" onClick={onEdit}>
        <IconPencil size={18} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Share report" onClick={onShare}>
        <IconShare size={18} />
      </Button>
    </>
  );
}
