/**
 * SimulationPathwayWrapper - Pathway orchestrator for standalone simulation creation
 *
 * Manages local state for a single simulation (policy + population).
 * Reuses all shared views from the report pathway with mode="standalone".
 */

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import StandardLayout from '@/components/StandardLayout';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { useCurrentLawId, useRegionsList } from '@/hooks/useStaticMetadata';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { RootState } from '@/store';
import { SimulationViewMode } from '@/types/pathwayModes/SimulationViewMode';
import { SimulationStateProps } from '@/types/pathwayState';
import {
  createPolicyCallbacks,
  createPopulationCallbacks,
  createSimulationCallbacks,
} from '@/utils/pathwayCallbacks';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import PolicyExistingView from '../report/views/policy/PolicyExistingView';
// Policy views
import PolicyLabelView from '../report/views/policy/PolicyLabelView';
import PolicyParameterSelectorView from '../report/views/policy/PolicyParameterSelectorView';
import PolicySubmitView from '../report/views/policy/PolicySubmitView';
import GeographicConfirmationView from '../report/views/population/GeographicConfirmationView';
import HouseholdBuilderView from '../report/views/population/HouseholdBuilderView';
import PopulationExistingView from '../report/views/population/PopulationExistingView';
import PopulationLabelView from '../report/views/population/PopulationLabelView';
// Population views
import PopulationScopeView from '../report/views/population/PopulationScopeView';
// Simulation views
import SimulationLabelView from '../report/views/simulation/SimulationLabelView';
import SimulationPolicySetupView from '../report/views/simulation/SimulationPolicySetupView';
import SimulationPopulationSetupView from '../report/views/simulation/SimulationPopulationSetupView';
import SimulationSetupView from '../report/views/simulation/SimulationSetupView';
import SimulationSubmitView from '../report/views/simulation/SimulationSubmitView';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([SimulationViewMode.POLICY_PARAMETER_SELECTOR]);

interface SimulationPathwayWrapperProps {
  onComplete?: () => void;
}

export default function SimulationPathwayWrapper({ onComplete }: SimulationPathwayWrapperProps) {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  // Initialize simulation state
  const [simulationState, setSimulationState] = useState<SimulationStateProps>(() => {
    const state = initializeSimulationState();
    state.countryId = countryId;
    return state;
  });

  // Get metadata for population views
  const currentLawId = useCurrentLawId(countryId);
  const regionData = useRegionsList(countryId);

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(
    SimulationViewMode.LABEL
  );

  // ========== FETCH USER DATA FOR CONDITIONAL NAVIGATION ==========
  const userId = MOCK_USER_ID.toString();
  const { data: userPolicies } = useUserPolicies(userId);
  const { data: userHouseholds } = useUserHouseholds(userId);

  const hasExistingPolicies = (userPolicies?.length ?? 0) > 0;
  // Note: Geographic populations are no longer stored as user associations.
  // They are selected per-simulation. We only check for existing households.
  const hasExistingPopulations = (userHouseholds?.length ?? 0) > 0;

  // ========== CONDITIONAL NAVIGATION HANDLERS ==========
  // Skip selection view if user has no existing items
  const handleNavigateToPolicy = useCallback(() => {
    if (hasExistingPolicies) {
      navigateToMode(SimulationViewMode.SETUP_POLICY);
    } else {
      navigateToMode(SimulationViewMode.POLICY_LABEL);
    }
  }, [hasExistingPolicies, navigateToMode]);

  const handleNavigateToPopulation = useCallback(() => {
    if (hasExistingPopulations) {
      navigateToMode(SimulationViewMode.SETUP_POPULATION);
    } else {
      navigateToMode(SimulationViewMode.POPULATION_SCOPE);
    }
  }, [hasExistingPopulations, navigateToMode]);

  // ========== CALLBACK FACTORIES ==========
  // Simulation-level callbacks with custom completion handler
  const simulationCallbacks = createSimulationCallbacks(
    setSimulationState,
    (state) => state,
    (_state, simulation) => simulation,
    navigateToMode,
    SimulationViewMode.SETUP,
    (_simulationId: string) => {
      // onSimulationComplete: custom navigation for standalone pathway
      navigate(`/${countryId}/simulations`);
      onComplete?.();
    }
  );

  // Policy callbacks - no custom completion (stays within simulation pathway)
  const policyCallbacks = createPolicyCallbacks(
    setSimulationState,
    (state) => state.policy,
    (state, policy) => ({ ...state, policy }),
    navigateToMode,
    SimulationViewMode.SETUP,
    undefined // No onPolicyComplete - stays within simulation pathway
  );

  // Population callbacks - no custom completion (stays within simulation pathway)
  const populationCallbacks = createPopulationCallbacks(
    setSimulationState,
    (state) => state.population,
    (state, population) => ({ ...state, population }),
    navigateToMode,
    SimulationViewMode.SETUP,
    SimulationViewMode.POPULATION_LABEL,
    undefined // No onPopulationComplete - stays within simulation pathway
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
        label: 'Current law',
        parameters: [],
      },
    }));

    navigateToMode(SimulationViewMode.SETUP);
  }, [currentLawId, navigateToMode]);

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
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
        />
      );
      break;

    case SimulationViewMode.SETUP:
      currentView = (
        <SimulationSetupView
          simulation={simulationState}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={handleNavigateToPolicy}
          onNavigateToPopulation={handleNavigateToPopulation}
          onNext={() => navigateToMode(SimulationViewMode.SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
        />
      );
      break;

    case SimulationViewMode.SUBMIT:
      currentView = (
        <SimulationSubmitView
          simulation={simulationState}
          onSubmitSuccess={simulationCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
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
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
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
            console.warn(
              '[SimulationPathwayWrapper] Copy existing not applicable in standalone mode'
            );
          }}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
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
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
        />
      );
      break;

    case SimulationViewMode.POLICY_PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={simulationState.policy}
          onPolicyUpdate={policyCallbacks.updatePolicy}
          onNext={() => navigateToMode(SimulationViewMode.POLICY_SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case SimulationViewMode.POLICY_SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={simulationState.policy}
          countryId={countryId}
          onSubmitSuccess={policyCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
        />
      );
      break;

    case SimulationViewMode.SELECT_EXISTING_POLICY:
      currentView = (
        <PolicyExistingView
          onSelectPolicy={policyCallbacks.handleSelectExisting}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
        />
      );
      break;

    // ========== POPULATION CREATION VIEWS ==========
    case SimulationViewMode.POPULATION_SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={regionData}
          onScopeSelected={populationCallbacks.handleScopeSelected}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
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
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case SimulationViewMode.POPULATION_HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={simulationState.population}
          countryId={countryId}
          onSubmitSuccess={populationCallbacks.handleHouseholdSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case SimulationViewMode.POPULATION_GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={simulationState.population}
          regions={regionData}
          onSubmitSuccess={populationCallbacks.handleGeographicSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case SimulationViewMode.SELECT_EXISTING_POPULATION:
      currentView = (
        <PopulationExistingView
          onSelectHousehold={populationCallbacks.handleSelectExistingHousehold}
          onSelectGeography={populationCallbacks.handleSelectExistingGeography}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/simulations`)}
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
