/**
 * ReportBuilderPage - Main page component for the report builder
 *
 * Design Direction: Refined utilitarian with distinct color coding.
 * - Policy: Secondary (slate) - authoritative, grounded
 * - Population: Primary (teal) - brand-focused, people
 * - Dynamics: Blue - forward-looking, data-driven
 *
 * Two view modes:
 * - Card view: 50/50 grid with square chips
 * - Row view: Stacked horizontal rows
 */

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Box, Tabs } from '@mantine/core';
import { IconLayoutColumns, IconRowInsertBottom } from '@tabler/icons-react';

import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { CURRENT_YEAR } from '@/constants';

import type { ReportBuilderState, IngredientPickerState, ViewMode } from './types';
import { COUNTRY_CONFIG } from './constants';
import { styles } from './styles';
import { SimulationCanvas, ReportMetaPanel } from './components';

export default function ReportBuilderPage() {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  renderCount.current++;

  // Reset mount time on first render
  if (renderCount.current === 1) {
    mountTime.current = performance.now();
  }

  // Debug logging for page render cycle
  console.log('[ReportBuilderPage] Render #' + renderCount.current, {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
  });

  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const [activeTab, setActiveTab] = useState<string | null>('cards');

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

  // Suppress unused variable
  void countryConfig;

  // Any geography selection (nationwide or subnational) requires dual-simulation
  // Only households allow single-simulation reports
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;

  // Debug: Track when effects run
  useLayoutEffect(() => {
    console.log('[ReportBuilderPage] useLayoutEffect START', {
      timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    });
    return () => {
      console.log('[ReportBuilderPage] useLayoutEffect CLEANUP');
    };
  });

  useEffect(() => {
    console.log('[ReportBuilderPage] useEffect (mount) START', {
      timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    });
    return () => {
      console.log('[ReportBuilderPage] useEffect (mount) CLEANUP');
    };
  }, []);

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

  const viewMode = (activeTab || 'cards') as ViewMode;

  console.log('[ReportBuilderPage] About to return JSX', {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
  });

  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>Report builder</h1>
      </Box>

      <ReportMetaPanel
        reportState={reportState}
        setReportState={setReportState}
        isReportConfigured={isReportConfigured}
      />

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="cards" leftSection={<IconLayoutColumns size={16} />}>Card view</Tabs.Tab>
          <Tabs.Tab value="rows" leftSection={<IconRowInsertBottom size={16} />}>Row view</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <SimulationCanvas
        reportState={reportState}
        setReportState={setReportState}
        pickerState={pickerState}
        setPickerState={setPickerState}
        viewMode={viewMode}
      />
    </Box>
  );
}
