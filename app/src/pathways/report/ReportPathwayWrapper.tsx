/**
 * ReportPathwayWrapper - Pathway orchestrator for report creation
 *
 * Replaces ReportCreationFlow with local state management.
 * Manages all state for report, simulations, policies, and populations.
 *
 * Phase 3 - Complete implementation with nested simulation/policy/population flows
 */

import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ReportStateProps, SimulationStateProps, PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { ReportViewMode } from '@/types/pathwayModes/ReportViewMode';
import { initializeReportState } from '@/utils/pathwayState/initializeReportState';
import { RootState } from '@/store';
import StandardLayout from '@/components/StandardLayout';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { createPolicyCallbacks, createPopulationCallbacks, createSimulationCallbacks, createReportCallbacks } from '@/utils/pathwayCallbacks';
import { reconstructSimulationFromEnhanced, convertSimulationStateToApi } from '@/utils/ingredientReconstruction';
import { countryIds } from '@/libs/countries';

// Report-level views
import ReportLabelView from './views/ReportLabelView';
import ReportSetupView from './views/ReportSetupView';
import ReportSimulationSelectionView from './views/ReportSimulationSelectionView';
import ReportSimulationExistingView from './views/ReportSimulationExistingView';
import ReportSubmitView from './views/ReportSubmitView';

// Simulation views
import SimulationLabelView from './views/simulation/SimulationLabelView';
import SimulationSetupView from './views/simulation/SimulationSetupView';
import SimulationSubmitView from './views/simulation/SimulationSubmitView';
import SimulationPolicySetupView from './views/simulation/SimulationPolicySetupView';
import SimulationPopulationSetupView from './views/simulation/SimulationPopulationSetupView';

// Policy views
import PolicyLabelView from './views/policy/PolicyLabelView';
import PolicyParameterSelectorView from './views/policy/PolicyParameterSelectorView';
import PolicySubmitView from './views/policy/PolicySubmitView';
import PolicyExistingView from './views/policy/PolicyExistingView';

// Population views
import PopulationScopeView from './views/population/PopulationScopeView';
import PopulationLabelView from './views/population/PopulationLabelView';
import HouseholdBuilderView from './views/population/HouseholdBuilderView';
import GeographicConfirmationView from './views/population/GeographicConfirmationView';
import PopulationExistingView from './views/population/PopulationExistingView';

import { EnhancedUserSimulation, useUserSimulations } from '@/hooks/useUserSimulations';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserGeographics } from '@/hooks/useUserGeographic';
import { useCreateReport } from '@/hooks/useCreateReport';
import { ReportAdapter } from '@/adapters';
import { Report } from '@/types/ingredients/Report';
import { ReportCreationPayload } from '@/types/payloads';
import { getReportOutputPath } from '@/utils/reportRouting';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { MOCK_USER_ID } from '@/constants';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([ReportViewMode.POLICY_PARAMETER_SELECTOR]);

interface ReportPathwayWrapperProps {
  onComplete?: () => void;
}

export default function ReportPathwayWrapper({ onComplete }: ReportPathwayWrapperProps) {
  const { countryId: countryIdParam } = useParams<{ countryId: string }>();
  const navigate = useNavigate();

  // Validate countryId from URL params
  if (!countryIdParam) {
    return <div>Error: Country ID not found</div>;
  }

  if (!countryIds.includes(countryIdParam as any)) {
    return <div>Error: Invalid country ID</div>;
  }

  const countryId = countryIdParam as (typeof countryIds)[number];

  console.log('[ReportPathwayWrapper] ========== RENDER ==========');
  console.log('[ReportPathwayWrapper] countryId:', countryId);

  // Initialize report state
  const [reportState, setReportState] = useState<ReportStateProps>(() =>
    initializeReportState(countryId)
  );
  const [activeSimulationIndex, setActiveSimulationIndex] = useState<0 | 1>(0);

  const { createReport, isPending: isSubmitting } = useCreateReport(reportState.label || undefined);

  // Get metadata for population views
  const metadata = useSelector((state: RootState) => state.metadata);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(ReportViewMode.REPORT_LABEL);

  // ========== FETCH USER DATA FOR CONDITIONAL NAVIGATION ==========
  const userId = MOCK_USER_ID.toString();
  const { data: userSimulations } = useUserSimulations(userId);
  const { data: userPolicies } = useUserPolicies(userId);
  const { data: userHouseholds } = useUserHouseholds(userId);
  const { data: userGeographics } = useUserGeographics(userId);

  const hasExistingSimulations = (userSimulations?.length ?? 0) > 0;
  const hasExistingPolicies = (userPolicies?.length ?? 0) > 0;
  const hasExistingPopulations = ((userHouseholds?.length ?? 0) + (userGeographics?.length ?? 0)) > 0;

  // ========== HELPER: Get active simulation ==========
  const activeSimulation = reportState.simulations[activeSimulationIndex];
  const otherSimulation = reportState.simulations[activeSimulationIndex === 0 ? 1 : 0];

  // ========== SHARED CALLBACK FACTORIES ==========
  // Report-level callbacks
  const reportCallbacks = createReportCallbacks(
    setReportState,
    navigateToMode,
    activeSimulationIndex,
    ReportViewMode.REPORT_SELECT_SIMULATION,
    ReportViewMode.REPORT_SETUP
  );

  // Policy callbacks for active simulation
  const policyCallbacks = createPolicyCallbacks(
    setReportState,
    (state) => state.simulations[activeSimulationIndex].policy,
    (state, policy) => {
      const newSimulations = [...state.simulations] as [typeof state.simulations[0], typeof state.simulations[1]];
      newSimulations[activeSimulationIndex].policy = policy;
      return { ...state, simulations: newSimulations };
    },
    navigateToMode,
    ReportViewMode.SIMULATION_SETUP
  );

  // Population callbacks for active simulation
  const populationCallbacks = createPopulationCallbacks(
    setReportState,
    (state) => state.simulations[activeSimulationIndex].population,
    (state, population) => {
      const newSimulations = [...state.simulations] as [typeof state.simulations[0], typeof state.simulations[1]];
      newSimulations[activeSimulationIndex].population = population;
      return { ...state, simulations: newSimulations };
    },
    navigateToMode,
    ReportViewMode.SIMULATION_SETUP,
    ReportViewMode.POPULATION_LABEL
  );

  // Simulation callbacks for active simulation
  const simulationCallbacks = createSimulationCallbacks(
    setReportState,
    (state) => state.simulations[activeSimulationIndex],
    (state, simulation) => {
      const newSimulations = [...state.simulations] as [typeof state.simulations[0], typeof state.simulations[1]];
      newSimulations[activeSimulationIndex] = simulation;
      return { ...state, simulations: newSimulations };
    },
    navigateToMode,
    ReportViewMode.REPORT_SETUP
  );

  // ========== CUSTOM WRAPPERS FOR SPECIFIC REPORT LOGIC ==========
  // Wrapper for navigating to simulation selection (needs to update active index)
  // Skips selection view if user has no existing simulations
  const handleNavigateToSimulationSelection = useCallback((simulationIndex: 0 | 1) => {
    console.log('[ReportPathwayWrapper] Setting active simulation index:', simulationIndex);
    setActiveSimulationIndex(simulationIndex);
    if (hasExistingSimulations) {
      reportCallbacks.navigateToSimulationSelection(simulationIndex);
    } else {
      // Skip selection view, go directly to create new
      navigateToMode(ReportViewMode.SIMULATION_LABEL);
    }
  }, [reportCallbacks, hasExistingSimulations, navigateToMode]);

  // Conditional navigation to policy setup - skip if no existing policies
  const handleNavigateToPolicy = useCallback(() => {
    if (hasExistingPolicies) {
      navigateToMode(ReportViewMode.SETUP_POLICY);
    } else {
      // Skip selection view, go directly to create new
      navigateToMode(ReportViewMode.POLICY_LABEL);
    }
  }, [hasExistingPolicies, navigateToMode]);

  // Conditional navigation to population setup - skip if no existing populations
  const handleNavigateToPopulation = useCallback(() => {
    if (hasExistingPopulations) {
      navigateToMode(ReportViewMode.SETUP_POPULATION);
    } else {
      // Skip selection view, go directly to create new
      navigateToMode(ReportViewMode.POPULATION_SCOPE);
    }
  }, [hasExistingPopulations, navigateToMode]);

  // Wrapper for current law selection with custom logging
  const handleSelectCurrentLaw = useCallback(() => {
    console.log('[ReportPathwayWrapper] Selecting current law');
    policyCallbacks.handleSelectCurrentLaw(currentLawId, 'Current law');
  }, [currentLawId, policyCallbacks]);

  // Handler for selecting default baseline simulation
  // This is called after the simulation has been created by DefaultBaselineOption
  const handleSelectDefaultBaseline = useCallback((simulationState: SimulationStateProps, simulationId: string) => {
    console.log('[ReportPathwayWrapper] Default baseline simulation created');
    console.log('[ReportPathwayWrapper] Simulation state:', simulationState);
    console.log('[ReportPathwayWrapper] Simulation ID:', simulationId);

    // Update the active simulation with the created simulation
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex] = simulationState;
      return { ...prev, simulations: newSimulations };
    });

    // Navigate back to report setup
    navigateToMode(ReportViewMode.REPORT_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  // ========== REPORT SUBMISSION ==========
  const handleSubmitReport = useCallback(() => {
    console.log('[ReportPathwayWrapper] ========== SUBMIT REPORT ==========');
    console.log('[ReportPathwayWrapper] Report state:', reportState);

    const sim1Id = reportState.simulations[0]?.id;
    const sim2Id = reportState.simulations[1]?.id;

    // Validation
    if (!sim1Id) {
      console.error('[ReportPathwayWrapper] Cannot submit: no baseline simulation');
      return;
    }

    // Prepare report data
    const reportData: Partial<Report> = {
      countryId: reportState.countryId,
      simulationIds: [sim1Id, sim2Id].filter(Boolean) as string[],
      apiVersion: reportState.apiVersion,
    };

    const serializedPayload: ReportCreationPayload = ReportAdapter.toCreationPayload(
      reportData as Report
    );

    // Convert SimulationStateProps to Simulation format for CalcOrchestrator
    const simulation1Api = convertSimulationStateToApi(reportState.simulations[0]);
    const simulation2Api = convertSimulationStateToApi(reportState.simulations[1]);

    if (!simulation1Api) {
      console.error('[ReportPathwayWrapper] Failed to convert simulation1 to API format');
      return;
    }

    console.log('[ReportPathwayWrapper] Converted simulations to API format:', {
      simulation1: { id: simulation1Api.id, policyId: simulation1Api.policyId, populationId: simulation1Api.populationId },
      simulation2: simulation2Api ? { id: simulation2Api.id, policyId: simulation2Api.policyId, populationId: simulation2Api.populationId } : null,
    });

    // Submit report
    createReport(
      {
        countryId: reportState.countryId,
        payload: serializedPayload,
        simulations: {
          simulation1: simulation1Api,
          simulation2: simulation2Api,
        },
        populations: {
          household1: reportState.simulations[0].population.household,
          household2: reportState.simulations[1]?.population.household,
          geography1: reportState.simulations[0].population.geography,
          geography2: reportState.simulations[1]?.population.geography,
        },
      },
      {
        onSuccess: (data) => {
          console.log('[ReportPathwayWrapper] Report created:', data.userReport);
          const outputPath = getReportOutputPath(reportState.countryId, data.userReport.id);
          navigate(outputPath);
          onComplete?.();
        },
        onError: (error) => {
          console.error('[ReportPathwayWrapper] Report creation failed:', error);
        },
      }
    );
  }, [reportState, createReport, navigate, onComplete]);

  // ========== RENDER CURRENT VIEW ==========
  console.log('[ReportPathwayWrapper] Current mode:', currentMode);

  // Determine which view to render based on current mode
  let currentView: React.ReactNode;

  switch (currentMode) {
    // ========== REPORT-LEVEL VIEWS ==========
    case ReportViewMode.REPORT_LABEL:
      currentView = (
        <ReportLabelView
          label={reportState.label}
          onUpdateLabel={reportCallbacks.updateLabel}
          onNext={() => navigateToMode(ReportViewMode.REPORT_SETUP)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.REPORT_SETUP:
      currentView = (
        <ReportSetupView
          reportState={reportState}
          onNavigateToSimulationSelection={handleNavigateToSimulationSelection}
          onNext={() => navigateToMode(ReportViewMode.REPORT_SUBMIT)}
          onPrefillPopulation2={reportCallbacks.prefillPopulation2FromSimulation1}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.REPORT_SELECT_SIMULATION:
      currentView = (
        <ReportSimulationSelectionView
          simulationIndex={activeSimulationIndex}
          countryId={countryId}
          currentLawId={currentLawId}
          onCreateNew={() => navigateToMode(ReportViewMode.SIMULATION_LABEL)}
          onLoadExisting={() => navigateToMode(ReportViewMode.REPORT_SELECT_EXISTING_SIMULATION)}
          onSelectDefaultBaseline={handleSelectDefaultBaseline}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.REPORT_SELECT_EXISTING_SIMULATION:
      currentView = (
        <ReportSimulationExistingView
          activeSimulationIndex={activeSimulationIndex}
          otherSimulation={otherSimulation}
          onSelectSimulation={reportCallbacks.handleSelectExistingSimulation}
          onNext={() => navigateToMode(ReportViewMode.REPORT_SETUP)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.REPORT_SUBMIT:
      currentView = (
        <ReportSubmitView
          reportState={reportState}
          onSubmit={handleSubmitReport}
          isSubmitting={isSubmitting}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    // ========== SIMULATION-LEVEL VIEWS ==========
    case ReportViewMode.SIMULATION_LABEL:
      currentView = (
        <SimulationLabelView
          label={activeSimulation.label}
          mode="report"
          simulationIndex={activeSimulationIndex}
          reportLabel={reportState.label}
          onUpdateLabel={simulationCallbacks.updateLabel}
          onNext={() => navigateToMode(ReportViewMode.SIMULATION_SETUP)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.SIMULATION_SETUP:
      currentView = (
        <SimulationSetupView
          simulation={activeSimulation}
          simulationIndex={activeSimulationIndex}
          isReportMode={true}
          onNavigateToPolicy={handleNavigateToPolicy}
          onNavigateToPopulation={handleNavigateToPopulation}
          onNext={() => navigateToMode(ReportViewMode.SIMULATION_SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.SIMULATION_SUBMIT:
      currentView = (
        <SimulationSubmitView
          simulation={activeSimulation}
          onSubmitSuccess={simulationCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    // ========== POLICY SETUP COORDINATION ==========
    case ReportViewMode.SETUP_POLICY:
      currentView = (
        <SimulationPolicySetupView
          currentLawId={currentLawId}
          countryId={countryId}
          onSelectCurrentLaw={handleSelectCurrentLaw}
          onCreateNew={() => navigateToMode(ReportViewMode.POLICY_LABEL)}
          onLoadExisting={() => navigateToMode(ReportViewMode.SELECT_EXISTING_POLICY)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    // ========== POPULATION SETUP COORDINATION ==========
    case ReportViewMode.SETUP_POPULATION:
      currentView = (
        <SimulationPopulationSetupView
          isReportMode={true}
          otherSimulation={otherSimulation}
          otherPopulation={otherSimulation.population}
          onCreateNew={() => navigateToMode(ReportViewMode.POPULATION_SCOPE)}
          onLoadExisting={() => navigateToMode(ReportViewMode.SELECT_EXISTING_POPULATION)}
          onCopyExisting={reportCallbacks.copyPopulationFromOtherSimulation}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    // ========== POLICY CREATION VIEWS ==========
    case ReportViewMode.POLICY_LABEL:
      currentView = (
        <PolicyLabelView
          label={activeSimulation.policy.label}
          mode="report"
          simulationIndex={activeSimulationIndex}
          reportLabel={reportState.label}
          onUpdateLabel={policyCallbacks.updateLabel}
          onNext={() => navigateToMode(ReportViewMode.POLICY_PARAMETER_SELECTOR)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.POLICY_PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={activeSimulation.policy}
          onPolicyUpdate={policyCallbacks.updatePolicy}
          onNext={() => navigateToMode(ReportViewMode.POLICY_SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case ReportViewMode.POLICY_SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={activeSimulation.policy}
          countryId={countryId}
          onSubmitSuccess={policyCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.SELECT_EXISTING_POLICY:
      currentView = (
        <PolicyExistingView
          onSelectPolicy={policyCallbacks.handleSelectExisting}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    // ========== POPULATION CREATION VIEWS ==========
    case ReportViewMode.POPULATION_SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={metadata.economyOptions?.region || []}
          onScopeSelected={populationCallbacks.handleScopeSelected}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    case ReportViewMode.POPULATION_LABEL:
      currentView = (
        <PopulationLabelView
          population={activeSimulation.population}
          mode="report"
          simulationIndex={activeSimulationIndex}
          reportLabel={reportState.label}
          onUpdateLabel={populationCallbacks.updateLabel}
          onNext={() => {
            // Navigate based on population type
            if (activeSimulation.population.type === 'household') {
              navigateToMode(ReportViewMode.POPULATION_HOUSEHOLD_BUILDER);
            } else {
              navigateToMode(ReportViewMode.POPULATION_GEOGRAPHIC_CONFIRM);
            }
          }}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case ReportViewMode.POPULATION_HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={activeSimulation.population}
          countryId={countryId}
          onSubmitSuccess={populationCallbacks.handleHouseholdSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case ReportViewMode.POPULATION_GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={activeSimulation.population}
          metadata={metadata}
          onSubmitSuccess={populationCallbacks.handleGeographicSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case ReportViewMode.SELECT_EXISTING_POPULATION:
      currentView = (
        <PopulationExistingView
          onSelectHousehold={populationCallbacks.handleSelectExistingHousehold}
          onSelectGeography={populationCallbacks.handleSelectExistingGeography}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/reports`)}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  // Conditionally wrap with StandardLayout
  // Views in MODES_WITH_OWN_LAYOUT manage their own AppShell
  const needsStandardLayout = !MODES_WITH_OWN_LAYOUT.has(currentMode);

  // This is a workaround to allow the param setter to manage its own AppShell
  return needsStandardLayout ? <StandardLayout>{currentView}</StandardLayout> : currentView;
}
