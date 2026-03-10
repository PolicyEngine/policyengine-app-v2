import { IconPencil } from '@tabler/icons-react';
import { Button, Group, Input, Text } from '@/components/ui';
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
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: spacing.radius.feature,
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
        <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          {/* Icon container */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.container,
              background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          {/* Editable name */}
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <Input
                value={label}
                onChange={(e) => onLabelChange(e.currentTarget.value)}
                onBlur={onStopEditing}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder={placeholder.replace('Click to ', 'Enter ')}
                className="tw:border-none tw:bg-transparent tw:p-0 tw:h-auto tw:shadow-none tw:focus-visible:ring-0"
                style={{
                  width: 250,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.normal,
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onStartEditing}
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </Button>
              </>
            )}
          </div>
        </Group>

        {/* Right side: Status indicator */}
        <Group gap="md" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Status with indicator dot */}
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {hasChanges ? (
              <>
                <div
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
    </div>
  );
}
