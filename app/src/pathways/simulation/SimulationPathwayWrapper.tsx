/**
 * SimulationPathwayWrapper - Pathway orchestrator for standalone simulation creation
 *
 * Manages local state for a single simulation (policy + population).
 * Reuses all shared views from the report pathway with mode="standalone".
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SimulationStateProps, PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { SimulationViewMode } from '@/types/pathwayModes/SimulationViewMode';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { RootState } from '@/store';
import StandardLayout from '@/components/StandardLayout';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { createPolicyCallbacks, createPopulationCallbacks, createSimulationCallbacks } from '@/utils/pathwayCallbacks';
import { convertSimulationStateToApi } from '@/utils/ingredientReconstruction';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

// Simulation views
import SimulationLabelView from '../report/views/simulation/SimulationLabelView';
import SimulationSetupView from '../report/views/simulation/SimulationSetupView';
import SimulationSubmitView from '../report/views/simulation/SimulationSubmitView';
import SimulationPolicySetupView from '../report/views/simulation/SimulationPolicySetupView';
import SimulationPopulationSetupView from '../report/views/simulation/SimulationPopulationSetupView';

// Policy views
import PolicyLabelView from '../report/views/policy/PolicyLabelView';
import PolicyParameterSelectorView from '../report/views/policy/PolicyParameterSelectorView';
import PolicySubmitView from '../report/views/policy/PolicySubmitView';
import PolicyExistingView from '../report/views/policy/PolicyExistingView';

// Population views
import PopulationScopeView from '../report/views/population/PopulationScopeView';
import PopulationLabelView from '../report/views/population/PopulationLabelView';
import HouseholdBuilderView from '../report/views/population/HouseholdBuilderView';
import GeographicConfirmationView from '../report/views/population/GeographicConfirmationView';
import PopulationExistingView from '../report/views/population/PopulationExistingView';

import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Parameter } from '@/types/subIngredients/parameter';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([SimulationViewMode.POLICY_PARAMETER_SELECTOR]);

interface SimulationPathwayWrapperProps {
  onComplete?: () => void;
}

export default function SimulationPathwayWrapper({ onComplete }: SimulationPathwayWrapperProps) {
  console.log('[SimulationPathwayWrapper] ========== RENDER ==========');

  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  // Initialize simulation state
  const [simulationState, setSimulationState] = useState<SimulationStateProps>(() => {
    const state = initializeSimulationState();
    state.countryId = countryId;
    return state;
  });

  const { createSimulation, isPending: isSubmitting } = useCreateSimulation();

  // Get metadata for population views
  const metadata = useSelector((state: RootState) => state.metadata);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode } = usePathwayNavigation(SimulationViewMode.LABEL);

  // ========== CALLBACK FACTORIES ==========
  // Simulation-level callbacks
  const simulationCallbacks = createSimulationCallbacks(
    setSimulationState,
    (state) => state,
    (state, simulation) => simulation,
    navigateToMode,
    SimulationViewMode.SETUP
  );

  // Policy callbacks
  const policyCallbacks = createPolicyCallbacks(
    setSimulationState,
    (state) => state.policy,
    (state, policy) => ({ ...state, policy }),
    navigateToMode,
    SimulationViewMode.SETUP
  );

  // Population callbacks
  const populationCallbacks = createPopulationCallbacks(
    setSimulationState,
    (state) => state.population,
    (state, population) => ({ ...state, population }),
    navigateToMode,
    SimulationViewMode.SETUP,
    SimulationViewMode.POPULATION_LABEL
  );

  // ========== SPECIAL HANDLERS ==========
  // Handle "Use Current Law" selection for policy
  const handleSelectCurrentLaw = useCallback(() => {
    if (!currentLawId) {
      console.error('[SimulationPathwayWrapper] No current law ID available');
      return;
    }

    setSimulationState((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        id: currentLawId.toString(),
        label: 'Current Law',
        parameters: [],
      },
    }));

    navigateToMode(SimulationViewMode.SETUP);
  }, [currentLawId, navigateToMode]);

  // Handle final simulation submission
  const handleSubmitSimulation = useCallback(async () => {
    console.log('[SimulationPathwayWrapper] Submitting simulation:', simulationState);

    // Build the payload for simulation creation
    const policyId = simulationState.policy.id;
    const populationId = simulationState.population.household?.id || simulationState.population.geography?.id;
    const populationType = simulationState.population.type;

    if (!policyId || !populationId || !populationType) {
      console.error('[SimulationPathwayWrapper] Missing required fields for simulation creation', {
        policyId,
        populationId,
        populationType,
      });
      return;
    }

    const payload = {
      policy_id: parseInt(policyId, 10),
      population_id: populationId,
      population_type: populationType as 'household' | 'geography',
    };

    try {
      const result = await createSimulation(payload);
      console.log('[SimulationPathwayWrapper] Simulation created successfully:', result);

      // Navigate back to simulations list page
      navigate(`/${countryId}/simulations`);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('[SimulationPathwayWrapper] Failed to create simulation:', error);
    }
  }, [simulationState, createSimulation, navigate, countryId, onComplete]);

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    // ========== SIMULATION-LEVEL VIEWS ==========
    case SimulationViewMode.LABEL:
      currentView = (
        <SimulationLabelView
          label={simulationState.label}
          mode="standalone"
          onUpdateLabel={simulationCallbacks.updateLabel}
          onNext={() => navigateToMode(SimulationViewMode.SETUP)}
        />
      );
      break;

    case SimulationViewMode.SETUP:
      currentView = (
        <SimulationSetupView
          simulation={simulationState}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={() => navigateToMode(SimulationViewMode.SETUP_POLICY)}
          onNavigateToPopulation={() => navigateToMode(SimulationViewMode.SETUP_POPULATION)}
          onNext={() => navigateToMode(SimulationViewMode.SUBMIT)}
        />
      );
      break;

    case SimulationViewMode.SUBMIT:
      currentView = (
        <SimulationSubmitView
          simulation={simulationState}
          onSubmitSuccess={handleSubmitSimulation}
        />
      );
      break;

    // ========== POLICY SETUP COORDINATION ==========
    case SimulationViewMode.SETUP_POLICY:
      currentView = (
        <SimulationPolicySetupView
          currentLawId={currentLawId}
          countryId={countryId}
          onSelectCurrentLaw={handleSelectCurrentLaw}
          onCreateNew={() => navigateToMode(SimulationViewMode.POLICY_LABEL)}
          onLoadExisting={() => navigateToMode(SimulationViewMode.SELECT_EXISTING_POLICY)}
        />
      );
      break;

    // ========== POPULATION SETUP COORDINATION ==========
    case SimulationViewMode.SETUP_POPULATION:
      currentView = (
        <SimulationPopulationSetupView
          isReportMode={false}
          otherSimulation={null}
          otherPopulation={null}
          onCreateNew={() => navigateToMode(SimulationViewMode.POPULATION_SCOPE)}
          onLoadExisting={() => navigateToMode(SimulationViewMode.SELECT_EXISTING_POPULATION)}
          onCopyExisting={() => {
            // Not applicable in standalone mode
            console.warn('[SimulationPathwayWrapper] Copy existing not applicable in standalone mode');
          }}
        />
      );
      break;

    // ========== POLICY CREATION VIEWS ==========
    case SimulationViewMode.POLICY_LABEL:
      currentView = (
        <PolicyLabelView
          label={simulationState.policy.label}
          mode="standalone"
          onUpdateLabel={policyCallbacks.updateLabel}
          onNext={() => navigateToMode(SimulationViewMode.POLICY_PARAMETER_SELECTOR)}
        />
      );
      break;

    case SimulationViewMode.POLICY_PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={simulationState.policy}
          onPolicyUpdate={policyCallbacks.updatePolicy}
          onNext={() => navigateToMode(SimulationViewMode.POLICY_SUBMIT)}
          onBack={() => navigateToMode(SimulationViewMode.POLICY_LABEL)}
        />
      );
      break;

    case SimulationViewMode.POLICY_SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={simulationState.policy}
          countryId={countryId}
          onSubmitSuccess={policyCallbacks.handleSubmitSuccess}
        />
      );
      break;

    case SimulationViewMode.SELECT_EXISTING_POLICY:
      currentView = (
        <PolicyExistingView
          onSelectPolicy={policyCallbacks.handleSelectExisting}
          onBack={() => navigateToMode(SimulationViewMode.SETUP_POLICY)}
        />
      );
      break;

    // ========== POPULATION CREATION VIEWS ==========
    case SimulationViewMode.POPULATION_SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={metadata.economyOptions?.region || []}
          onScopeSelected={populationCallbacks.handleScopeSelected}
        />
      );
      break;

    case SimulationViewMode.POPULATION_LABEL:
      currentView = (
        <PopulationLabelView
          population={simulationState.population}
          mode="standalone"
          onUpdateLabel={populationCallbacks.updateLabel}
          onNext={() => {
            // Navigate based on population type
            if (simulationState.population.type === 'household') {
              navigateToMode(SimulationViewMode.POPULATION_HOUSEHOLD_BUILDER);
            } else {
              navigateToMode(SimulationViewMode.POPULATION_GEOGRAPHIC_CONFIRM);
            }
          }}
          onBack={() => navigateToMode(SimulationViewMode.POPULATION_SCOPE)}
        />
      );
      break;

    case SimulationViewMode.POPULATION_HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={simulationState.population}
          countryId={countryId}
          onSubmitSuccess={populationCallbacks.handleHouseholdSubmitSuccess}
          onBack={() => navigateToMode(SimulationViewMode.POPULATION_LABEL)}
        />
      );
      break;

    case SimulationViewMode.POPULATION_GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={simulationState.population}
          metadata={metadata}
          onSubmitSuccess={populationCallbacks.handleGeographicSubmitSuccess}
          onBack={() => navigateToMode(SimulationViewMode.POPULATION_LABEL)}
        />
      );
      break;

    case SimulationViewMode.SELECT_EXISTING_POPULATION:
      currentView = (
        <PopulationExistingView
          onSelectHousehold={populationCallbacks.handleSelectExistingHousehold}
          onSelectGeography={populationCallbacks.handleSelectExistingGeography}
          onBack={() => navigateToMode(SimulationViewMode.SETUP_POPULATION)}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  // Conditionally wrap with StandardLayout
  // Views in MODES_WITH_OWN_LAYOUT manage their own AppShell
  if (MODES_WITH_OWN_LAYOUT.has(currentMode as SimulationViewMode)) {
    return currentView;
  }

  return <StandardLayout>{currentView}</StandardLayout>;
}
