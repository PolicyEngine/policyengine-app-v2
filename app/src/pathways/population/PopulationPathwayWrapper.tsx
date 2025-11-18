/**
 * PopulationPathwayWrapper - Pathway orchestrator for standalone population creation
 *
 * Manages local state for a single population (household or geographic).
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PopulationStateProps } from '@/types/pathwayState';
import { PopulationViewMode } from '@/types/pathwayModes/PopulationViewMode';
import { initializePopulationState } from '@/utils/pathwayState/initializePopulationState';
import { RootState } from '@/store';
import StandardLayout from '@/components/StandardLayout';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';

// Population views (reusing from report pathway)
import PopulationScopeView from '../report/views/population/PopulationScopeView';
import PopulationLabelView from '../report/views/population/PopulationLabelView';
import HouseholdBuilderView from '../report/views/population/HouseholdBuilderView';
import GeographicConfirmationView from '../report/views/population/GeographicConfirmationView';

interface PopulationPathwayWrapperProps {
  onComplete?: () => void;
}

export default function PopulationPathwayWrapper({ onComplete }: PopulationPathwayWrapperProps) {
  console.log('[PopulationPathwayWrapper] ========== RENDER ==========');

  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  // Initialize population state
  const [populationState, setPopulationState] = useState<PopulationStateProps>(() => {
    return initializePopulationState();
  });

  // Get metadata for views
  const metadata = useSelector((state: RootState) => state.metadata);

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(PopulationViewMode.SCOPE);

  // ========== CALLBACKS ==========
  const updateLabel = useCallback((label: string) => {
    setPopulationState((prev) => ({ ...prev, label }));
  }, []);

  const handleScopeSelected = useCallback((geography: Geography | null, _scopeType: string) => {
    setPopulationState((prev) => ({
      ...prev,
      geography: geography || null,
      type: geography ? 'geography' : 'household',
    }));
    navigateToMode(PopulationViewMode.LABEL);
  }, [navigateToMode]);

  const handleHouseholdSubmitSuccess = useCallback((householdId: string, household: Household) => {
    console.log('[PopulationPathwayWrapper] Household created with ID:', householdId);

    setPopulationState((prev) => ({
      ...prev,
      household: { ...household, id: householdId },
    }));

    // Navigate back to populations list page
    navigate(`/${countryId}/households`);

    if (onComplete) {
      onComplete();
    }
  }, [navigate, countryId, onComplete]);

  const handleGeographicSubmitSuccess = useCallback((geographyId: string, label: string) => {
    console.log('[PopulationPathwayWrapper] Geographic population created with ID:', geographyId);

    setPopulationState((prev) => {
      const updatedPopulation = { ...prev };
      if (updatedPopulation.geography) {
        updatedPopulation.geography.id = geographyId;
      }
      updatedPopulation.label = label;
      return updatedPopulation;
    });

    // Navigate back to populations list page
    navigate(`/${countryId}/households`);

    if (onComplete) {
      onComplete();
    }
  }, [navigate, countryId, onComplete]);

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    case PopulationViewMode.SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={metadata.economyOptions?.region || []}
          onScopeSelected={handleScopeSelected}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/households`)}
        />
      );
      break;

    case PopulationViewMode.LABEL:
      currentView = (
        <PopulationLabelView
          population={populationState}
          mode="standalone"
          onUpdateLabel={updateLabel}
          onNext={() => {
            // Navigate based on population type
            if (populationState.type === 'household') {
              navigateToMode(PopulationViewMode.HOUSEHOLD_BUILDER);
            } else {
              navigateToMode(PopulationViewMode.GEOGRAPHIC_CONFIRM);
            }
          }}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case PopulationViewMode.HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={populationState}
          countryId={countryId}
          onSubmitSuccess={handleHouseholdSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case PopulationViewMode.GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={populationState}
          metadata={metadata}
          onSubmitSuccess={handleGeographicSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  return <StandardLayout>{currentView}</StandardLayout>;
}
