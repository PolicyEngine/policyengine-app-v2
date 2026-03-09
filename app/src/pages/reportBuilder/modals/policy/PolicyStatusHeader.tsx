/**
 * PolicyStatusHeader - Glassmorphic status bar for policy creation mode
 */
import { IconScale } from '@tabler/icons-react';
import { Group, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { EditableLabel } from '../../components/EditableLabel';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

interface PolicyStatusHeaderProps {
  policyLabel: string;
  setPolicyLabel: (label: string) => void;
  modificationCount: number;
}

export function PolicyStatusHeader({
  policyLabel,
  setPolicyLabel,
  modificationCount,
}: PolicyStatusHeaderProps) {
  const colorConfig = INGREDIENT_COLORS.policy;

  const dockStyles = {
    statusHeader: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.feature,
      border: `1px solid ${modificationCount > 0 ? colorConfig.border : colors.border.light}`,
      boxShadow:
        modificationCount > 0
          ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px ${colorConfig.border}`
          : `0 2px 12px ${colors.shadow.light}`,
      padding: `${spacing.sm} ${spacing.lg}`,
      transition: 'all 0.3s ease',
      margin: spacing.md,
      marginBottom: 0,
    },
  };

  return (
    <div style={dockStyles.statusHeader}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
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
            <IconScale size={18} color={colorConfig.icon} />
          </div>
          <EditableLabel
            value={policyLabel}
            onChange={setPolicyLabel}
            placeholder="Enter policy name..."
            emptyStateText="Click to name your policy..."
          />
        </Group>
        <Group gap="md" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {modificationCount > 0 ? (
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
    </div>
  );
}
