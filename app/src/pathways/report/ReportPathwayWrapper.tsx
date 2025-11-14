/**
 * ReportPathwayWrapper - Pathway orchestrator for report creation
 *
 * Replaces ReportCreationFlow with local state management.
 * Manages all state for report, simulations, policies, and populations.
 *
 * Phase 2 - Initial implementation with basic flow only.
 * TODO: Add nested simulation/policy/population creation flows (Phase 3+)
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportStateProps } from '@/types/pathwayState';
import { ReportViewMode } from '@/types/pathwayModes/ReportViewMode';
import { initializeReportState } from '@/utils/pathwayState/initializeReportState';
import ReportLabelView from './views/ReportLabelView';
import ReportSetupView from './views/ReportSetupView';
import ReportSimulationSelectionView from './views/ReportSimulationSelectionView';
import ReportSimulationExistingView from './views/ReportSimulationExistingView';
import ReportSubmitView from './views/ReportSubmitView';
import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';
import { useCreateReport } from '@/hooks/useCreateReport';
import { ReportAdapter } from '@/adapters';
import { Report } from '@/types/ingredients/Report';
import { ReportCreationPayload } from '@/types/payloads';
import { getReportOutputPath } from '@/utils/reportRouting';

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

  // Navigation helpers
  const navigateToMode = useCallback((mode: ReportViewMode) => {
    console.log('[ReportPathwayWrapper] Navigating to mode:', mode);
    setCurrentMode(mode);
  }, []);

  // State update helpers
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
    // TODO: Implement population prefill logic
    // For now, just copy the population from simulation 1 to simulation 2
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
    // TODO: Map EnhancedUserSimulation to SimulationStateProps
    // For now, placeholder implementation
    alert('Selecting existing simulations not yet implemented in Phase 2');
  }, []);

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
          simulation1: reportState.simulations[0] as any, // TODO: Convert SimulationStateProps to Simulation
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

  // Render current view
  console.log('[ReportPathwayWrapper] Current mode:', currentMode);

  switch (currentMode) {
    case ReportViewMode.LABEL:
      return (
        <ReportLabelView
          label={reportState.label}
          onUpdateLabel={updateReportLabel}
          onNext={() => navigateToMode(ReportViewMode.SETUP)}
        />
      );

    case ReportViewMode.SETUP:
      return (
        <ReportSetupView
          reportState={reportState}
          onNavigateToSimulationSelection={handleNavigateToSimulationSelection}
          onNext={() => navigateToMode(ReportViewMode.SUBMIT)}
          onPrefillPopulation2={handlePrefillPopulation2}
        />
      );

    case ReportViewMode.SELECT_SIMULATION:
      return (
        <ReportSimulationSelectionView
          onCreateNew={() => {
            // TODO: Navigate to simulation creation flow (Phase 3+)
            alert('Creating new simulations not yet implemented in Phase 2');
          }}
          onLoadExisting={() => navigateToMode(ReportViewMode.SELECT_EXISTING_SIMULATION)}
        />
      );

    case ReportViewMode.SELECT_EXISTING_SIMULATION:
      const otherIndex = activeSimulationIndex === 0 ? 1 : 0;
      return (
        <ReportSimulationExistingView
          activeSimulationIndex={activeSimulationIndex}
          otherSimulation={reportState.simulations[otherIndex]}
          onSelectSimulation={handleSelectExistingSimulation}
          onNext={() => navigateToMode(ReportViewMode.SETUP)}
        />
      );

    case ReportViewMode.SUBMIT:
      return (
        <ReportSubmitView
          reportState={reportState}
          onSubmit={handleSubmitReport}
          isSubmitting={isSubmitting}
        />
      );

    default:
      return <div>Unknown view mode: {currentMode}</div>;
  }
}
