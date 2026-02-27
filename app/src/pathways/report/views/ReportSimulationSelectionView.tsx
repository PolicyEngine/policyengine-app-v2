import { useState } from 'react';
import { Stack } from '@mantine/core';
import { createEconomySimulation } from '@/api/v2/simulations';
import PathwayView from '@/components/common/PathwayView';
import { ButtonPanelVariant } from '@/components/flowView';
import { useUserId } from '@/hooks/useUserId';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { PolicyStateProps, PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';
import {
  countryNames,
  getDefaultBaselineLabel,
  isDefaultBaselineSimulation,
} from '@/utils/isDefaultBaselineSimulation';
import DefaultBaselineOption from '../components/DefaultBaselineOption';

/**
 * Helper functions for creating default baseline simulation
 */

/**
 * Creates a policy state for current law.
 * In V2 API, current law is represented by id = null.
 */
function createCurrentLawPolicy(_currentLawId: null): PolicyStateProps {
  return {
    id: null,
    label: 'Current law',
    parameters: [],
  };
}

/**
 * Creates a population state for nationwide geography
 */
function createNationwidePopulation(
  countryId: string,
  regionCode: string,
  countryName: string
): PopulationStateProps {
  return {
    label: `${countryName} households`,
    type: 'geography',
    household: null,
    geography: {
      countryId: countryId as any,
      regionCode,
    },
  };
}

/**
 * Creates a simulation state from policy and population
 */
function createSimulationState(
  simulationId: string,
  simulationLabel: string,
  countryId: string,
  policy: PolicyStateProps,
  population: PopulationStateProps
): SimulationStateProps {
  return {
    id: simulationId,
    label: simulationLabel,
    countryId,
    apiVersion: undefined,
    status: undefined,
    output: null,
    policy,
    population,
  };
}

type SetupAction = 'createNew' | 'loadExisting' | 'defaultBaseline';

interface ReportSimulationSelectionViewProps {
  simulationIndex: 0 | 1;
  countryId: string;
  currentLawId: null;
  onCreateNew: () => void;
  onLoadExisting: () => void;
  onSelectDefaultBaseline?: (simulationState: SimulationStateProps, simulationId: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReportSimulationSelectionView({
  simulationIndex,
  countryId,
  currentLawId,
  onCreateNew,
  onLoadExisting,
  onSelectDefaultBaseline,
  onBack,
  onCancel,
}: ReportSimulationSelectionViewProps) {
  const userId = useUserId();
  const { data: userSimulations } = useUserSimulations(userId);
  const hasExistingSimulations = (userSimulations?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);

  const simulationLabel = getDefaultBaselineLabel(countryId);

  // Find existing default baseline simulation for this country
  const existingBaseline = userSimulations?.find((sim) =>
    isDefaultBaselineSimulation(sim, countryId, currentLawId)
  );
  const existingSimulationId = existingBaseline?.userSimulation?.simulationId;

  const isBaseline = simulationIndex === 0;

  function handleClickCreateNew() {
    setSelectedAction('createNew');
  }

  function handleClickExisting() {
    if (hasExistingSimulations) {
      setSelectedAction('loadExisting');
    }
  }

  function handleClickDefaultBaseline() {
    setSelectedAction('defaultBaseline');
  }

  /**
   * Reuses an existing default baseline simulation
   */
  function reuseExistingBaseline() {
    if (!existingBaseline || !existingSimulationId || !onSelectDefaultBaseline) {
      return;
    }

    const countryName = countryNames[countryId] || countryId.toUpperCase();
    const regionCode = existingBaseline.geography?.regionCode || countryId;

    const policy = createCurrentLawPolicy(currentLawId);
    const population = createNationwidePopulation(countryId, regionCode, countryName);
    const simulationState = createSimulationState(
      existingSimulationId,
      simulationLabel,
      countryId,
      policy,
      population
    );

    onSelectDefaultBaseline(simulationState, existingSimulationId);
  }

  /**
   * Creates a new default baseline simulation via v2 economy simulation endpoint.
   * In v2, current law = null policy_id. The API creates the simulation server-side.
   */
  async function createNewBaseline() {
    if (!onSelectDefaultBaseline) {
      return;
    }

    setIsCreatingBaseline(true);
    const countryName = countryNames[countryId] || countryId.toUpperCase();
    const regionCode = countryId; // National geography uses countryId as regionCode

    try {
      const response = await createEconomySimulation({
        tax_benefit_model_name: `policyengine_${countryId}`,
        region: regionCode,
        policy_id: null, // current law
      });

      const simulationId = response.id;

      const policy = createCurrentLawPolicy(currentLawId);
      const population = createNationwidePopulation(countryId, regionCode, countryName);
      const simulationState = createSimulationState(
        simulationId,
        simulationLabel,
        countryId,
        policy,
        population
      );

      onSelectDefaultBaseline(simulationState, simulationId);
    } catch (error) {
      console.error('[ReportSimulationSelectionView] Failed to create simulation:', error);
      setIsCreatingBaseline(false);
    }
  }

  async function handleClickSubmit() {
    if (selectedAction === 'createNew') {
      onCreateNew();
    } else if (selectedAction === 'loadExisting') {
      onLoadExisting();
    } else if (selectedAction === 'defaultBaseline') {
      // Reuse existing or create new default baseline simulation
      if (existingBaseline && existingSimulationId) {
        reuseExistingBaseline();
      } else {
        await createNewBaseline();
      }
    }
  }

  const buttonPanelCards = [
    {
      title: 'Create new simulation',
      description: 'Build a new simulation',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
    // Only show "Load existing" if user has existing simulations
    ...(hasExistingSimulations
      ? [
          {
            title: 'Load existing simulation',
            description: 'Use a simulation you have already created',
            onClick: handleClickExisting,
            isSelected: selectedAction === 'loadExisting',
          },
        ]
      : []),
  ];

  const hasExistingBaselineText = existingBaseline && existingSimulationId;

  const primaryAction = {
    label: isCreatingBaseline
      ? hasExistingBaselineText
        ? 'Applying simulation...'
        : 'Creating simulation...'
      : 'Next',
    onClick: handleClickSubmit,
    isLoading: isCreatingBaseline,
    isDisabled: !selectedAction || isCreatingBaseline,
  };

  // For baseline simulation, combine default baseline option with other cards
  if (isBaseline) {
    return (
      <PathwayView
        title="Select simulation"
        content={
          <Stack>
            <DefaultBaselineOption
              countryId={countryId}
              isSelected={selectedAction === 'defaultBaseline'}
              onClick={handleClickDefaultBaseline}
            />
            <ButtonPanelVariant cards={buttonPanelCards} />
          </Stack>
        }
        primaryAction={primaryAction}
        backAction={onBack ? { onClick: onBack } : undefined}
        cancelAction={onCancel ? { onClick: onCancel } : undefined}
      />
    );
  }

  // For reform simulation, just show the standard button panel
  return (
    <PathwayView
      title="Select simulation"
      variant="buttonPanel"
      buttonPanelCards={buttonPanelCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
