/**
 * SimulationBlock - A simulation configuration card
 */

import { IconCheck, IconTrash } from '@tabler/icons-react';
import { Button, Group, Text, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import { styles } from '../styles';
import type { SimulationBlockProps } from '../types';
import { EditableLabel } from './EditableLabel';
import { IngredientSection } from './IngredientSection';

export function SimulationBlock({
  simulation,
  index,
  countryId,
  onLabelChange,
  onQuickSelectPolicy,
  onSelectSavedPolicy,
  onQuickSelectPopulation,
  onSelectRecentPopulation,
  onEditPolicy,
  onViewPolicy: _onViewPolicy,
  onViewPopulation: _onViewPopulation,
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

  // Determine inherited population type for display
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
        <EditableLabel
          value={simulation.label || ''}
          onChange={onLabelChange}
          placeholder={defaultLabel}
          emptyStateText={defaultLabel}
        />

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
          {canRemove && (
            <Button variant="ghost" size="icon-sm" onClick={onRemove} className="tw:text-red-500">
              <IconTrash size={14} />
            </Button>
          )}
        </Group>
      </div>

      {/* Panels - direct children for subgrid alignment */}
      <IngredientSection
        type="policy"
        currentId={currentPolicyId}
        countryId={countryId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onEditPolicy={onEditPolicy}
        onDeselectPolicy={onDeselectPolicy}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
      />

      <IngredientSection
        type="population"
        currentId={currentPopulationId}
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
    </div>
  );
}
