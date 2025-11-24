/**
 * PopulationPathwayWrapper - Pathway orchestrator for standalone population creation
 *
 * Manages local state for a single population (household or geographic).
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import StandardLayout from '@/components/StandardLayout';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { StandalonePopulationViewMode } from '@/types/pathwayModes/PopulationViewMode';
import { PopulationStateProps } from '@/types/pathwayState';
import { createPopulationCallbacks } from '@/utils/pathwayCallbacks';
import { initializePopulationState } from '@/utils/pathwayState/initializePopulationState';
import GeographicConfirmationView from '../report/views/population/GeographicConfirmationView';
import HouseholdBuilderView from '../report/views/population/HouseholdBuilderView';
import PopulationLabelView from '../report/views/population/PopulationLabelView';
// Population views (reusing from report pathway)
import PopulationScopeView from '../report/views/population/PopulationScopeView';

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
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(
    StandalonePopulationViewMode.SCOPE
  );

  // ========== CALLBACKS ==========
  // Use shared callback factory with onPopulationComplete for standalone navigation
  const populationCallbacks = createPopulationCallbacks(
    setPopulationState,
    (state) => state, // populationSelector: return the state itself (PopulationStateProps)
    (_state, population) => population, // populationUpdater: replace entire state
    navigateToMode,
    StandalonePopulationViewMode.GEOGRAPHIC_CONFIRM, // returnMode (not used in standalone mode)
    StandalonePopulationViewMode.LABEL, // labelMode
    {
      // Custom navigation for standalone pathway: exit to households list
      onHouseholdComplete: (householdId: string, _household: Household) => {
        console.log('[PopulationPathwayWrapper] Household created with ID:', householdId);
        navigate(`/${countryId}/households`);
        onComplete?.();
      },
      onGeographyComplete: (geographyId: string, _label: string) => {
        console.log(
          '[PopulationPathwayWrapper] Geographic population created with ID:',
          geographyId
        );
        navigate(`/${countryId}/households`);
        onComplete?.();
      },
    }
  );

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    case StandalonePopulationViewMode.SCOPE:
      currentView = (
        <PopulationScopeView
          countryId={countryId}
          regionData={metadata.economyOptions?.region || []}
          onScopeSelected={populationCallbacks.handleScopeSelected}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/households`)}
        />
      );
      break;

    case StandalonePopulationViewMode.LABEL:
      currentView = (
        <PopulationLabelView
          population={populationState}
          mode="standalone"
          onUpdateLabel={populationCallbacks.updateLabel}
          onNext={() => {
            // Navigate based on population type
            if (populationState.type === 'household') {
              navigateToMode(StandalonePopulationViewMode.HOUSEHOLD_BUILDER);
            } else {
              navigateToMode(StandalonePopulationViewMode.GEOGRAPHIC_CONFIRM);
            }
          }}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case StandalonePopulationViewMode.HOUSEHOLD_BUILDER:
      currentView = (
        <HouseholdBuilderView
          population={populationState}
          countryId={countryId}
          onSubmitSuccess={populationCallbacks.handleHouseholdSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case StandalonePopulationViewMode.GEOGRAPHIC_CONFIRM:
      currentView = (
        <GeographicConfirmationView
          population={populationState}
          metadata={metadata}
          onSubmitSuccess={populationCallbacks.handleGeographicSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  return <StandardLayout>{currentView}</StandardLayout>;
}
