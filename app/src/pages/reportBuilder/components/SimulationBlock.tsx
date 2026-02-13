/**
 * SimulationBlock - A simulation configuration card
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { IconCheck, IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Paper, Text, TextInput, Tooltip } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import type { PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';
import { FONT_SIZES } from '../constants';
import { styles } from '../styles';
import type { RecentPopulation, SavedPolicy, ViewMode } from '../types';
import { IngredientSection } from './IngredientSection';

interface SimulationBlockProps {
  simulation: SimulationStateProps;
  index: number;
  countryId: 'us' | 'uk';
  onLabelChange: (label: string) => void;
  onQuickSelectPolicy: (policyType: 'current-law') => void;
  onSelectSavedPolicy: (id: string, label: string, paramCount: number) => void;
  onQuickSelectPopulation: (populationType: 'nationwide') => void;
  onSelectRecentPopulation: (population: PopulationStateProps) => void;
  onDeselectPolicy: () => void;
  onDeselectPopulation: () => void;
  onCreateCustomPolicy: () => void;
  onBrowseMorePolicies: () => void;
  onBrowseMorePopulations: () => void;
  onRemove?: () => void;
  canRemove: boolean;
  isRequired?: boolean;
  populationInherited?: boolean;
  inheritedPopulation?: PopulationStateProps | null;
  savedPolicies: SavedPolicy[];
  recentPopulations: RecentPopulation[];
  viewMode: ViewMode;
}

export function SimulationBlock({
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
  viewMode,
}: SimulationBlockProps) {

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(simulation.label || '');
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const isPolicyConfigured = !!simulation.policy.id;
  const effectivePopulation =
    populationInherited && inheritedPopulation ? inheritedPopulation : simulation.population;
  const isPopulationConfigured = !!(
    effectivePopulation?.household?.id || effectivePopulation?.geography?.id
  );
  const isFullyConfigured = isPolicyConfigured && isPopulationConfigured;

  const handleLabelSubmit = () => {
    onLabelChange(labelInput || (index === 0 ? 'Baseline simulation' : 'Reform simulation'));
    setIsEditingLabel(false);
  };

  const defaultLabel = index === 0 ? 'Baseline simulation' : 'Reform simulation';

  // Measure text width for auto-sizing input
  useLayoutEffect(() => {
    if (measureRef.current && isEditingLabel) {
      const textToMeasure = labelInput || defaultLabel;
      measureRef.current.textContent = textToMeasure;
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [labelInput, defaultLabel, isEditingLabel]);

  const currentPolicyId = simulation.policy.id;
  const currentPopulationId =
    effectivePopulation?.household?.id || effectivePopulation?.geography?.id;

  // Determine inherited population type for display
  const inheritedPopulationType =
    populationInherited && inheritedPopulation
      ? inheritedPopulation.household?.id
        ? 'household'
        : inheritedPopulation.geography?.id
          ? 'nationwide'
          : null
      : null;

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
        <Group gap={spacing.sm}>
          {isEditingLabel ? (
            <>
              {/* Hidden span for measuring text width */}
              <span
                ref={measureRef}
                style={{
                  position: 'absolute',
                  visibility: 'hidden',
                  whiteSpace: 'pre',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: FONT_SIZES.normal,
                }}
              />
              <TextInput
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                placeholder={defaultLabel}
                size="sm"
                autoFocus
                style={{ width: inputWidth ? inputWidth + 8 : 'auto' }}
                styles={{
                  input: {
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: FONT_SIZES.normal,
                  },
                }}
              />
              <ActionIcon
                size="sm"
                variant="subtle"
                color="teal"
                onClick={handleLabelSubmit}
                aria-label="Confirm simulation name"
              >
                <IconCheck size={14} />
              </ActionIcon>
            </>
          ) : (
            <Group gap={spacing.xs}>
              <Text style={{ ...styles.simulationTitle, marginRight: 8 }}>
                {simulation.label || defaultLabel}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setLabelInput(simulation.label || defaultLabel);
                  setIsEditingLabel(true);
                }}
              >
                <IconPencil size={12} />
              </ActionIcon>
            </Group>
          )}
        </Group>

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

      {/* Panels - direct children for subgrid alignment */}
      <IngredientSection
        type="policy"
        currentId={currentPolicyId}
        countryId={countryId}
        onQuickSelectPolicy={onQuickSelectPolicy}
        onSelectSavedPolicy={onSelectSavedPolicy}
        onDeselectPolicy={onDeselectPolicy}
        onCreateCustom={() => {}}
        onBrowseMore={onBrowseMorePolicies}
        savedPolicies={savedPolicies}
        viewMode={viewMode}
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
        recentPopulations={recentPopulations}
        viewMode={viewMode}
      />

      <IngredientSection
        type="dynamics"
        countryId={countryId}
        onCreateCustom={() => {}}
        viewMode={viewMode}
      />
    </Paper>
  );
}
