/**
 * PolicyStatusHeader - Glassmorphic status bar for policy creation mode
 */
import { Box, Group, Text, TextInput, ActionIcon } from '@mantine/core';
import { IconScale, IconPencil } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

interface PolicyStatusHeaderProps {
  policyLabel: string;
  setPolicyLabel: (label: string) => void;
  isEditingLabel: boolean;
  setIsEditingLabel: (editing: boolean) => void;
  modificationCount: number;
}

export function PolicyStatusHeader({
  policyLabel,
  setPolicyLabel,
  isEditingLabel,
  setIsEditingLabel,
  modificationCount,
}: PolicyStatusHeaderProps) {
  const colorConfig = INGREDIENT_COLORS.policy;

  const dockStyles = {
    statusHeader: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.lg,
      border: `1px solid ${modificationCount > 0 ? colorConfig.border : colors.border.light}`,
      boxShadow: modificationCount > 0
        ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px ${colorConfig.border}`
        : `0 2px 12px ${colors.shadow.light}`,
      padding: `${spacing.sm} ${spacing.lg}`,
      transition: 'all 0.3s ease',
      margin: spacing.md,
      marginBottom: 0,
    },
  };

  return (
    <Box style={dockStyles.statusHeader}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
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
            <IconScale size={18} color={colorConfig.icon} />
          </Box>
          <Box style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <TextInput
                value={policyLabel}
                onChange={(e) => setPolicyLabel(e.currentTarget.value)}
                onBlur={() => setIsEditingLabel(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingLabel(false);
                  if (e.key === 'Escape') setIsEditingLabel(false);
                }}
                autoFocus
                placeholder="Enter policy name..."
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
                    color: policyLabel ? colors.gray[800] : colors.gray[400],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsEditingLabel(true)}
                >
                  {policyLabel || 'Click to name your policy...'}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setIsEditingLabel(true)}
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </>
            )}
          </Box>
        </Group>
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
            {modificationCount > 0 ? (
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
                  {modificationCount} parameter{modificationCount !== 1 ? 's' : ''} modified
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                No changes yet
              </Text>
            )}
          </Group>
        </Group>
      </Group>
    </Box>
  );
}
