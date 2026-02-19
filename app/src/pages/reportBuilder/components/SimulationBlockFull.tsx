/**
 * SimulationBlockFull - Simulation card with full-width ingredient sections
 *
 * Same structure as SimulationBlock but uses IngredientSectionFull
 * for a layout where each ingredient fills its entire section.
 */

import { IconCheck, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Paper, Text, Tooltip } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import { styles } from '../styles';
import { EditableLabel } from './EditableLabel';
import { IngredientSectionFull } from './IngredientSectionFull';
import type { SimulationBlockProps } from './SimulationBlock';

export function SimulationBlockFull({
  simulation,
  index,
  countryId,
  onLabelChange,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onSelectRecentPopulation,
  onDeselectPolicy,
  onDeselectPopulation,
  onBrowseMorePolicies,
  onBrowseMorePopulations,
  onRemove,
  canRemove,
  isRequired,
  populationInherited,
  inheritedPopulation,
  savedPolicies,
  recentPopulations,
}: SimulationBlockProps) {
  const isPolicyConfigured = !!simulation.policy.id;
  const effectivePopulation =
    populationInherited && inheritedPopulation ? inheritedPopulation : simulation.population;
  const isPopulationConfigured = !!(
    effectivePopulation?.household?.id || effectivePopulation?.geography?.id
  );
  const isFullyConfigured = isPolicyConfigured && isPopulationConfigured;

  const defaultLabel = index === 0 ? 'Baseline simulation' : 'Reform simulation';

  const currentPolicyId = simulation.policy.id;
  const currentPopulationId =
    effectivePopulation?.household?.id || effectivePopulation?.geography?.id;
  const populationLabel =
    effectivePopulation?.label || effectivePopulation?.geography?.name || undefined;

  const inheritedPopulationType =
    populationInherited && inheritedPopulation
      ? inheritedPopulation.household?.id
        ? 'household'
        : inheritedPopulation.geography?.id
          ? inheritedPopulation.geography.scope === 'subnational'
            ? 'subnational'
            : 'nationwide'
          : null
      : null;

  const inheritedPopulationLabel =
    populationInherited && inheritedPopulation
      ? inheritedPopulation.label || inheritedPopulation.geography?.name || undefined
      : undefined;

  return (
    <Paper
      style={{
        ...styles.simulationCard,
        ...(isFullyConfigured ? styles.simulationCardActive : {}),
      }}
    >
      {/* Status indicator */}
      <Box
        style={{
          position: 'absolute',
          top: -1,
          left: 20,
          right: 20,
          height: 4,
          borderRadius: '0 0 4px 4px',
          background: isFullyConfigured
            ? `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})`
            : colors.gray[200],
        }}
      />

      {/* Header */}
      <Box style={styles.simulationHeader}>
        <EditableLabel
          value={simulation.label || ''}
          onChange={onLabelChange}
          placeholder={defaultLabel}
          emptyStateText={defaultLabel}
        />

        <Group gap={spacing.xs}>
          {isRequired && (
            <Text c="dimmed" fs="italic" style={{ fontSize: FONT_SIZES.small }}>
              Required
            </Text>
          )}
          {isFullyConfigured && (
            <Tooltip label="Fully configured">
              <Box
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: colors.success,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCheck size={12} color="white" stroke={3} />
              </Box>
            </Tooltip>
          )}
          {canRemove && (
            <ActionIcon size="sm" variant="subtle" color="red" onClick={onRemove}>
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* Full-width ingredient sections */}
      <IngredientSectionFull
        type="policy"
        currentId={currentPolicyId}
        currentLabel={simulation.policy.label || undefined}
        countryId={countryId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onDeselectPolicy={onDeselectPolicy}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
      />

      <IngredientSectionFull
        type="population"
        currentId={currentPopulationId}
        currentLabel={populationLabel}
        countryId={countryId}
        onQuickSelectPopulation={onQuickSelectPopulation}
        onSelectRecentPopulation={onSelectRecentPopulation}
        onDeselectPopulation={onDeselectPopulation}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePopulations}
        isInherited={populationInherited}
        inheritedPopulationType={inheritedPopulationType}
        inheritedPopulationLabel={inheritedPopulationLabel}
        recentPopulations={recentPopulations}
      />

      <IngredientSectionFull type="dynamics" countryId={countryId} onCreateCustom={() => {}} />
    </Paper>
  );
}
