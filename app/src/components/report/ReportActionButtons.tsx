import { IconBookmark, IconCode, IconSettings } from '@tabler/icons-react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { ShareButton } from '@/components/common/ActionButtons';
import { colors, typography } from '@/designTokens';

interface ReportActionButtonsProps {
  isSharedView: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onView?: () => void;
  onReproduce?: () => void;
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
  onShare,
  onSave,
  onView,
  onReproduce,
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

  const tooltipStyles = {
    tooltip: {
      backgroundColor: colors.gray[700],
      fontSize: typography.fontSize.xs,
    },
  };

  return (
    <Group gap="xs" ml={6}>
      <Tooltip label="View/edit report" position="bottom" styles={tooltipStyles} withArrow>
        <ActionIcon
          variant="light"
          color="gray"
          size="lg"
          aria-label="View/edit report"
          onClick={onView}
        >
          <IconSettings size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Reproduce in Python" position="bottom" styles={tooltipStyles} withArrow>
        <ActionIcon
          variant="light"
          color="gray"
          size="lg"
          aria-label="Reproduce in Python"
          onClick={onReproduce}
        >
          <IconCode size={18} />
        </ActionIcon>
      </Tooltip>
      <ShareButton onClick={onShare} />
    </Group>
  );
}
