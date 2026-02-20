/**
 * IngredientSectionFull - Full-width ingredient section variant
 *
 * Instead of a 3-column chip grid, each section either shows:
 * - Empty state: large clickable area with "Add X ingredient" prompt
 * - Selected state: full-width card displaying the chosen item
 *
 * Same props interface as IngredientSection for drop-in replacement.
 */

import {
  IconArrowsExchange,
  IconChartLine,
  IconFileDescription,
  IconHome,
  IconPencil,
  IconPlus,
  IconScale,
  IconSparkles,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { Box, Group, Text, Tooltip } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { COUNTRY_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { CURRENT_LAW_LABEL, isCurrentLaw } from '../currentLaw';
import { styles } from '../styles';
import type { IngredientSectionProps } from '../types';
import { CountryMapIcon } from './shared';

export function IngredientSectionFull({
  type,
  currentId,
  countryId = 'us',
  onQuickSelectPolicy: _onQuickSelectPolicy,
  onSelectSavedPolicy: _onSelectSavedPolicy,
  onEditPolicy,
  onQuickSelectPopulation: _onQuickSelectPopulation,
  onSelectRecentPopulation: _onSelectRecentPopulation,
  onDeselectPopulation,
  onDeselectPolicy,
  onBrowseMore,
  isInherited,
  inheritedPopulationType: _inheritedPopulationType,
  inheritedPopulationLabel: _inheritedPopulationLabel,
  savedPolicies = [],
  recentPopulations = [],
  currentLabel,
  isReadOnly,
}: IngredientSectionProps) {
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const colorConfig = INGREDIENT_COLORS[type];
  const IconComponent = {
    policy: IconScale,
    population: IconUsers,
    dynamics: IconChartLine,
  }[type];

  const typeLabels = {
    policy: 'Policy',
    population: 'Household(s)',
    dynamics: 'Dynamics',
  };

  // Determine what's currently selected for policy
  const selectedPolicyLabel = (() => {
    if (type !== 'policy' || !currentId) {
      return null;
    }
    if (isCurrentLaw(currentId)) {
      return { label: CURRENT_LAW_LABEL, description: 'No changes' };
    }
    const saved = savedPolicies.find((p) => p.id === currentId);
    if (saved) {
      return {
        label: saved.label,
        description: `${saved.paramCount} param${saved.paramCount !== 1 ? 's' : ''} changed`,
      };
    }
    return { label: currentLabel || `Policy #${currentId}`, description: '' };
  })();

  // Determine what's currently selected for population
  const selectedPopulationLabel = (() => {
    if (type !== 'population' || !currentId) {
      return null;
    }
    if (currentId === countryConfig.geographyId) {
      return {
        label: countryConfig.nationwideTitle,
        description: countryConfig.nationwideSubtitle,
        populationType: 'geography',
      };
    }
    const recent = recentPopulations.find((p) => p.id === currentId);
    if (recent) {
      return {
        label: recent.label,
        description: recent.type === 'household' ? 'Household' : 'Geography',
        populationType: recent.type,
      };
    }
    return {
      label: currentLabel || `Population #${currentId}`,
      description: '',
      populationType: 'geography',
    };
  })();

  const hasSelection =
    type === 'policy' ? !!currentId : type === 'population' ? !!currentId : false;

  const handleEmptyClick = () => {
    if (isReadOnly) {
      return;
    }
    if (type === 'policy') {
      onBrowseMore?.();
    } else if (type === 'population') {
      onBrowseMore?.();
    }
  };

  const handleDeselect = () => {
    if (type === 'policy') {
      onDeselectPolicy?.();
    } else if (type === 'population') {
      onDeselectPopulation?.();
    }
  };

  return (
    <Box
      style={{
        ...styles.ingredientSection,
        borderColor: colors.border.light,
        background: colors.white,
      }}
    >
      {/* Section header */}
      <Box style={styles.ingredientSectionHeader}>
        <Box
          style={{
            ...styles.ingredientSectionIcon,
            background: colorConfig.bg,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <IconComponent size={16} color={colorConfig.icon} stroke={2} />
        </Box>
        <Text
          fw={600}
          c={colorConfig.icon}
          style={{ fontSize: FONT_SIZES.normal, userSelect: 'none' }}
        >
          {typeLabels[type]}
        </Text>
        {isInherited && <Text style={styles.inheritedBadge}>(inherited from baseline)</Text>}
      </Box>

      {/* Content area */}
      {type === 'dynamics' ? (
        <Box
          style={{
            padding: spacing.md,
            background: colors.white,
            borderRadius: spacing.radius.md,
            border: `1px dashed ${colorConfig.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Group gap={spacing.sm}>
            <IconSparkles size={18} color={colorConfig.accent} />
            <Text c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal }}>
              Dynamics coming soon
            </Text>
          </Group>
        </Box>
      ) : hasSelection ? (
        /* Selected item - full-width card */
        <Box
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: spacing.radius.md,
            background: isInherited ? colors.gray[50] : colorConfig.bg,
            border: isInherited
              ? `1px solid ${colors.gray[200]}`
              : `2px solid ${colorConfig.border}`,
            boxShadow: isInherited ? undefined : `0 0 0 2px ${colorConfig.bg}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: spacing.radius.md,
              background: colors.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {type === 'policy' &&
              (isCurrentLaw(currentId) ? (
                <IconScale size={18} color={colorConfig.icon} />
              ) : (
                <IconFileDescription size={18} color={colorConfig.icon} />
              ))}
            {type === 'population' &&
              (selectedPopulationLabel?.populationType === 'household' ? (
                <IconHome size={18} color={colorConfig.icon} />
              ) : (
                <CountryMapIcon countryId={countryId} size={18} color={colorConfig.icon} />
              ))}
          </Box>
          <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Text
              fw={600}
              c={colorConfig.icon}
              style={{
                fontSize: FONT_SIZES.normal,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {type === 'policy' ? selectedPolicyLabel?.label : selectedPopulationLabel?.label}
            </Text>
            {(type === 'policy'
              ? selectedPolicyLabel?.description
              : selectedPopulationLabel?.description) && (
              <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.small }}>
                {type === 'policy'
                  ? selectedPolicyLabel?.description
                  : selectedPopulationLabel?.description}
              </Text>
            )}
          </Box>
          {!isInherited && !isReadOnly && (
            <Box
              style={{
                display: 'flex',
                gap: spacing.xs,
                flexShrink: 0,
              }}
            >
              {type === 'policy' && !isCurrentLaw(currentId) && onEditPolicy && (
                <Tooltip label="Edit policy" position="bottom" withArrow>
                  <Box
                    component="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEditPolicy();
                    }}
                    style={{
                      background: colors.white,
                      border: `1px solid ${colorConfig.border}`,
                      borderRadius: spacing.radius.sm,
                      width: 34,
                      height: 34,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colorConfig.icon,
                    }}
                  >
                    <IconPencil size={14} />
                  </Box>
                </Tooltip>
              )}
              <Tooltip label={`Swap ${type}`} position="bottom" withArrow>
                <Box
                  component="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onBrowseMore?.();
                  }}
                  style={{
                    background: colors.white,
                    border: `1px solid ${colorConfig.border}`,
                    borderRadius: spacing.radius.sm,
                    width: 34,
                    height: 34,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colorConfig.icon,
                  }}
                >
                  <IconArrowsExchange size={14} />
                </Box>
              </Tooltip>
              <Tooltip label="Remove" position="bottom" withArrow>
                <Box
                  component="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeselect();
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: spacing.radius.sm,
                    width: 34,
                    height: 34,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.gray[400],
                  }}
                >
                  <IconX size={14} />
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>
      ) : (
        /* Empty state - clickable area to add ingredient */
        <Box
          onClick={handleEmptyClick}
          style={{
            padding: `${spacing.xl} ${spacing.lg}`,
            borderRadius: spacing.radius.md,
            border: `2px dashed ${colorConfig.border}`,
            background: colorConfig.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
            cursor: isReadOnly ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: 0.8,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.borderColor = colorConfig.icon;
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.borderColor = colorConfig.border;
          }}
        >
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: colors.white,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconPlus size={18} color={colorConfig.icon} />
          </Box>
          <Box>
            <Text fw={600} c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal }}>
              Add {type === 'policy' ? 'policy' : 'population'}
            </Text>
            <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.small }}>
              Click to browse and select
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
