/**
 * IngredientSection - A section displaying policy, population, or dynamics options
 */

import {
  IconChartLine,
  IconFileDescription,
  IconFolder,
  IconHome,
  IconScale,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import { Box, Group, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { COUNTRY_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { styles } from '../styles';
import type { IngredientSectionProps } from '../types';
import { BrowseMoreChip, OptionChipSquare } from './chips';
import { CountryMapIcon } from './shared';

export function IngredientSection({
  type,
  currentId,
  countryId = 'us',
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onSelectRecentPopulation,
  onDeselectPopulation,
  onDeselectPolicy,
  onBrowseMore,
  isInherited,
  inheritedPopulationType,
  savedPolicies = [],
  recentPopulations = [],
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

  const iconSize = 16;

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

      {/* Chips container */}
      {isInherited && inheritedPopulationType ? (
        <Box style={styles.chipGridSquare}>
          <Box
            style={{
              ...styles.chipSquare,
              opacity: 0.6,
              cursor: 'not-allowed',
              background: colors.gray[100],
              borderColor: colors.gray[200],
            }}
          >
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: spacing.radius.sm,
                background: colors.gray[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {inheritedPopulationType === 'household' ? (
                <IconHome size={16} color={colors.gray[500]} />
              ) : (
                <CountryMapIcon countryId={countryId} size={16} color={colors.gray[500]} />
              )}
            </Box>
            <Text
              ta="center"
              fw={600}
              c={colors.gray[500]}
              style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
            >
              {inheritedPopulationType === 'household'
                ? 'Household'
                : countryConfig.nationwideTitle}
            </Text>
            <Text
              ta="center"
              c={colors.gray[400]}
              style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
            >
              {inheritedPopulationType === 'household'
                ? 'Inherited'
                : countryConfig.nationwideSubtitle}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box style={styles.chipGridSquare}>
          {type === 'policy' && onQuickSelectPolicy && (
            <>
              {/* Current law - always first */}
              <OptionChipSquare
                icon={
                  <IconScale
                    size={iconSize}
                    color={currentId === 'current-law' ? colorConfig.icon : colors.gray[500]}
                  />
                }
                label="Current law"
                description="No changes"
                isSelected={currentId === 'current-law'}
                onClick={() => {
                  if (currentId === 'current-law' && onDeselectPolicy) {
                    onDeselectPolicy();
                  } else {
                    onQuickSelectPolicy('current-law');
                  }
                }}
                colorConfig={colorConfig}
              />
              {/* Saved policies - up to 3 shown (total 4 with Current law) */}
              {savedPolicies.slice(0, 3).map((policy) => (
                <OptionChipSquare
                  key={policy.id}
                  icon={
                    <IconFileDescription
                      size={iconSize}
                      color={currentId === policy.id ? colorConfig.icon : colors.gray[500]}
                    />
                  }
                  label={policy.label}
                  description={`${policy.paramCount} param${policy.paramCount !== 1 ? 's' : ''} changed`}
                  isSelected={currentId === policy.id}
                  onClick={() => {
                    if (currentId === policy.id && onDeselectPolicy) {
                      onDeselectPolicy();
                    } else {
                      onSelectSavedPolicy?.(policy.id, policy.label, policy.paramCount);
                    }
                  }}
                  colorConfig={colorConfig}
                />
              ))}
              {/* More options - always shown for searching/browsing all policies */}
              {onBrowseMore && (
                <BrowseMoreChip
                  label="More options"
                  description="View all your policies"
                  onClick={onBrowseMore}
                  variant="square"
                  colorConfig={colorConfig}
                />
              )}
            </>
          )}

          {type === 'population' && onQuickSelectPopulation && (
            <>
              {/* Nationwide - always first */}
              <OptionChipSquare
                icon={
                  <CountryMapIcon
                    countryId={countryId}
                    size={iconSize}
                    color={
                      currentId === countryConfig.nationwideId ? colorConfig.icon : colors.gray[500]
                    }
                  />
                }
                label={countryConfig.nationwideTitle}
                description={countryConfig.nationwideSubtitle}
                isSelected={currentId === countryConfig.nationwideId}
                onClick={() => {
                  if (currentId === countryConfig.nationwideId && onDeselectPopulation) {
                    onDeselectPopulation();
                  } else {
                    onQuickSelectPopulation('nationwide');
                  }
                }}
                colorConfig={colorConfig}
              />
              {/* Recent populations - up to 4 shown */}
              {recentPopulations.slice(0, 4).map((pop) => (
                <OptionChipSquare
                  key={pop.id}
                  icon={
                    pop.type === 'household' ? (
                      <IconHome
                        size={iconSize}
                        color={currentId === pop.id ? colorConfig.icon : colors.gray[500]}
                      />
                    ) : (
                      <IconFolder
                        size={iconSize}
                        color={currentId === pop.id ? colorConfig.icon : colors.gray[500]}
                      />
                    )
                  }
                  label={pop.label}
                  description={pop.type === 'household' ? 'Household' : 'Geography'}
                  isSelected={currentId === pop.id}
                  onClick={() => {
                    if (currentId === pop.id && onDeselectPopulation) {
                      onDeselectPopulation();
                    } else {
                      onSelectRecentPopulation?.(pop.population);
                    }
                  }}
                  colorConfig={colorConfig}
                />
              ))}
              {/* More options - always shown for searching/browsing all populations */}
              {onBrowseMore && (
                <BrowseMoreChip
                  label="More options"
                  description="Search all"
                  onClick={onBrowseMore}
                  variant="square"
                  colorConfig={colorConfig}
                />
              )}
            </>
          )}

          {type === 'dynamics' && (
            <Box
              style={{
                padding: spacing.md,
                background: colors.white,
                borderRadius: spacing.radius.md,
                border: `1px dashed ${colorConfig.border}`,
                gridColumn: '1 / -1',
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
          )}
        </Box>
      )}
    </Box>
  );
}
