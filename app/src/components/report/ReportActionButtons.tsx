import { IconBookmark, IconPencil, IconRefresh, IconShare } from '@tabler/icons-react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { colors, typography } from '@/designTokens';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onRerun?: () => void;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders different buttons based on view type:
 * - Normal view: Rerun + Edit + Share buttons
 * - Shared view: Save button with tooltip
 */
export function ReportActionButtons({
  isSharedView,
  onShare,
  onSave,
  onEdit,
  onRerun,
}: ReportActionButtonsProps) {
  if (isSharedView) {
    return (
      <Tooltip
        label="Save to my reports"
        position="right"
        styles={{
          tooltip: {
            backgroundColor: colors.gray[700],
            fontSize: typography.fontSize.xs,
          },
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Save report to my reports"
          onClick={onSave}
        >
          <IconBookmark size={18} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <>
      {onRerun && (
        <Tooltip
          label="Rerun report"
          styles={{
            tooltip: {
              backgroundColor: colors.gray[700],
              fontSize: typography.fontSize.xs,
            },
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Rerun report"
            onClick={onRerun}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      )}
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Edit report name"
        onClick={onEdit}
      >
        <IconPencil size={18} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Share report"
        onClick={onShare}
      >
        <IconShare size={18} />
      </ActionIcon>
    </>
  );
}
