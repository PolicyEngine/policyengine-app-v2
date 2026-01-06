/**
 * PopulationStatusHeader - Glassmorphic status bar for household creation mode
 */
import { IconHome } from '@tabler/icons-react';
import { Box, Group, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { EditableLabel } from '../../components/EditableLabel';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

interface PopulationStatusHeaderProps {
  householdLabel: string;
  setHouseholdLabel: (label: string) => void;
  memberCount: number;
}

export function PopulationStatusHeader({
  householdLabel,
  setHouseholdLabel,
  memberCount,
}: PopulationStatusHeaderProps) {
  const colorConfig = INGREDIENT_COLORS.population;

  const dockStyles = {
    statusHeader: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.lg,
      border: `1px solid ${memberCount > 0 ? colorConfig.border : colors.border.light}`,
      boxShadow:
        memberCount > 0
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
        {/* Left side: Household icon and editable name */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          {/* Household icon */}
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
            <IconHome size={18} color={colorConfig.icon} />
          </Box>

          {/* Editable household name */}
          <EditableLabel
            value={householdLabel}
            onChange={setHouseholdLabel}
            placeholder="Enter household name..."
            emptyStateText="Click to name your household..."
          />
        </Group>

        {/* Right side: Member count */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
            {memberCount > 0 ? (
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
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                No members yet
              </Text>
            )}
          </Group>
        </Group>
      </Group>
    </Box>
  );
}
