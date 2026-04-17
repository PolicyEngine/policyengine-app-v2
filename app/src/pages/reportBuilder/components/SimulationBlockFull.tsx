/**
 * SimulationBlockFull - Simulation card with full-width ingredient sections
 *
 * Same structure as SimulationBlock but uses IngredientSectionFull
 * for a layout where each ingredient fills its entire section.
 */

import { IconCheck, IconTrash } from '@tabler/icons-react';
import { Button, Group, Text, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import { styles } from '../styles';
import type { SimulationBlockProps } from '../types';
import { EditableLabel } from './EditableLabel';
import { IngredientSectionFull } from './IngredientSectionFull';

export function SimulationBlockFull({
  simulation,
  index,
  countryId,
  onLabelChange,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onSelectRecentPopulation,
  onEditPolicy,
  onViewPolicy,
  onViewPopulation,
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
  isReadOnly,
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
    <div
      style={{
        ...styles.simulationCard,
        ...(isFullyConfigured ? styles.simulationCardActive : {}),
      }}
    >
      {/* Status indicator */}
      <div
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
      <div style={styles.simulationHeader}>
        {isReadOnly ? (
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
            {simulation.label || defaultLabel}
          </Text>
        ) : (
          <EditableLabel
            value={simulation.label || ''}
            onChange={onLabelChange}
            placeholder={defaultLabel}
            emptyStateText={defaultLabel}
          />
        )}

        <Group gap="xs">
          {isRequired && (
            <Text c="dimmed" style={{ fontSize: FONT_SIZES.small, fontStyle: 'italic' }}>
              Required
            </Text>
          )}
          {isFullyConfigured && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: colors.primary[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconCheck size={12} color="white" stroke={3} />
                </div>
              </TooltipTrigger>
              <TooltipContent>Fully configured</TooltipContent>
            </Tooltip>
          )}
          {canRemove && !isReadOnly && (
            <Button variant="ghost" size="icon-sm" onClick={onRemove} className="tw:text-red-500">
              <IconTrash size={14} />
            </Button>
          )}
        </Group>
      </div>

      {/* Full-width ingredient sections */}
      <IngredientSectionFull
        type="policy"
        currentId={currentPolicyId}
        currentLabel={simulation.policy.label || undefined}
        countryId={countryId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onEditPolicy={onEditPolicy}
        onViewPolicy={onViewPolicy}
        onDeselectPolicy={onDeselectPolicy}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
        isReadOnly={isReadOnly}
      />

      <IngredientSectionFull
        type="population"
        currentId={currentPopulationId}
        currentLabel={populationLabel}
        countryId={countryId}
        onQuickSelectPopulation={onQuickSelectPopulation}
        onSelectRecentPopulation={onSelectRecentPopulation}
        onDeselectPopulation={onDeselectPopulation}
        onViewPopulation={onViewPopulation}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePopulations}
        isInherited={populationInherited}
        inheritedPopulationType={inheritedPopulationType}
        inheritedPopulationLabel={inheritedPopulationLabel}
        recentPopulations={recentPopulations}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
