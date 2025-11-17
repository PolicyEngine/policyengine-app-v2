/**
 * ReportPathwayWrapper - Pathway orchestrator for report creation
 *
 * Replaces ReportCreationFlow with local state management.
 * Manages all state for report, simulations, policies, and populations.
 *
 * Phase 3 - Complete implementation with nested simulation/policy/population flows
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ReportStateProps, SimulationStateProps, PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { ReportViewMode } from '@/types/pathwayModes/ReportViewMode';
import { initializeReportState } from '@/utils/pathwayState/initializeReportState';
import { RootState } from '@/store';
import StandardLayout from '@/components/StandardLayout';

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

import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';
import { useCreateReport } from '@/hooks/useCreateReport';
import { ReportAdapter } from '@/adapters';
import { Report } from '@/types/ingredients/Report';
import { ReportCreationPayload } from '@/types/payloads';
import { getReportOutputPath } from '@/utils/reportRouting';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([ReportViewMode.POLICY_PARAMETER_SELECTOR]);

interface ReportPathwayWrapperProps {
  countryId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function ReportPathwayWrapper({
  countryId,
  onComplete,
  onCancel,
}: ReportPathwayWrapperProps) {
  console.log('[ReportPathwayWrapper] ========== RENDER ==========');
  console.log('[ReportPathwayWrapper] countryId:', countryId);

  // Initialize report state
  const [reportState, setReportState] = useState<ReportStateProps>(() =>
    initializeReportState(countryId)
  );
  const [currentMode, setCurrentMode] = useState<ReportViewMode>(ReportViewMode.LABEL);
  const [activeSimulationIndex, setActiveSimulationIndex] = useState<0 | 1>(0);

  const navigate = useNavigate();
  const { createReport, isPending: isSubmitting } = useCreateReport(reportState.label || undefined);

  // Get metadata for population views
  const metadata = useSelector((state: RootState) => state.metadata);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  // ========== NAVIGATION HELPERS ==========
  const navigateToMode = useCallback((mode: ReportViewMode) => {
    console.log('[ReportPathwayWrapper] Navigating to mode:', mode);
    setCurrentMode(mode);
  }, []);

  // ========== REPORT-LEVEL STATE UPDATES ==========
  const updateReportLabel = useCallback((label: string) => {
    console.log('[ReportPathwayWrapper] Updating label:', label);
    setReportState((prev) => ({ ...prev, label }));
  }, []);

  const handleNavigateToSimulationSelection = useCallback((simulationIndex: 0 | 1) => {
    console.log('[ReportPathwayWrapper] Setting active simulation index:', simulationIndex);
    setActiveSimulationIndex(simulationIndex);
    setCurrentMode(ReportViewMode.SELECT_SIMULATION);
  }, []);

  const handlePrefillPopulation2 = useCallback(() => {
    console.log('[ReportPathwayWrapper] Pre-filling population 2 from simulation 1');
    setReportState((prev) => {
      const sim1Population = prev.simulations[0].population;
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[1] = {
        ...newSimulations[1],
        population: { ...sim1Population },
      };
      return {
        ...prev,
        simulations: newSimulations,
      };
    });
  }, []);

  const handleSelectExistingSimulation = useCallback((enhancedSimulation: EnhancedUserSimulation) => {
    console.log('[ReportPathwayWrapper] Selecting existing simulation:', enhancedSimulation);

    if (!enhancedSimulation.simulation) {
      console.error('[ReportPathwayWrapper] No simulation data in enhancedSimulation');
      return;
    }

    const simulation = enhancedSimulation.simulation;
    const label = enhancedSimulation.userSimulation?.label || simulation.label || '';

    // Reconstruct PolicyStateProps from enhanced data
    const policy: PolicyStateProps = {
      id: enhancedSimulation.policy?.id || simulation.policyId,
      label: enhancedSimulation.userPolicy?.label || enhancedSimulation.policy?.label || null,
      parameters: enhancedSimulation.policy?.parameters || [],
      isCreated: true,
    };

    // Reconstruct PopulationStateProps from enhanced data
    let population: PopulationStateProps;

    if (simulation.populationType === 'household' && enhancedSimulation.household) {
      population = {
        household: enhancedSimulation.household,
        geography: null,
        label: enhancedSimulation.userHousehold?.label || null,
        type: 'household',
        isCreated: true,
      };
    } else if (simulation.populationType === 'geography' && enhancedSimulation.geography) {
      population = {
        household: null,
        geography: enhancedSimulation.geography,
        label: enhancedSimulation.userHousehold?.label || null,
        type: 'geography',
        isCreated: true,
      };
    } else {
      console.error('[ReportPathwayWrapper] Unable to determine population type or missing population data');
      return;
    }

    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];

      // Update the simulation with the loaded data
      newSimulations[activeSimulationIndex] = {
        ...newSimulations[activeSimulationIndex],
        id: simulation.id,
        label,
        isCreated: true,
        policy,
        population,
      };

      return { ...prev, simulations: newSimulations };
    });
  }, [activeSimulationIndex]);

  // ========== SIMULATION-LEVEL STATE UPDATES ==========
  const updateSimulationLabel = useCallback((label: string) => {
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex] = {
        ...newSimulations[activeSimulationIndex],
        label,
      };
      return { ...prev, simulations: newSimulations };
    });
  }, [activeSimulationIndex]);

  const handleSimulationSubmitSuccess = useCallback((simulationId: string) => {
    console.log('[ReportPathwayWrapper] Simulation created with ID:', simulationId);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex] = {
        ...newSimulations[activeSimulationIndex],
        id: simulationId,
        isCreated: true,
      };
      return { ...prev, simulations: newSimulations };
    });
    // Return to setup view
    navigateToMode(ReportViewMode.SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  // ========== POLICY-LEVEL STATE UPDATES ==========
  const updatePolicyLabel = useCallback((label: string) => {
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].policy.label = label;
      return { ...prev, simulations: newSimulations };
    });
  }, [activeSimulationIndex]);

  const updatePolicy = useCallback((updatedPolicy: PolicyStateProps) => {
    console.log('[ReportPathwayWrapper] Updating policy with:', updatedPolicy);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].policy = updatedPolicy;
      return { ...prev, simulations: newSimulations };
    });
  }, [activeSimulationIndex]);

  const handleSelectCurrentLaw = useCallback(() => {
    console.log('[ReportPathwayWrapper] Selecting current law');
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].policy = {
        id: currentLawId.toString(),
        label: 'Current law',
        parameters: [],
        isCreated: true,
      };
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, currentLawId, navigateToMode]);

  const handlePolicySubmitSuccess = useCallback((policyId: string) => {
    console.log('[ReportPathwayWrapper] Policy created with ID:', policyId);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].policy.id = policyId;
      newSimulations[activeSimulationIndex].policy.isCreated = true;
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  const handleSelectExistingPolicy = useCallback((policyId: string, label: string, parameters: any[]) => {
    console.log('[ReportPathwayWrapper] Selecting existing policy:', policyId, label);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].policy = {
        id: policyId,
        label,
        parameters,
        isCreated: true,
      };
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  // ========== POPULATION-LEVEL STATE UPDATES ==========
  const handlePopulationScopeSelected = useCallback((geography: Geography | null, scopeType: string) => {
    console.log('[ReportPathwayWrapper] Population scope selected:', scopeType, geography);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      if (geography) {
        newSimulations[activeSimulationIndex].population.geography = geography;
        newSimulations[activeSimulationIndex].population.type = 'geography';
      } else {
        newSimulations[activeSimulationIndex].population.type = 'household';
      }
      return { ...prev, simulations: newSimulations };
    });

    // Navigate based on scope type
    if (scopeType === 'household') {
      navigateToMode(ReportViewMode.POPULATION_LABEL);
    } else {
      navigateToMode(ReportViewMode.POPULATION_LABEL);
    }
  }, [activeSimulationIndex, navigateToMode]);

  const updatePopulationLabel = useCallback((label: string) => {
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].population.label = label;
      return { ...prev, simulations: newSimulations };
    });
  }, [activeSimulationIndex]);

  const handleHouseholdSubmitSuccess = useCallback((householdId: string, household: Household) => {
    console.log('[ReportPathwayWrapper] Household created with ID:', householdId);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].population.household = { ...household, id: householdId };
      newSimulations[activeSimulationIndex].population.isCreated = true;
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  const handleGeographicSubmitSuccess = useCallback((geographyId: string, label: string) => {
    console.log('[ReportPathwayWrapper] Geography created with ID:', geographyId);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      if (newSimulations[activeSimulationIndex].population.geography) {
        newSimulations[activeSimulationIndex].population.geography.id = geographyId;
      }
      newSimulations[activeSimulationIndex].population.label = label;
      newSimulations[activeSimulationIndex].population.isCreated = true;
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  const handleCopyPopulationFromOtherSim = useCallback(() => {
    console.log('[ReportPathwayWrapper] Copying population from other simulation');
    const otherIndex = activeSimulationIndex === 0 ? 1 : 0;
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].population = {
        ...prev.simulations[otherIndex].population
      };
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  const handleSelectExistingHousehold = useCallback((householdId: string, household: Household, label: string) => {
    console.log('[ReportPathwayWrapper] Selecting existing household:', householdId, label);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].population.household = { ...household, id: householdId };
      newSimulations[activeSimulationIndex].population.label = label;
      newSimulations[activeSimulationIndex].population.type = 'household';
      newSimulations[activeSimulationIndex].population.isCreated = true;
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
  }, [activeSimulationIndex, navigateToMode]);

  const handleSelectExistingGeography = useCallback((geographyId: string, geography: Geography, label: string) => {
    console.log('[ReportPathwayWrapper] Selecting existing geography:', geographyId, label);
    setReportState((prev) => {
      const newSimulations = [...prev.simulations] as [typeof prev.simulations[0], typeof prev.simulations[1]];
      newSimulations[activeSimulationIndex].population.geography = { ...geography, id: geographyId };
      newSimulations[activeSimulationIndex].population.label = label;
      newSimulations[activeSimulationIndex].population.type = 'geography';
      newSimulations[activeSimulationIndex].population.isCreated = true;
      return { ...prev, simulations: newSimulations };
    });
    // Return to simulation setup
    navigateToMode(ReportViewMode.SIMULATION_SETUP);
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

    // Submit report
    createReport(
      {
        countryId: reportState.countryId,
        payload: serializedPayload,
        simulations: {
          simulation1: reportState.simulations[0] as any,
          simulation2: reportState.simulations[1] as any,
        },
        populations: {
          household1: reportState.simulations[0].population.household,
          household2: reportState.simulations[1].population.household,
          geography1: reportState.simulations[0].population.geography,
          geography2: reportState.simulations[1].population.geography,
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

  const activeSimulation = reportState.simulations[activeSimulationIndex];
  const otherSimulationIndex = activeSimulationIndex === 0 ? 1 : 0;
  const otherSimulation = reportState.simulations[otherSimulationIndex];

  // Determine which view to render based on current mode
  let currentView: React.ReactNode;

  switch (currentMode) {
    // ========== REPORT-LEVEL VIEWS ==========
    case ReportViewMode.LABEL:
      currentView = (
        <ReportLabelView
          label={reportState.label}
          onUpdateLabel={updateReportLabel}
          onNext={() => navigateToMode(ReportViewMode.SETUP)}
        />
      );
      break;

    case ReportViewMode.SETUP:
      currentView = (
        <ReportSetupView
          reportState={reportState}
          onNavigateToSimulationSelection={handleNavigateToSimulationSelection}
          onNext={() => navigateToMode(ReportViewMode.SUBMIT)}
          onPrefillPopulation2={handlePrefillPopulation2}
        />
      );
      break;

    case ReportViewMode.SELECT_SIMULATION:
      currentView = (
        <ReportSimulationSelectionView
          onCreateNew={() => navigateToMode(ReportViewMode.SIMULATION_LABEL)}
          onLoadExisting={() => navigateToMode(ReportViewMode.SELECT_EXISTING_SIMULATION)}
        />
      );
      break;

    case ReportViewMode.SELECT_EXISTING_SIMULATION:
      currentView = (
        <ReportSimulationExistingView
          activeSimulationIndex={activeSimulationIndex}
          otherSimulation={otherSimulation}
          onSelectSimulation={handleSelectExistingSimulation}
          onNext={() => navigateToMode(ReportViewMode.SETUP)}
        />
      );
      break;

    case ReportViewMode.SUBMIT:
      currentView = (
        <ReportSubmitView
          reportState={reportState}
          onSubmit={handleSubmitReport}
          isSubmitting={isSubmitting}
        />
      );
      break;

    // ========== SIMULATION-LEVEL VIEWS ==========
    case ReportViewMode.SIMULATION_LABEL:
      currentView = (
        <SimulationLabelView
          label={activeSimulation.label}
          simulationIndex={activeSimulationIndex}
          reportLabel={reportState.label}
          onUpdateLabel={updateSimulationLabel}
          onNext={() => navigateToMode(ReportViewMode.SIMULATION_SETUP)}
        />
      );
      break;

    case ReportViewMode.SIMULATION_SETUP:
      currentView = (
        <SimulationSetupView
          simulation={activeSimulation}
          simulationIndex={activeSimulationIndex}
          isReportMode={true}
          onNavigateToPolicy={() => navigateToMode(ReportViewMode.SETUP_POLICY)}
          onNavigateToPopulation={() => navigateToMode(ReportViewMode.SETUP_POPULATION)}
          onNext={() => navigateToMode(ReportViewMode.SIMULATION_SUBMIT)}
        />
      );
      break;

    case ReportViewMode.SIMULATION_SUBMIT:
      currentView = (
        <SimulationSubmitView
          simulation={activeSimulation}
          onSubmitSuccess={handleSimulationSubmitSuccess}
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
          onCopyExisting={handleCopyPopulationFromOtherSim}
        />
      );
      break;

    // ========== POLICY CREATION VIEWS ==========
    case ReportViewMode.POLICY_LABEL:
      currentView = (
        <PolicyLabelView
          label={activeSimulation.policy.label}
          simulationIndex={activeSimulationIndex}
          reportLabel={reportState.label}
          onUpdateLabel={updatePolicyLabel}
          onNext={() => navigateToMode(ReportViewMode.POLICY_PARAMETER_SELECTOR)}
        />
      );
      break;

    case ReportViewMode.POLICY_PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={activeSimulation.policy}
          onPolicyUpdate={updatePolicy}
          onNext={() => navigateToMode(ReportViewMode.POLICY_SUBMIT)}
          onReturn={() => navigateToMode(ReportViewMode.POLICY_LABEL)}
        />
      );
      break;

    case ReportViewMode.POLICY_SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={activeSimulation.policy}
          countryId={countryId}
          onSubmitSuccess={handlePolicySubmitSuccess}
        />
      );
      break;

    case ReportViewMode.SELECT_EXISTING_POLICY:
      currentView = (
        <PolicyExistingView
          onSelectPolicy={handleSelectExistingPolicy}
          onReturn={() => navigateToMode(ReportViewMode.SETUP_POLICY)}
        />
      );
      break;

    // ========== POPULATION CREATION VIEWS ==========
    case ReportViewMode.POPULATION_SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={metadata.economyOptions?.region || []}
          onScopeSelected={handlePopulationScopeSelected}
        />
      );
      break;

    case ReportViewMode.POPULATION_LABEL:
      currentView = (
        <PopulationLabelView
          population={activeSimulation.population}
          onUpdateLabel={updatePopulationLabel}
          onNext={() => {
            // Navigate based on population type
            if (activeSimulation.population.type === 'household') {
              navigateToMode(ReportViewMode.POPULATION_HOUSEHOLD_BUILDER);
            } else {
              navigateToMode(ReportViewMode.POPULATION_GEOGRAPHIC_CONFIRM);
            }
          }}
          onBack={() => navigateToMode(ReportViewMode.POPULATION_SCOPE)}
        />
      );
      break;

    case ReportViewMode.POPULATION_HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={activeSimulation.population}
          countryId={countryId}
          onSubmitSuccess={handleHouseholdSubmitSuccess}
          onReturn={() => navigateToMode(ReportViewMode.POPULATION_LABEL)}
        />
      );
      break;

    case ReportViewMode.POPULATION_GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={activeSimulation.population}
          metadata={metadata}
          onSubmitSuccess={handleGeographicSubmitSuccess}
          onReturn={() => navigateToMode(ReportViewMode.POPULATION_LABEL)}
        />
      );
      break;

    case ReportViewMode.SELECT_EXISTING_POPULATION:
      currentView = (
        <PopulationExistingView
          onSelectHousehold={handleSelectExistingHousehold}
          onSelectGeography={handleSelectExistingGeography}
          onReturn={() => navigateToMode(ReportViewMode.SETUP_POPULATION)}
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
