import { IconBookmark } from '@tabler/icons-react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { EditDefaultButton, ShareButton, ViewButton } from '@/components/common/ActionButtons';
import { colors, typography } from '@/designTokens';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onView?: () => void;
  onEdit?: () => void;
}

/**
 * ReportActionButtons - Action buttons for report output header
 *
 * Renders different buttons based on view type:
 * - Normal view: View + Edit + Share buttons
 * - Shared view: Save button with tooltip
 */
export function ReportActionButtons({
  isSharedView,
  onShare,
  onSave,
  onView,
  onEdit,
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
    <Group gap="xs" ml={6}>
      <ViewButton tooltip="View report setup" onClick={onView} />
      <EditDefaultButton onClick={onEdit} />
      <ShareButton onClick={onShare} />
    </Group>
  );
}
