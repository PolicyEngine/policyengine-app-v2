/**
 * SimulationCanvas - Main orchestrator for simulation blocks
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Box, Skeleton, Stack, Group, Text } from '@mantine/core';
import { IconScale, IconUsers } from '@tabler/icons-react';

import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { RootState } from '@/store';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import {
  getUSStates,
  getUSCongressionalDistricts,
  getUKCountries,
  getUKConstituencies,
  getUKLocalAuthorities,
  RegionOption,
} from '@/utils/regionStrategies';
import { generateGeographyLabel } from '@/utils/geographyUtils';
import { geographyUsageStore, householdUsageStore } from '@/api/usageTracking';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
import { initializePopulationState } from '@/utils/pathwayState/initializePopulationState';
import { Geography } from '@/types/ingredients/Geography';
import { PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { MOCK_USER_ID } from '@/constants';

import type {
  ReportBuilderState,
  IngredientPickerState,
  IngredientType,
  ViewMode,
  SavedPolicy,
  RecentPopulation,
  PolicyBrowseState,
} from '../types';
import { COUNTRY_CONFIG, getSamplePopulations } from '../constants';
import { styles } from '../styles';
import { SimulationBlock } from './SimulationBlock';
import { AddSimulationCard } from './AddSimulationCard';
import { IngredientPickerModal, PolicyBrowseModal, PopulationBrowseModal, PolicyCreationModal } from '../modals';

interface SimulationCanvasProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  viewMode: ViewMode;
}

export function SimulationCanvas({
  reportState,
  setReportState,
  pickerState,
  setPickerState,
  viewMode,
}: SimulationCanvasProps) {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  renderCount.current++;

  if (renderCount.current === 1) {
    mountTime.current = performance.now();
  }

  console.log('[SimulationCanvas] Render #' + renderCount.current + ' START', {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
  });

  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading: policiesLoading } = useUserPolicies(userId);
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);
  const regionOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const metadataLoading = useSelector((state: RootState) => state.metadata.loading);
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;

  // Show loading skeleton if:
  // 1. Policies/households are still loading (isLoading is true)
  // 2. Data is still undefined (hasn't resolved yet)
  // 3. Metadata is still loading (needed for regions)
  const isInitialLoading = policiesLoading || householdsLoading || metadataLoading ||
    policies === undefined || households === undefined;

  // Debug logging for render cycle analysis
  console.log('[SimulationCanvas] Data state:', {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    policiesLoading,
    householdsLoading,
    metadataLoading,
    policiesUndefined: policies === undefined,
    householdsUndefined: households === undefined,
    policiesCount: policies?.length ?? 'undefined',
    householdsCount: households?.length ?? 'undefined',
    isInitialLoading,
    regionOptionsCount: regionOptions?.length ?? 0,
  });

  // Track when effects run
  useEffect(() => {
    console.log('[SimulationCanvas] useEffect (mount) ran', {
      timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    });
    return () => {
      console.log('[SimulationCanvas] useEffect (mount) cleanup');
    };
  }, []);

  // Suppress unused variable
  void countryConfig;

  // State for modals
  const [policyBrowseState, setPolicyBrowseState] = useState<PolicyBrowseState>({
    isOpen: false,
    simulationIndex: 0,
  });

  const [policyCreationState, setPolicyCreationState] = useState<PolicyBrowseState>({
    isOpen: false,
    simulationIndex: 0,
  });

  const [populationBrowseState, setPopulationBrowseState] = useState<PolicyBrowseState>({
    isOpen: false,
    simulationIndex: 0,
  });

  // Transform policies data into SavedPolicy format
  const savedPolicies: SavedPolicy[] = useMemo(() => {
    const start = performance.now();
    const result = (policies || [])
      .map((p) => {
        const policyId = p.association.policyId.toString();
        const label = p.association.label || `Policy #${policyId}`;
        return {
          id: policyId,
          label,
          paramCount: countPolicyModifications(p.policy),
          createdAt: p.association.createdAt,
          updatedAt: p.association.updatedAt,
        };
      })
      .sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || '';
        const bTime = b.updatedAt || b.createdAt || '';
        return bTime.localeCompare(aTime);
      });
    console.log('[SimulationCanvas] useMemo savedPolicies took', (performance.now() - start).toFixed(2) + 'ms');
    return result;
  }, [policies]);

  // Build recent populations from usage tracking
  const recentPopulations: RecentPopulation[] = useMemo(() => {
    const start = performance.now();
    const results: Array<RecentPopulation & { timestamp: string }> = [];

    const regions = regionOptions || [];
    const allRegions: RegionOption[] = countryId === 'us'
      ? [...getUSStates(regions), ...getUSCongressionalDistricts(regions)]
      : [...getUKCountries(regions), ...getUKConstituencies(regions), ...getUKLocalAuthorities(regions)];

    const recentGeoIds = geographyUsageStore.getRecentIds(10);
    for (const geoId of recentGeoIds) {
      if (geoId === 'us' || geoId === 'uk') continue;

      const timestamp = geographyUsageStore.getLastUsed(geoId) || '';
      const region = allRegions.find((r) => r.value === geoId);

      if (region) {
        const geographyId = `${countryId}-${geoId}`;
        const geography: Geography = {
          id: geographyId,
          countryId,
          scope: 'subnational',
          geographyId: geoId,
        };
        results.push({
          id: geographyId,
          label: region.label,
          type: 'geography',
          population: {
            geography,
            household: null,
            label: generateGeographyLabel(geography),
            type: 'geography',
          },
          timestamp,
        });
      }
    }

    const recentHouseholdIds = householdUsageStore.getRecentIds(10);
    for (const householdId of recentHouseholdIds) {
      const timestamp = householdUsageStore.getLastUsed(householdId) || '';
      const householdData = households?.find((h) => String(h.association.householdId) === householdId);
      if (householdData?.household) {
        const household = HouseholdAdapter.fromMetadata(householdData.household);
        const resolvedId = household.id || householdId;
        results.push({
          id: resolvedId,
          label: householdData.association.label || `Household #${householdId}`,
          type: 'household',
          population: {
            geography: null,
            household,
            label: householdData.association.label || `Household #${householdId}`,
            type: 'household',
          },
          timestamp,
        });
      }
    }

    const result = results
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10)
      .map(({ timestamp: _t, ...rest }) => rest);
    console.log('[SimulationCanvas] useMemo recentPopulations took', (performance.now() - start).toFixed(2) + 'ms');
    return result;
  }, [countryId, households, regionOptions]);

  const handleAddSimulation = useCallback(() => {
    if (reportState.simulations.length >= 2) return;
    const newSim = initializeSimulationState();
    newSim.label = 'Reform simulation';
    newSim.population = { ...reportState.simulations[0].population };
    setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
  }, [reportState.simulations, setReportState]);

  const handleRemoveSimulation = useCallback((index: number) => {
    if (index === 0) return;
    setReportState((prev) => ({ ...prev, simulations: prev.simulations.filter((_, i) => i !== index) }));
  }, [setReportState]);

  const handleSimulationLabelChange = useCallback((index: number, label: string) => {
    setReportState((prev) => ({
      ...prev,
      simulations: prev.simulations.map((sim, i) => i === index ? { ...sim, label } : sim),
    }));
  }, [setReportState]);

  const handleIngredientSelect = useCallback(
    (item: PolicyStateProps | PopulationStateProps | null) => {
      const { simulationIndex, ingredientType } = pickerState;
      setReportState((prev) => {
        const newSimulations = prev.simulations.map((sim, i) => {
          if (i !== simulationIndex) return sim;
          if (ingredientType === 'policy') return { ...sim, policy: item as PolicyStateProps };
          if (ingredientType === 'population') return { ...sim, population: item as PopulationStateProps };
          return sim;
        });
        if (ingredientType === 'population' && simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...(item as PopulationStateProps) } };
        }
        return { ...prev, simulations: newSimulations };
      });
    },
    [pickerState, setReportState]
  );

  const handleQuickSelectPolicy = useCallback(
    (simulationIndex: number) => {
      const policyState: PolicyStateProps = { id: 'current-law', label: 'Current law', parameters: [] };
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) => i === simulationIndex ? { ...sim, policy: policyState } : sim),
      }));
    },
    [setReportState]
  );

  const handleSelectSavedPolicy = useCallback(
    (simulationIndex: number, policyId: string, label: string, paramCount: number) => {
      const policyState: PolicyStateProps = { id: policyId, label, parameters: Array(paramCount).fill({}) };
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) => i === simulationIndex ? { ...sim, policy: policyState } : sim),
      }));
    },
    [setReportState]
  );

  const handleBrowseMorePolicies = useCallback(
    (simulationIndex: number) => {
      setPolicyBrowseState({ isOpen: true, simulationIndex });
    },
    []
  );

  const handlePolicySelectFromBrowse = useCallback(
    (policy: PolicyStateProps) => {
      const { simulationIndex } = policyBrowseState;
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, policy } : sim
        ),
      }));
    },
    [policyBrowseState, setReportState]
  );

  const handleBrowseMorePopulations = useCallback(
    (simulationIndex: number) => {
      setPopulationBrowseState({ isOpen: true, simulationIndex });
    },
    []
  );

  const handlePopulationSelectFromBrowse = useCallback(
    (population: PopulationStateProps) => {
      const { simulationIndex } = populationBrowseState;

      setReportState((prev) => {
        const newPopulation = { ...population };

        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, population: newPopulation } : sim
        );

        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...newPopulation } };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [populationBrowseState, setReportState]
  );

  const handleQuickSelectPopulation = useCallback(
    (simulationIndex: number, populationType: 'nationwide') => {
      const samplePopulations = getSamplePopulations(countryId);
      const populationState = samplePopulations.nationwide;

      if (populationState.geography?.geographyId) {
        geographyUsageStore.recordUsage(populationState.geography.geographyId);
      }

      setReportState((prev) => {
        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, population: { ...populationState } } : sim
        );

        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...populationState } };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [countryId, setReportState]
  );

  const handleSelectRecentPopulation = useCallback(
    (simulationIndex: number, population: PopulationStateProps) => {
      if (population.geography?.geographyId) {
        geographyUsageStore.recordUsage(population.geography.geographyId);
      } else if (population.household?.id) {
        householdUsageStore.recordUsage(population.household.id);
      }

      setReportState((prev) => {
        const newPopulation = { ...population };

        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, population: newPopulation } : sim
        );

        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...newPopulation } };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [setReportState]
  );

  const handleDeselectPolicy = useCallback(
    (simulationIndex: number) => {
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) =>
          i === simulationIndex
            ? { ...sim, policy: initializePolicyState() }
            : sim
        ),
      }));
    },
    [setReportState]
  );

  const handleDeselectPopulation = useCallback(
    (simulationIndex: number) => {
      setReportState((prev) => {
        let newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex
            ? { ...sim, population: initializePopulationState() }
            : sim
        );

        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = {
            ...newSimulations[1],
            population: initializePopulationState(),
          };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [setReportState]
  );

  const handleCreateCustom = useCallback(
    (simulationIndex: number, ingredientType: IngredientType) => {
      if (ingredientType === 'policy') {
        setPolicyCreationState({ isOpen: true, simulationIndex });
      } else if (ingredientType === 'population') {
        window.location.href = `/${countryId}/households/create`;
      }
    },
    [countryId]
  );

  const handlePolicyCreated = useCallback(
    (simulationIndex: number, policy: PolicyStateProps) => {
      setReportState((prev) => {
        const newSimulations = [...prev.simulations];
        if (newSimulations[simulationIndex]) {
          newSimulations[simulationIndex] = {
            ...newSimulations[simulationIndex],
            policy: {
              id: policy.id,
              label: policy.label,
              parameters: policy.parameters,
            },
          };
        }
        return { ...prev, simulations: newSimulations };
      });
    },
    [setReportState]
  );

  console.log('[SimulationCanvas] All hooks/callbacks defined', {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    modalsState: {
      policyBrowseOpen: policyBrowseState.isOpen,
      policyCreationOpen: policyCreationState.isOpen,
      populationBrowseOpen: populationBrowseState.isOpen,
      pickerOpen: pickerState.isOpen,
    },
  });

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Box style={styles.canvasContainer}>
      <Box style={styles.canvasGrid} />
      <Box style={styles.simulationsGrid}>
        {/* Simulation block skeleton */}
        <Box
          style={{
            background: 'white',
            borderRadius: 12,
            border: '2px solid #e5e7eb',
            padding: 24,
            gridRow: 'span 4',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Header skeleton */}
          <Group justify="space-between">
            <Skeleton height={24} width={180} radius="md" />
            <Skeleton height={20} width={20} radius="sm" />
          </Group>

          {/* Policy section skeleton */}
          <Box style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <Group gap={8} mb={12}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={60} radius="sm" />
            </Group>
            <Group gap={8}>
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
            </Group>
          </Box>

          {/* Population section skeleton */}
          <Box style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <Group gap={8} mb={12}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={80} radius="sm" />
            </Group>
            <Group gap={8}>
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
              <Skeleton height={80} style={{ flex: 1 }} radius="md" />
            </Group>
          </Box>

          {/* Dynamics section skeleton */}
          <Box style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <Group gap={8} mb={12}>
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={16} width={70} radius="sm" />
            </Group>
            <Skeleton height={48} radius="md" />
          </Box>
        </Box>

        {/* Add simulation card skeleton */}
        <Box
          style={{
            background: 'white',
            borderRadius: 12,
            border: '2px dashed #d1d5db',
            padding: 24,
            gridRow: 'span 4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Skeleton height={48} width={48} radius="xl" />
          <Skeleton height={20} width={140} radius="sm" />
          <Skeleton height={14} width={200} radius="sm" />
        </Box>
      </Box>
    </Box>
  );

  // Show loading skeleton while fetching initial data
  if (isInitialLoading) {
    console.log('[SimulationCanvas] Returning LoadingSkeleton', {
      timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
    });
    return <LoadingSkeleton />;
  }

  console.log('[SimulationCanvas] About to return full JSX (modals will mount)', {
    timeSinceMount: (performance.now() - mountTime.current).toFixed(2) + 'ms',
  });

  return (
    <>
      <Box style={styles.canvasContainer}>
        <Box style={styles.canvasGrid} />
        <Box style={styles.simulationsGrid}>
          <SimulationBlock
            simulation={reportState.simulations[0]}
            index={0}
            countryId={countryId}
            onLabelChange={(label) => handleSimulationLabelChange(0, label)}
            onQuickSelectPolicy={() => handleQuickSelectPolicy(0)}
            onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(0, id, label, paramCount)}
            onQuickSelectPopulation={() => handleQuickSelectPopulation(0, 'nationwide')}
            onSelectRecentPopulation={(pop) => handleSelectRecentPopulation(0, pop)}
            onDeselectPolicy={() => handleDeselectPolicy(0)}
            onDeselectPopulation={() => handleDeselectPopulation(0)}
            onCreateCustomPolicy={() => handleCreateCustom(0, 'policy')}
            onBrowseMorePolicies={() => handleBrowseMorePolicies(0)}
            onBrowseMorePopulations={() => handleBrowseMorePopulations(0)}
            canRemove={false}
            savedPolicies={savedPolicies}
            recentPopulations={recentPopulations}
            viewMode={viewMode}
          />

          {reportState.simulations.length > 1 ? (
            <SimulationBlock
              simulation={reportState.simulations[1]}
              index={1}
              countryId={countryId}
              onLabelChange={(label) => handleSimulationLabelChange(1, label)}
              onQuickSelectPolicy={() => handleQuickSelectPolicy(1)}
              onSelectSavedPolicy={(id, label, paramCount) => handleSelectSavedPolicy(1, id, label, paramCount)}
              onQuickSelectPopulation={() => handleQuickSelectPopulation(1, 'nationwide')}
              onSelectRecentPopulation={(pop) => handleSelectRecentPopulation(1, pop)}
              onDeselectPolicy={() => handleDeselectPolicy(1)}
              onDeselectPopulation={() => handleDeselectPopulation(1)}
              onCreateCustomPolicy={() => handleCreateCustom(1, 'policy')}
              onBrowseMorePolicies={() => handleBrowseMorePolicies(1)}
              onBrowseMorePopulations={() => handleBrowseMorePopulations(1)}
              onRemove={() => handleRemoveSimulation(1)}
              canRemove={!isGeographySelected}
              isRequired={isGeographySelected}
              populationInherited={true}
              inheritedPopulation={reportState.simulations[0].population}
              savedPolicies={savedPolicies}
              recentPopulations={recentPopulations}
              viewMode={viewMode}
            />
          ) : (
            <AddSimulationCard onClick={handleAddSimulation} disabled={false} />
          )}
        </Box>
      </Box>

      <IngredientPickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        type={pickerState.ingredientType}
        onSelect={handleIngredientSelect}
        onCreateNew={() => handleCreateCustom(pickerState.simulationIndex, pickerState.ingredientType)}
      />

      <PolicyBrowseModal
        isOpen={policyBrowseState.isOpen}
        onClose={() => setPolicyBrowseState((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handlePolicySelectFromBrowse}
      />

      <PopulationBrowseModal
        isOpen={populationBrowseState.isOpen}
        onClose={() => setPopulationBrowseState((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handlePopulationSelectFromBrowse}
        onCreateNew={() => handleCreateCustom(populationBrowseState.simulationIndex, 'population')}
      />

      <PolicyCreationModal
        isOpen={policyCreationState.isOpen}
        onClose={() => setPolicyCreationState((prev) => ({ ...prev, isOpen: false }))}
        onPolicyCreated={(policy) => handlePolicyCreated(policyCreationState.simulationIndex, policy)}
        simulationIndex={policyCreationState.simulationIndex}
      />
    </>
  );
}
