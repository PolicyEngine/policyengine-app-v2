/**
 * SimulationSetupView - View for configuring simulation policy and population
 * Duplicated from SimulationSetupFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { SimulationStateProps } from '@/types/pathwayState';
import {
  isPolicyConfigured,
  isPopulationConfigured,
} from '@/utils/validation/ingredientValidation';

type SetupCard = 'population' | 'policy';

interface SimulationSetupViewProps {
  simulation: SimulationStateProps;
  simulationIndex: 0 | 1;
  isReportMode: boolean;
  onNavigateToPolicy: () => void;
  onNavigateToPopulation: () => void;
  onNext: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function SimulationSetupView({
  simulation,
  simulationIndex,
  isReportMode,
  onNavigateToPolicy,
  onNavigateToPopulation,
  onNext,
  onBack,
  onCancel,
}: SimulationSetupViewProps) {
  const [selectedCard, setSelectedCard] = useState<SetupCard | null>(null);

  const policy = simulation.policy;
  const population = simulation.population;

  // Detect if we're in report mode for simulation 2 (population will be inherited)
  const isSimulation2InReport = isReportMode && simulationIndex === 1;

  const handlePopulationSelect = () => {
    setSelectedCard('population');
  };

  const handlePolicySelect = () => {
    setSelectedCard('policy');
  };

  const handleNext = () => {
    if (selectedCard === 'population' && !isPopulationConfigured(population)) {
      onNavigateToPopulation();
    } else if (selectedCard === 'policy' && !isPolicyConfigured(policy)) {
      onNavigateToPolicy();
    } else if (isPolicyConfigured(policy) && isPopulationConfigured(population)) {
      // Both are fulfilled, proceed to next step
      onNext();
    }
  };

  const canProceed: boolean = isPolicyConfigured(policy) && isPopulationConfigured(population);

  function generatePopulationCardTitle() {
    if (!isPopulationConfigured(population)) {
      return 'Add household(s)';
    }

    // In simulation 2 of a report, indicate population is inherited from baseline
    if (isSimulation2InReport) {
      return `${population.label || 'Household(s)'} (from baseline)`;
    }

    if (population.label) {
      return population.label;
    }
    if (population.household) {
      return `Household #${population.household.id}`;
    }
    if (population.geography) {
      return `Household(s) #${population.geography.id}`;
    }
    return '';
  }

  function generatePopulationCardDescription() {
    if (!isPopulationConfigured(population)) {
      return 'Select a household collection or custom household';
    }

    // In simulation 2 of a report, indicate population is inherited from baseline
    if (isSimulation2InReport) {
      const popId = population.household?.id || population.geography?.id;
      const popType = population.household ? 'Household' : 'Household collection';
      return `${popType} #${popId} • Inherited from baseline simulation`;
    }

    if (population.label && population.household) {
      return `Household #${population.household.id}`;
    }
    if (population.label && population.geography) {
      return `Household collection #${population.geography.id}`;
    }
    return '';
  }

  function generatePolicyCardTitle() {
    if (!isPolicyConfigured(policy)) {
      return 'Add policy';
    }
    if (policy.label) {
      return policy.label;
    }
    if (policy.id) {
      return `Policy #${policy.id}`;
    }
    return '';
  }

  function generatePolicyCardDescription() {
    if (!isPolicyConfigured(policy)) {
      return 'Select a policy to apply to the simulation';
    }
    if (policy.label && policy.id) {
      return `Policy #${policy.id}`;
    }
    return '';
  }

  const setupConditionCards = [
    {
      title: generatePopulationCardTitle(),
      description: generatePopulationCardDescription(),
      onClick: handlePopulationSelect,
      isSelected: selectedCard === 'population',
      isFulfilled: isPopulationConfigured(population),
      isDisabled: false,
    },
    {
      title: generatePolicyCardTitle(),
      description: generatePolicyCardDescription(),
      onClick: handlePolicySelect,
      isSelected: selectedCard === 'policy',
      isFulfilled: isPolicyConfigured(policy),
      isDisabled: false,
    },
  ];

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    if (selectedCard === 'population' && !isPopulationConfigured(population)) {
      return {
        label: 'Configure household(s) ',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (selectedCard === 'policy' && !isPolicyConfigured(policy)) {
      return {
        label: 'Configure policy ',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (canProceed) {
      return {
        label: 'Next ',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    // Default disabled state - show uppermost option (household(s))
    return {
      label: 'Configure household(s) ',
      onClick: handleNext,
      isDisabled: true,
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <PathwayView
      title="Configure simulation"
      variant="setupConditions"
      setupConditionCards={setupConditionCards}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
    />
  );
}
