import { IconPencil } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Text, TextInput } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { CreationStatusHeaderProps } from '../../types';

/**
 * A reusable glassmorphic status header for creation modes.
 * Used in both PolicyBrowseModal and PopulationBrowseModal when in creation mode.
 */
export function CreationStatusHeader({
  colorConfig,
  icon,
  label,
  placeholder,
  isEditingLabel,
  onLabelChange,
  onStartEditing,
  onStopEditing,
  statusText,
  hasChanges,
  children,
}: CreationStatusHeaderProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onStopEditing();
    }
  };

  return (
    <Box
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: spacing.radius.lg,
        border: `1px solid ${hasChanges ? colorConfig.border : colors.border.light}`,
        boxShadow: hasChanges
          ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px ${colorConfig.border}`
          : `0 2px 12px ${colors.shadow.light}`,
        padding: `${spacing.sm} ${spacing.lg}`,
        transition: 'all 0.3s ease',
        margin: spacing.md,
        marginBottom: 0,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Left side: Icon and editable name */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          {/* Icon container */}
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          {/* Editable name */}
          <Box style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <TextInput
                value={label}
                onChange={(e) => onLabelChange(e.currentTarget.value)}
                onBlur={onStopEditing}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder={placeholder.replace('Click to ', 'Enter ')}
                size="xs"
                style={{ width: 250 }}
                styles={{
                  input: {
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.normal,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                  },
                }}
              />
            ) : (
              <>
                <Text
                  fw={600}
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: FONT_SIZES.normal,
                    color: label ? colors.gray[800] : colors.gray[400],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={onStartEditing}
                >
                  {label || placeholder}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={onStartEditing}
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </>
            )}
          </Box>
        </Group>

        {/* Right side: Status indicator */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Status with indicator dot */}
          <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
            {hasChanges ? (
              <>
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.primary[500],
                  }}
                />
                <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                  {statusText}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                {statusText}
              </Text>
            )}
          </Group>

          {/* Optional children for additional content */}
          {children}
        </Group>
      </Group>
    </Box>
  );
}
