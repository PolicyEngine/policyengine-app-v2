/**
 * PopulationPathwayWrapper - Pathway orchestrator for standalone population creation
 *
 * Manages local state for a single population (household or geographic).
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import StandardLayout from '@/components/StandardLayout';
import { CURRENT_YEAR } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
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
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();

  const handleCancel = useCallback(() => {
    nav.push(`/${countryId}/households`);
  }, [nav, countryId]);

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
      onHouseholdComplete: (_householdId: string, _household: Household) => {
        nav.push(`/${countryId}/households`);
        onComplete?.();
      },
      onGeographyComplete: (_geographyId: string, _label: string) => {
        nav.push(`/${countryId}/households`);
        onComplete?.();
      },
    }
  );

  // Redirect to listing page on unknown view mode
  const isValidMode = Object.values(StandalonePopulationViewMode).includes(
    currentMode as StandalonePopulationViewMode
  );
  useEffect(() => {
    if (!isValidMode) {
      console.error(`[PopulationPathwayWrapper] Unknown view mode: ${currentMode}`);
      nav.push(`/${countryId}/households`);
    }
  }, [isValidMode, currentMode, nav, countryId]);

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
          onCancel={handleCancel}
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
      currentView = <></>;
  }

  return (
    <ReportYearProvider year={CURRENT_YEAR}>
      <StandardLayout>{currentView}</StandardLayout>
    </ReportYearProvider>
  );
}
