import { useState } from 'react';
import { Stack } from '@mantine/core';
import { SimulationAdapter } from '@/adapters';
import PathwayView from '@/components/common/PathwayView';
import { ButtonPanelVariant } from '@/components/flowView';
import { MOCK_USER_ID } from '@/constants';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import { Simulation } from '@/types/ingredients/Simulation';
import { PolicyStateProps, PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';
import { SimulationCreationPayload } from '@/types/payloads';
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
 * Creates a policy state for current law
 */
function createCurrentLawPolicy(currentLawId: number): PolicyStateProps {
  return {
    id: currentLawId.toString(),
    label: 'Current law',
    parameters: [],
  };
}

/**
 * Creates a population state for nationwide geography
 */
function createNationwidePopulation(
  countryId: string,
  geographyId: string,
  countryName: string
): PopulationStateProps {
  return {
    label: `${countryName} nationwide`,
    type: 'geography',
    household: null,
    geography: {
      id: geographyId,
      countryId: countryId as any,
      scope: 'national',
      geographyId: countryId,
      name: 'National',
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
  currentLawId: number;
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
  const userId = MOCK_USER_ID.toString();
  const { data: userSimulations } = useUserSimulations(userId);
  const hasExistingSimulations = (userSimulations?.length ?? 0) > 0;

  const [selectedAction, setSelectedAction] = useState<SetupAction | null>(null);
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);

  const { mutateAsync: createGeographicAssociation } = useCreateGeographicAssociation();
  const simulationLabel = getDefaultBaselineLabel(countryId);
  const { createSimulation } = useCreateSimulation(simulationLabel);

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
    const geographyId = existingBaseline.geography?.geographyId || countryId;

    const policy = createCurrentLawPolicy(currentLawId);
    const population = createNationwidePopulation(countryId, geographyId, countryName);
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
   * Creates a new default baseline simulation
   */
  async function createNewBaseline() {
    if (!onSelectDefaultBaseline) {
      return;
    }

    setIsCreatingBaseline(true);
    const countryName = countryNames[countryId] || countryId.toUpperCase();

    try {
      // Create geography association
      const geographyResult = await createGeographicAssociation({
        id: `${userId}-${Date.now()}`,
        userId,
        countryId: countryId as any,
        geographyId: countryId,
        scope: 'national',
        label: `${countryName} nationwide`,
      });

      // Create simulation
      const simulationData: Partial<Simulation> = {
        populationId: geographyResult.geographyId,
        policyId: currentLawId.toString(),
        populationType: 'geography',
      };

      const serializedPayload: SimulationCreationPayload =
        SimulationAdapter.toCreationPayload(simulationData);

      createSimulation(serializedPayload, {
        onSuccess: (data) => {
          const simulationId = data.result.simulation_id;

          const policy = createCurrentLawPolicy(currentLawId);
          const population = createNationwidePopulation(
            countryId,
            geographyResult.geographyId,
            countryName
          );
          const simulationState = createSimulationState(
            simulationId,
            simulationLabel,
            countryId,
            policy,
            population
          );

          if (onSelectDefaultBaseline) {
            onSelectDefaultBaseline(simulationState, simulationId);
          }
        },
        onError: (error) => {
          console.error('[ReportSimulationSelectionView] Failed to create simulation:', error);
          setIsCreatingBaseline(false);
        },
      });
    } catch (error) {
      console.error(
        '[ReportSimulationSelectionView] Failed to create geographic association:',
        error
      );
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
    {
      title: 'Create new simulation',
      description: 'Build a new simulation',
      onClick: handleClickCreateNew,
      isSelected: selectedAction === 'createNew',
    },
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
