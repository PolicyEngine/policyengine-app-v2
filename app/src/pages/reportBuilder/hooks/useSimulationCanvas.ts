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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { geographyUsageStore, householdUsageStore } from '@/api/usageTracking';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { Geography } from '@/types/ingredients/Geography';
import { PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { generateGeographyLabel } from '@/utils/geographyUtils';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
import { initializePopulationState } from '@/utils/pathwayState/initializePopulationState';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import {
  getUKConstituencies,
  getUKCountries,
  getUKLocalAuthorities,
  getUSCongressionalDistricts,
  getUSPlaces,
  getUSStates,
  RegionOption,
} from '@/utils/regionStrategies';
import { getSamplePopulations } from '../constants';
import { createCurrentLawPolicy } from '../currentLaw';
import type {
  HouseholdEditorState,
  IngredientPickerState,
  IngredientType,
  PolicyBrowseState,
  RecentPopulation,
  ReportBuilderState,
  SavedPolicy,
} from '../types';

interface UseSimulationCanvasArgs {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
}

const REGION_LOAD_TIMEOUT_MS = 10_000;

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
  const { data: regions, isLoading: regionsLoading } = useRegions(countryId);
  const regionRecords = regions ?? [];
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;
  const [hasRegionLoadTimedOut, setHasRegionLoadTimedOut] = useState(false);

  const isWaitingForRegions = regionsLoading || regionRecords.length === 0;

  useEffect(() => {
    if (!isWaitingForRegions) {
      setHasRegionLoadTimedOut(false);
      return;
    }

    setHasRegionLoadTimedOut(false);
    const timeoutId = window.setTimeout(() => {
      setHasRegionLoadTimedOut(true);
    }, REGION_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [countryId, isWaitingForRegions]);

  // Show loading skeleton until the primary data sources resolve. Regions are
  // best-effort here; if they never arrive, stop blocking the builder after a
  // short timeout instead of rendering a permanent skeleton.
  const isInitialLoading =
    policiesLoading ||
    householdsLoading ||
    policies === undefined ||
    households === undefined ||
    (!hasRegionLoadTimedOut && isWaitingForRegions);

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
  const [householdEditorState, setHouseholdEditorState] = useState<HouseholdEditorState>({
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

    const allRegions: RegionOption[] =
      countryId === 'us'
        ? [
            ...getUSStates(regionRecords),
            ...getUSCongressionalDistricts(regionRecords),
            ...getUSPlaces(regionRecords),
          ]
        : [
            ...getUKCountries(regionRecords),
            ...getUKConstituencies(regionRecords),
            ...getUKLocalAuthorities(regionRecords),
          ];

    for (const geoId of geographyUsageStore.getRecentIds(10)) {
      if (geoId === 'us' || geoId === 'uk') {
        continue;
      }

      const region = allRegions.find((r) => r.value === geoId);
      if (!region) {
        continue;
      }

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
      const householdData = households?.find(
        (h) => String(h.association.householdId) === householdId
      );
      if (!householdData?.household) {
        continue;
      }

      const household = householdData.household;
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
  }, [countryId, households, regionRecords]);

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
    [setReportState]
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
    [setReportState]
  );

  // ---------------------------------------------------------------------------
  // Simulation-level actions
  // ---------------------------------------------------------------------------

  const handleAddSimulation = useCallback(() => {
    setReportState((prev) => {
      if (prev.simulations.length >= 2) {
        return prev;
      }
      const newSim = initializeSimulationState();
      newSim.label = 'Reform simulation';
      newSim.population = { ...prev.simulations[0].population };
      return { ...prev, simulations: [...prev.simulations, newSim] };
    });
  }, [setReportState]);

  const handleRemoveSimulation = useCallback(
    (index: number) => {
      if (index === 0) {
        return;
      }
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.filter((_, i) => i !== index),
      }));
    },
    [setReportState]
  );

  const handleSimulationLabelChange = useCallback(
    (index: number, label: string) => {
      setReportState((prev) => ({
        ...prev,
        simulations: prev.simulations.map((sim, i) => (i === index ? { ...sim, label } : sim)),
      }));
    },
    [setReportState]
  );

  // ---------------------------------------------------------------------------
  // Policy actions
  // ---------------------------------------------------------------------------

  const handleQuickSelectPolicy = useCallback(
    (simulationIndex: number) => {
      updatePolicy(simulationIndex, createCurrentLawPolicy());
    },
    [updatePolicy]
  );

  const handleSelectSavedPolicy = useCallback(
    (simulationIndex: number, policyId: string, label: string, paramCount: number) => {
      updatePolicy(simulationIndex, {
        id: policyId,
        label,
        parameters: Array(paramCount).fill({}),
      });
    },
    [updatePolicy]
  );

  const handleDeselectPolicy = useCallback(
    (simulationIndex: number) => {
      updatePolicy(simulationIndex, initializePolicyState());
    },
    [updatePolicy]
  );

  const handleBrowseMorePolicies = useCallback((simulationIndex: number) => {
    setPolicyBrowseState({ isOpen: true, simulationIndex });
  }, []);

  const handlePolicySelectFromBrowse = useCallback(
    (policy: PolicyStateProps) => {
      updatePolicy(policyBrowseState.simulationIndex, policy);
    },
    [policyBrowseState.simulationIndex, updatePolicy]
  );

  const handlePolicyCreated = useCallback(
    (simulationIndex: number, policy: PolicyStateProps) => {
      updatePolicy(simulationIndex, {
        id: policy.id,
        label: policy.label,
        parameters: policy.parameters,
      });
    },
    [updatePolicy]
  );

  const handleEditPolicy = useCallback(
    (simulationIndex: number) => {
      const currentPolicy = reportState.simulations[simulationIndex]?.policy;
      if (!currentPolicy?.id) {
        return;
      }

      // Resolve full parameters: in-session policies have real params,
      // saved policies have placeholder Array(n).fill({})
      let resolvedPolicy = currentPolicy;
      const hasRealParams =
        currentPolicy.parameters.length > 0 && !!currentPolicy.parameters[0]?.name;
      if (!hasRealParams && currentPolicy.id) {
        const fullPolicy = policies?.find(
          (p) => p.association.policyId.toString() === currentPolicy.id
        );
        if (fullPolicy?.policy?.parameters) {
          resolvedPolicy = {
            ...currentPolicy,
            parameters: fullPolicy.policy.parameters,
          };
        }
      }

      setPolicyCreationState({
        isOpen: true,
        simulationIndex,
        initialPolicy: resolvedPolicy,
      });
    },
    [reportState.simulations, policies]
  );

  const handleViewPolicy = useCallback(
    (simulationIndex: number) => {
      const currentPolicy = reportState.simulations[simulationIndex]?.policy;
      if (!currentPolicy?.id) {
        return;
      }

      // Resolve full parameters (same as handleEditPolicy)
      let resolvedPolicy = currentPolicy;
      const hasRealParams =
        currentPolicy.parameters.length > 0 && !!currentPolicy.parameters[0]?.name;
      if (!hasRealParams && currentPolicy.id) {
        const fullPolicy = policies?.find(
          (p) => p.association.policyId.toString() === currentPolicy.id
        );
        if (fullPolicy?.policy?.parameters) {
          resolvedPolicy = {
            ...currentPolicy,
            parameters: fullPolicy.policy.parameters,
          };
        }
      }

      setPolicyCreationState({
        isOpen: true,
        simulationIndex,
        initialPolicy: resolvedPolicy,
        initialEditorMode: 'display',
      });
    },
    [reportState.simulations, policies]
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
    [countryId, updatePopulationWithInheritance]
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
    [updatePopulationWithInheritance]
  );

  const handleDeselectPopulation = useCallback(
    (simulationIndex: number) => {
      updatePopulationWithInheritance(simulationIndex, initializePopulationState());
    },
    [updatePopulationWithInheritance]
  );

  const handleBrowseMorePopulations = useCallback((simulationIndex: number) => {
    setPopulationBrowseState({ isOpen: true, simulationIndex });
  }, []);

  const handlePopulationSelectFromBrowse = useCallback(
    (population: PopulationStateProps) => {
      updatePopulationWithInheritance(populationBrowseState.simulationIndex, population);
    },
    [populationBrowseState.simulationIndex, updatePopulationWithInheritance]
  );

  const handleHouseholdSaved = useCallback(
    (population: PopulationStateProps) => {
      updatePopulationWithInheritance(householdEditorState.simulationIndex, population);
    },
    [householdEditorState.simulationIndex, updatePopulationWithInheritance]
  );

  const handleViewPopulation = useCallback(
    (simulationIndex: number) => {
      const currentPopulation = reportState.simulations[simulationIndex]?.population;
      const householdId = currentPopulation?.household?.id;

      if (!householdId || !currentPopulation?.household) {
        return;
      }

      const initialAssociation = households?.find(
        (item) => String(item.association.householdId) === householdId
      )?.association;

      setHouseholdEditorState({
        isOpen: true,
        simulationIndex,
        initialPopulation: currentPopulation,
        initialAssociation,
        initialEditorMode: 'display',
      });
    },
    [households, reportState.simulations]
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
    [pickerState, updatePolicy, updatePopulationWithInheritance]
  );

  const handleCreateCustom = useCallback(
    (simulationIndex: number, ingredientType: IngredientType) => {
      if (ingredientType === 'policy') {
        setPolicyCreationState({ isOpen: true, simulationIndex });
      } else if (ingredientType === 'population') {
        setHouseholdEditorState({
          isOpen: true,
          simulationIndex,
          initialEditorMode: 'create',
        });
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Modal close helpers
  // ---------------------------------------------------------------------------

  const closePolicyBrowse = useCallback(
    () => setPolicyBrowseState((prev) => ({ ...prev, isOpen: false })),
    []
  );

  const closePolicyCreation = useCallback(
    () => setPolicyCreationState((prev) => ({ ...prev, isOpen: false })),
    []
  );

  const closePopulationBrowse = useCallback(
    () => setPopulationBrowseState((prev) => ({ ...prev, isOpen: false })),
    []
  );
  const closeHouseholdEditor = useCallback(
    () => setHouseholdEditorState((prev) => ({ ...prev, isOpen: false })),
    []
  );
  const returnToPolicyBrowse = useCallback(() => {
    setPolicyCreationState((prev) => ({ ...prev, isOpen: false }));
    setPolicyBrowseState({
      isOpen: true,
      simulationIndex: policyCreationState.simulationIndex,
    });
  }, [policyCreationState.simulationIndex]);
  const returnToPopulationBrowse = useCallback(() => {
    setHouseholdEditorState((prev) => ({ ...prev, isOpen: false }));
    setPopulationBrowseState({
      isOpen: true,
      simulationIndex: householdEditorState.simulationIndex,
    });
  }, [householdEditorState.simulationIndex]);

  const closeIngredientPicker = useCallback(
    () => setPickerState((prev) => ({ ...prev, isOpen: false })),
    [setPickerState]
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
    handleEditPolicy,
    handleViewPolicy,
    handleBrowseMorePolicies,
    handlePolicySelectFromBrowse,
    handlePolicyCreated,

    // Population actions
    handleQuickSelectPopulation,
    handleSelectRecentPopulation,
    handleDeselectPopulation,
    handleBrowseMorePopulations,
    handlePopulationSelectFromBrowse,
    handleHouseholdSaved,
    handleViewPopulation,

    // Ingredient picker / custom
    handleIngredientSelect,
    handleCreateCustom,

    // Modal state
    pickerState,
    policyBrowseState,
    policyCreationState,
    populationBrowseState,
    householdEditorState,
    closePolicyBrowse,
    closePolicyCreation,
    closePopulationBrowse,
    closeHouseholdEditor,
    returnToPolicyBrowse,
    returnToPopulationBrowse,
    closeIngredientPicker,
  };
}
