/**
 * useSimulationCanvas - State management hook for the simulation canvas
 *
 * Owns:
 * - Data fetching (policies, households, regions) and loading state
 * - Computed/derived data (savedPolicies, recentPopulations)
 * - Modal visibility state (policy browse, population browse, policy creation)
 * - All simulation mutation callbacks (add, remove, select, deselect, etc.)
 *
 * The component that consumes this hook is responsible only for rendering.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { RootState } from '@/store';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import {
  getUSStates,
  getUSCongressionalDistricts,
  getUSPlaces,
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
  SavedPolicy,
  RecentPopulation,
  PolicyBrowseState,
} from '../types';
import { getSamplePopulations } from '../constants';

interface UseSimulationCanvasArgs {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
}

export function useSimulationCanvas({
  reportState,
  setReportState,
  pickerState,
  setPickerState,
}: UseSimulationCanvasArgs) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading: policiesLoading } = useUserPolicies(userId);
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);
  const regionOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const metadataLoading = useSelector((state: RootState) => state.metadata.loading);
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;

  // Show loading skeleton until all data sources have resolved.
  // Region options check guards against a race condition where metadata initial
  // state has loading=false but region=[] before the actual data arrives.
  const isInitialLoading = policiesLoading || householdsLoading || metadataLoading ||
    policies === undefined || households === undefined ||
    regionOptions.length === 0;

  // ---------------------------------------------------------------------------
  // Modal visibility state
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Computed / derived data
  // ---------------------------------------------------------------------------

  const savedPolicies: SavedPolicy[] = useMemo(() => {
    return (policies || [])
      .map((p) => {
        const policyId = p.association.policyId.toString();
        return {
          id: policyId,
          label: p.association.label || `Policy #${policyId}`,
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
  }, [policies]);

  const recentPopulations: RecentPopulation[] = useMemo(() => {
    const results: Array<RecentPopulation & { timestamp: string }> = [];

    const regions = regionOptions || [];
    const allRegions: RegionOption[] = countryId === 'us'
      ? [...getUSStates(regions), ...getUSCongressionalDistricts(regions), ...getUSPlaces()]
      : [...getUKCountries(regions), ...getUKConstituencies(regions), ...getUKLocalAuthorities(regions)];

    for (const geoId of geographyUsageStore.getRecentIds(10)) {
      if (geoId === 'us' || geoId === 'uk') { continue; }

      const region = allRegions.find((r) => r.value === geoId);
      if (!region) { continue; }

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
        timestamp: geographyUsageStore.getLastUsed(geoId) || '',
      });
    }

    for (const householdId of householdUsageStore.getRecentIds(10)) {
      const householdData = households?.find((h) => String(h.association.householdId) === householdId);
      if (!householdData?.household) { continue; }

      const household = HouseholdAdapter.fromMetadata(householdData.household);
      const resolvedId = household.id || householdId;
      const label = householdData.association.label || `Household #${householdId}`;
      results.push({
        id: resolvedId,
        label,
        type: 'household',
        population: {
          geography: null,
          household,
          label,
          type: 'household',
        },
        timestamp: householdUsageStore.getLastUsed(householdId) || '',
      });
    }

    return results
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10)
      .map(({ timestamp: _t, ...rest }) => rest);
  }, [countryId, households, regionOptions]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Update a simulation's population at `index`, and if it's the baseline (0)
   * propagate the same population to sim[1] when it exists.
   */
  const updatePopulationWithInheritance = useCallback(
    (simulationIndex: number, population: PopulationStateProps) => {
      setReportState((prev) => {
        const newSimulations = prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, population: { ...population } } : sim
        );

        if (simulationIndex === 0 && newSimulations.length > 1) {
          newSimulations[1] = { ...newSimulations[1], population: { ...population } };
        }

        return { ...prev, simulations: newSimulations };
      });
    },
    [setReportState],
  );

  /** Update a single simulation's policy at `index`. */
  const updatePolicy = useCallback(
    (simulationIndex: number, policy: PolicyStateProps) => {
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) =>
          i === simulationIndex ? { ...sim, policy } : sim
        ),
      }));
    },
    [setReportState],
  );

  // ---------------------------------------------------------------------------
  // Simulation-level actions
  // ---------------------------------------------------------------------------

  const handleAddSimulation = useCallback(() => {
    if (reportState.simulations.length >= 2) { return; }
    const newSim = initializeSimulationState();
    newSim.label = 'Reform simulation';
    newSim.population = { ...reportState.simulations[0].population };
    setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
  }, [reportState.simulations, setReportState]);

  const handleRemoveSimulation = useCallback((index: number) => {
    if (index === 0) { return; }
    setReportState((prev) => ({ ...prev, simulations: prev.simulations.filter((_, i) => i !== index) }));
  }, [setReportState]);

  const handleSimulationLabelChange = useCallback((index: number, label: string) => {
    setReportState((prev) => ({
      ...prev,
      simulations: prev.simulations.map((sim, i) => i === index ? { ...sim, label } : sim),
    }));
  }, [setReportState]);

  // ---------------------------------------------------------------------------
  // Policy actions
  // ---------------------------------------------------------------------------

  const handleQuickSelectPolicy = useCallback(
    (simulationIndex: number) => {
      updatePolicy(simulationIndex, { id: 'current-law', label: 'Current law', parameters: [] });
    },
    [updatePolicy],
  );

  const handleSelectSavedPolicy = useCallback(
    (simulationIndex: number, policyId: string, label: string, paramCount: number) => {
      updatePolicy(simulationIndex, { id: policyId, label, parameters: Array(paramCount).fill({}) });
    },
    [updatePolicy],
  );

  const handleDeselectPolicy = useCallback(
    (simulationIndex: number) => {
      updatePolicy(simulationIndex, initializePolicyState());
    },
    [updatePolicy],
  );

  const handleBrowseMorePolicies = useCallback(
    (simulationIndex: number) => {
      setPolicyBrowseState({ isOpen: true, simulationIndex });
    },
    [],
  );

  const handlePolicySelectFromBrowse = useCallback(
    (policy: PolicyStateProps) => {
      updatePolicy(policyBrowseState.simulationIndex, policy);
    },
    [policyBrowseState.simulationIndex, updatePolicy],
  );

  const handlePolicyCreated = useCallback(
    (simulationIndex: number, policy: PolicyStateProps) => {
      updatePolicy(simulationIndex, {
        id: policy.id,
        label: policy.label,
        parameters: policy.parameters,
      });
    },
    [updatePolicy],
  );

  // ---------------------------------------------------------------------------
  // Population actions
  // ---------------------------------------------------------------------------

  const handleQuickSelectPopulation = useCallback(
    (simulationIndex: number, _populationType: 'nationwide') => {
      const populationState = getSamplePopulations(countryId).nationwide;

      if (populationState.geography?.geographyId) {
        geographyUsageStore.recordUsage(populationState.geography.geographyId);
      }

      updatePopulationWithInheritance(simulationIndex, populationState);
    },
    [countryId, updatePopulationWithInheritance],
  );

  const handleSelectRecentPopulation = useCallback(
    (simulationIndex: number, population: PopulationStateProps) => {
      if (population.geography?.geographyId) {
        geographyUsageStore.recordUsage(population.geography.geographyId);
      } else if (population.household?.id) {
        householdUsageStore.recordUsage(population.household.id);
      }

      updatePopulationWithInheritance(simulationIndex, population);
    },
    [updatePopulationWithInheritance],
  );

  const handleDeselectPopulation = useCallback(
    (simulationIndex: number) => {
      updatePopulationWithInheritance(simulationIndex, initializePopulationState());
    },
    [updatePopulationWithInheritance],
  );

  const handleBrowseMorePopulations = useCallback(
    (simulationIndex: number) => {
      setPopulationBrowseState({ isOpen: true, simulationIndex });
    },
    [],
  );

  const handlePopulationSelectFromBrowse = useCallback(
    (population: PopulationStateProps) => {
      updatePopulationWithInheritance(populationBrowseState.simulationIndex, population);
    },
    [populationBrowseState.simulationIndex, updatePopulationWithInheritance],
  );

  // ---------------------------------------------------------------------------
  // Ingredient picker / create-custom actions
  // ---------------------------------------------------------------------------

  const handleIngredientSelect = useCallback(
    (item: PolicyStateProps | PopulationStateProps | null) => {
      const { simulationIndex, ingredientType } = pickerState;
      if (ingredientType === 'policy') {
        updatePolicy(simulationIndex, item as PolicyStateProps);
      } else if (ingredientType === 'population') {
        updatePopulationWithInheritance(simulationIndex, item as PopulationStateProps);
      }
    },
    [pickerState, updatePolicy, updatePopulationWithInheritance],
  );

  const handleCreateCustom = useCallback(
    (simulationIndex: number, ingredientType: IngredientType) => {
      if (ingredientType === 'policy') {
        setPolicyCreationState({ isOpen: true, simulationIndex });
      } else if (ingredientType === 'population') {
        window.location.href = `/${countryId}/households/create`;
      }
    },
    [countryId],
  );

  // ---------------------------------------------------------------------------
  // Modal close helpers
  // ---------------------------------------------------------------------------

  const closePolicyBrowse = useCallback(
    () => setPolicyBrowseState((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  const closePolicyCreation = useCallback(
    () => setPolicyCreationState((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  const closePopulationBrowse = useCallback(
    () => setPopulationBrowseState((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  const closeIngredientPicker = useCallback(
    () => setPickerState((prev) => ({ ...prev, isOpen: false })),
    [setPickerState],
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    countryId,
    isInitialLoading,
    isGeographySelected,

    // Computed data
    savedPolicies,
    recentPopulations,

    // Simulation actions
    handleAddSimulation,
    handleRemoveSimulation,
    handleSimulationLabelChange,

    // Policy actions
    handleQuickSelectPolicy,
    handleSelectSavedPolicy,
    handleDeselectPolicy,
    handleBrowseMorePolicies,
    handlePolicySelectFromBrowse,
    handlePolicyCreated,

    // Population actions
    handleQuickSelectPopulation,
    handleSelectRecentPopulation,
    handleDeselectPopulation,
    handleBrowseMorePopulations,
    handlePopulationSelectFromBrowse,

    // Ingredient picker / custom
    handleIngredientSelect,
    handleCreateCustom,

    // Modal state
    pickerState,
    policyBrowseState,
    policyCreationState,
    populationBrowseState,
    closePolicyBrowse,
    closePolicyCreation,
    closePopulationBrowse,
    closeIngredientPicker,
  };
}
