/**
 * ReportBuilderPage - Main page component for the report builder
 *
 * Design Direction: Refined utilitarian with distinct color coding.
 * - Policy: Secondary (slate) - authoritative, grounded
 * - Population: Primary (teal) - brand-focused, people
 * - Dynamics: Blue - forward-looking, data-driven
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mantine/core';
import { ReportAdapter, SimulationAdapter } from '@/adapters';
import { createSimulation } from '@/api/simulation';
import { CURRENT_YEAR } from '@/constants';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { getReportOutputPath } from '@/utils/reportRouting';
import { ReportMetaPanel, SimulationCanvas, TopBar } from './components';
import { styles } from './styles';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from './types';

export default function ReportBuilderPage() {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const navigate = useNavigate();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  const initialSim = initializeSimulationState();
  initialSim.label = 'Baseline simulation';

  const [reportState, setReportState] = useState<ReportBuilderState>({
    label: null,
    year: CURRENT_YEAR,
    simulations: [initialSim],
  });

  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createReport } = useCreateReport(reportState.label || undefined);

  // Any geography selection (nationwide or subnational) requires dual-simulation
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;

  useEffect(() => {
    if (isGeographySelected && reportState.simulations.length === 1) {
      const newSim = initializeSimulationState();
      newSim.label = 'Reform simulation';
      newSim.population = { ...reportState.simulations[0].population };
      setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
    }
  }, [isGeographySelected, reportState.simulations]);

  const isReportConfigured = reportState.simulations.every(
    (sim) => !!sim.policy.id && !!(sim.population.household?.id || sim.population.geography?.id)
  );

  const convertToSimulation = useCallback(
    (simState: SimulationStateProps, simulationId: string): Simulation | null => {
      const policyId = simState.policy?.id;
      if (!policyId) {
        return null;
      }

      let populationId: string | undefined;
      let populationType: 'household' | 'geography' | undefined;

      if (simState.population?.household?.id) {
        populationId = simState.population.household.id;
        populationType = 'household';
      } else if (simState.population?.geography?.geographyId) {
        populationId = simState.population.geography.geographyId;
        populationType = 'geography';
      }

      if (!populationId || !populationType) {
        return null;
      }

      return {
        id: simulationId,
        countryId,
        apiVersion: undefined,
        policyId: policyId === 'current-law' ? currentLawId.toString() : policyId,
        populationId,
        populationType,
        label: simState.label,
        isCreated: true,
        output: null,
        status: 'pending',
      };
    },
    [countryId, currentLawId]
  );

  const handleRunReport = useCallback(async () => {
    if (!isReportConfigured || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const simulationIds: string[] = [];
      const simulations: (Simulation | null)[] = [];

      for (const simState of reportState.simulations) {
        const policyId =
          simState.policy?.id === 'current-law' ? currentLawId.toString() : simState.policy?.id;

        if (!policyId) {
          console.error('[ReportBuilderPage] Simulation missing policy ID');
          continue;
        }

        let populationId: string | undefined;
        let populationType: 'household' | 'geography' | undefined;

        if (simState.population?.household?.id) {
          populationId = simState.population.household.id;
          populationType = 'household';
        } else if (simState.population?.geography?.geographyId) {
          populationId = simState.population.geography.geographyId;
          populationType = 'geography';
        }

        if (!populationId || !populationType) {
          console.error('[ReportBuilderPage] Simulation missing population');
          continue;
        }

        const simulationData: Partial<Simulation> = {
          populationId,
          policyId,
          populationType,
        };

        const payload = SimulationAdapter.toCreationPayload(simulationData);
        const result = await createSimulation(countryId, payload);
        const simulationId = result.result.simulation_id;
        simulationIds.push(simulationId);

        const simulation = convertToSimulation(simState, simulationId);
        simulations.push(simulation);
      }

      if (simulationIds.length === 0) {
        console.error('[ReportBuilderPage] No simulations created');
        setIsSubmitting(false);
        return;
      }

      const reportData: Partial<Report> = {
        countryId,
        year: reportState.year,
        simulationIds,
        apiVersion: null,
      };

      const serializedPayload = ReportAdapter.toCreationPayload(reportData as Report);

      await createReport(
        {
          countryId,
          payload: serializedPayload,
          simulations: {
            simulation1: simulations[0],
            simulation2: simulations[1] || null,
          },
          populations: {
            household1: reportState.simulations[0]?.population?.household || null,
            household2: reportState.simulations[1]?.population?.household || null,
            geography1: reportState.simulations[0]?.population?.geography || null,
            geography2: reportState.simulations[1]?.population?.geography || null,
          },
        },
        {
          onSuccess: (data) => {
            const outputPath = getReportOutputPath(countryId, data.userReport.id);
            navigate(outputPath);
          },
          onError: (error) => {
            console.error('[ReportBuilderPage] Report creation failed:', error);
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[ReportBuilderPage] Error running report:', error);
      setIsSubmitting(false);
    }
  }, [
    isReportConfigured,
    isSubmitting,
    reportState,
    countryId,
    currentLawId,
    createReport,
    convertToSimulation,
    navigate,
  ]);

  const topBarActions: TopBarAction[] = useMemo(() => [
    {
      key: 'run',
      label: 'Run',
      icon: <IconPlayerPlay size={16} />,
      onClick: handleRunReport,
      variant: 'primary',
      disabled: !isReportConfigured,
      loading: isSubmitting,
      loadingLabel: 'Running...',
    },
  ], [handleRunReport, isReportConfigured, isSubmitting]);

  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>Report builder</h1>
      </Box>

      <TopBar actions={topBarActions}>
        <ReportMetaPanel
          reportState={reportState}
          setReportState={setReportState}
        />
      </TopBar>

      <SimulationCanvas
        reportState={reportState}
        setReportState={setReportState}
        pickerState={pickerState}
        setPickerState={setPickerState}
      />
    </Box>
  );
}
